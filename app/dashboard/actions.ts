"use server";

import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { AIError, DIVISIONS, findMatches, writeCoachEmail, type AthleteProfile, type CoachEmail, type Division, type MatchResult } from "@/lib/ai";
import { LIMITS } from "@/lib/plans";

export type MatchState = {
  error?: string;
  run?: { id: number; result: MatchResult };
  profile?: AthleteProfile;
};

export type EmailState = { error?: string; email?: CoachEmail };

function field(formData: FormData, name: string, max: number) {
  return String(formData.get(name) ?? "").trim().slice(0, max);
}

export async function findMatchesAction(prev: MatchState, formData: FormData): Promise<MatchState> {
  const user = await getCurrentUser();
  if (!user) return { ...prev, error: "Your session expired. Please log in again." };

  const profile: AthleteProfile = {
    firstName: field(formData, "firstName", 40),
    team: formData.get("team") === "women" ? "women" : "men",
    event: field(formData, "event", 60),
    mark: field(formData, "mark", 30),
    otherEvents: field(formData, "otherEvents", 200),
    gradYear: field(formData, "gradYear", 4),
    gpa: field(formData, "gpa", 10),
    homeState: field(formData, "homeState", 40),
    divisions: formData.getAll("divisions").map(String).filter((d): d is Division => DIVISIONS.includes(d as Division)),
    preferences: field(formData, "preferences", 400),
  };

  if (!profile.firstName || !profile.event || !profile.mark || !profile.gradYear) {
    return { run: prev.run, profile, error: "Fill in your first name, main event, PR and grad year." };
  }
  if (profile.divisions.length === 0) {
    return { run: prev.run, profile, error: "Pick at least one division." };
  }

  // Remember the profile so the form is pre-filled next time.
  await sql()`
    INSERT INTO athlete_profiles (user_id, data) VALUES (${user.id}, ${JSON.stringify(profile)})
    ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
  `;

  const limits = LIMITS[user.plan];
  const [{ count }] = (await sql()`SELECT count(*)::int AS count FROM match_runs WHERE user_id = ${user.id}`) as { count: number }[];
  if (count >= limits.matchRuns) {
    return { run: prev.run, profile, error: "The free plan includes one school search. Upgrade to Pro above for unlimited searches and 10 schools each time." };
  }

  try {
    const result = await findMatches(profile, limits.schoolsPerRun);
    const [row] = (await sql()`
      INSERT INTO match_runs (user_id, profile, result)
      VALUES (${user.id}, ${JSON.stringify(profile)}, ${JSON.stringify(result)})
      RETURNING id
    `) as { id: number }[];
    return { run: { id: row.id, result }, profile };
  } catch (error) {
    if (error instanceof AIError) return { run: prev.run, profile, error: error.message };
    throw error;
  }
}

export async function writeEmailAction(runId: number, schoolIndex: number): Promise<EmailState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session expired. Please log in again." };

  const runs = (await sql()`
    SELECT profile, result FROM match_runs WHERE id = ${runId} AND user_id = ${user.id}
  `) as { profile: AthleteProfile; result: MatchResult }[];
  const run = runs[0];
  const school = run?.result.schools[schoolIndex];
  if (!run || !school) return { error: "That school wasn't found." };

  const existing = (await sql()`
    SELECT subject, body FROM coach_emails WHERE run_id = ${runId} AND school_index = ${schoolIndex}
  `) as CoachEmail[];
  if (existing[0]) return { email: existing[0] };

  const [{ count }] = (await sql()`SELECT count(*)::int AS count FROM coach_emails WHERE user_id = ${user.id}`) as { count: number }[];
  if (count >= LIMITS[user.plan].emails) {
    return { error: "The free plan includes one coach email. Upgrade to Pro above for unlimited emails." };
  }

  try {
    const email = await writeCoachEmail(run.profile, school);
    await sql()`
      INSERT INTO coach_emails (user_id, run_id, school_index, subject, body)
      VALUES (${user.id}, ${runId}, ${schoolIndex}, ${email.subject}, ${email.body})
      ON CONFLICT (run_id, school_index) DO NOTHING
    `;
    return { email };
  } catch (error) {
    if (error instanceof AIError) return { error: error.message };
    throw error;
  }
}
