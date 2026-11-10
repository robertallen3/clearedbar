import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// Reads ANTHROPIC_API_KEY from the environment. Never put the key in code.
const client = new Anthropic();

const MODEL = "claude-opus-5-5";

export type Division = "D1" | "D2" | "D3" | "NAIA";
export const DIVISIONS: Division[] = ["D1", "D2", "D3", "NAIA"];

export type AthleteProfile = {
  firstName: string;
  team: "men" | "women";
  event: string;
  mark: string;
  otherEvents: string;
  gradYear: string;
  gpa: string;
  homeState: string;
  divisions: Division[];
  preferences: string;
};

export type SchoolMatch = {
  school: string;
  division: string;
  conference: string;
  location: string;
  category: "reach" | "target" | "likely";
  benchmark: string;
  reasoning: string;
  coachRole: string;
};

export type MatchResult = {
  summary: string;
  schools: SchoolMatch[];
};

export type CoachEmail = {
  subject: string;
  body: string;
};

/** Thrown with a message that is safe to show to the user. */
export class AIError extends Error {}

const MATCH_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "schools"],
  properties: {
    summary: { type: "string" },
    schools: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["school", "division", "conference", "location", "category", "benchmark", "reasoning", "coachRole"],
        properties: {
          school: { type: "string" },
          division: { type: "string" },
          conference: { type: "string" },
          location: { type: "string" },
          category: { type: "string", enum: ["reach", "target", "likely"] },
          benchmark: { type: "string" },
          reasoning: { type: "string" },
          coachRole: { type: "string" },
        },
      },
    },
  },
};

const EMAIL_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["subject", "body"],
  properties: {
    subject: { type: "string" },
    body: { type: "string" },
  },
};

const MATCH_SYSTEM = `You are ClearedBar's recruiting analyst for high school track & field athletes in the United States.

Given an athlete's profile, recommend real college programs whose rosters and conference results their mark fits, sorted into:
- reach: the mark is below what the program usually recruits or scores with; possible with improvement or as a walk-on.
- target: the mark is in the range the program recruits and would likely score or contribute.
- likely: the mark would make the athlete an immediate contributor or conference scorer.

Rules:
- Only recommend real schools that sponsor track & field for the athlete's team (men's or women's) and that compete in the athlete's event.
- Only include the divisions the athlete selected.
- Weigh the athlete's grad year (younger athletes usually improve), GPA (academic fit and admissions), home state, and stated preferences.
- "benchmark" is one short line giving the reference level for the athlete's event at that program, e.g. "Conference final ~6'6\\"" or "Roster range 6'5\\"–6'10\\"". Use your best knowledge of typical conference-scoring and recruiting marks, and mark estimates with "~".
- "reasoning" is one or two sentences, specific to this athlete, explaining the category.
- "coachRole" is who to email, e.g. "Jumps coach" or "Sprints & hurdles coach".
- Order the list reach first, then target, then likely, with a sensible spread across categories.
- "summary" is two or three sentences telling the athlete honestly where their mark sits nationally and what it means for their search.

Your marks and benchmarks are estimates. Never claim certainty about a specific program's current roster.`;

const EMAIL_SYSTEM = `You write recruiting emails from high school track & field athletes to college event coaches.

Write one short, personal email (130–200 words) that:
- Opens with who the athlete is: name, grad year, event and mark.
- Shows genuine interest in this specific program and event group.
- Mentions academics (GPA) briefly and one relevant preference if given.
- Ends with a clear, polite ask (e.g. what the coach looks for in recruits, or whether they'd be a fit), and a sign-off with the athlete's first name.

Do not invent facts the athlete didn't provide (meet names, coach names, recent results of the program). Where a specific detail would strengthen the email, insert a short bracketed placeholder for the athlete to fill in, e.g. [meet where you set your PR] or [Coach's last name]. Keep the tone confident and respectful, not salesy. Plain text only, no markdown.`;

function describeProfile(p: AthleteProfile) {
  return [
    `First name: ${p.firstName}`,
    `Team: ${p.team === "men" ? "Men's" : "Women's"} track & field`,
    `Main event and PR: ${p.event}, ${p.mark}`,
    p.otherEvents ? `Other events/PRs: ${p.otherEvents}` : null,
    `High school graduation year: ${p.gradYear}`,
    p.gpa ? `GPA: ${p.gpa}` : null,
    p.homeState ? `Home state: ${p.homeState}` : null,
    `Divisions of interest: ${p.divisions.join(", ")}`,
    p.preferences ? `Preferences: ${p.preferences}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

async function askClaude(system: string, user: string, schema: Record<string, unknown>): Promise<unknown> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AIError("The AI feature isn't configured yet (missing ANTHROPIC_API_KEY).");
  }

  let response: Anthropic.Beta.BetaMessage;
  try {
    response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      // If Claude declines, the API retries on Anthropic's recommended fallback model.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: { type: "json_schema", schema } },
      system,
      messages: [{ role: "user", content: user }],
    });
  } catch (error) {
    console.error("Claude API error:", error);
    if (error instanceof Anthropic.AuthenticationError) {
      throw new AIError("The AI service rejected our API key. Please try again later.");
    }
    if (error instanceof Anthropic.RateLimitError) {
      throw new AIError("The AI service is busy right now. Please try again in a minute.");
    }
    throw new AIError("Something went wrong talking to the AI. Please try again.");
  }

  if (response.stop_reason === "refusal") {
    throw new AIError("The AI couldn't complete that request. Try rewording your details.");
  }
  if (response.stop_reason === "max_tokens") {
    throw new AIError("The AI's answer was cut off. Please try again.");
  }

  const text = response.content
    .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
  try {
    return JSON.parse(text);
  } catch {
    console.error("Unparseable Claude output:", text);
    throw new AIError("The AI returned an unexpected answer. Please try again.");
  }
}

export async function findMatches(profile: AthleteProfile, count: number): Promise<MatchResult> {
  const result = (await askClaude(
    MATCH_SYSTEM,
    `${describeProfile(profile)}\n\nRecommend exactly ${count} programs.`,
    MATCH_SCHEMA,
  )) as MatchResult;
  return { summary: result.summary, schools: result.schools.slice(0, count) };
}

export async function writeCoachEmail(profile: AthleteProfile, school: SchoolMatch): Promise<CoachEmail> {
  return (await askClaude(
    EMAIL_SYSTEM,
    `Athlete:\n${describeProfile(profile)}\n\nWrite to the ${school.coachRole} at ${school.school} (${school.division}, ${school.conference}, ${school.location}).\nReference level for the event there: ${school.benchmark}.\nWhy it's a fit: ${school.reasoning}`,
    EMAIL_SCHEMA,
  )) as CoachEmail;
}
