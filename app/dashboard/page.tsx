import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { logOut } from "@/app/actions";
import MatchFinder from "@/components/MatchFinder";
import SimpleNav from "@/components/SimpleNav";
import type { AthleteProfile, CoachEmail, MatchResult } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import "../auth.css";

export const metadata: Metadata = { title: "Dashboard · ClearedBar" };

// AI requests can take up to a minute; give server actions on this page room.
export const maxDuration = 300;

export default async function Dashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [profiles, runs] = (await Promise.all([
    sql()`SELECT data FROM athlete_profiles WHERE user_id = ${user.id}`,
    sql()`SELECT id, result FROM match_runs WHERE user_id = ${user.id} ORDER BY created_at DESC LIMIT 1`,
  ])) as [{ data: AthleteProfile }[], { id: number; result: MatchResult }[]];
  const latestRun = runs[0] ?? null;

  const initialEmails: Record<number, CoachEmail> = {};
  if (latestRun) {
    const emails = (await sql()`
      SELECT school_index, subject, body FROM coach_emails WHERE run_id = ${latestRun.id}
    `) as ({ school_index: number } & CoachEmail)[];
    for (const e of emails) initialEmails[e.school_index] = { subject: e.subject, body: e.body };
  }

  return (
    <>
      <SimpleNav />
      <main className="dash-main">
        <div className="wrap dash-wrap">
          <div className="card dash-account">
            <div>
              <h1>Dashboard</h1>
              <div className="dash-meta">
                <span>{user.email}</span>
                <span className={`tag ${user.plan === "pro" ? "likely" : "target"}`}>{user.plan}</span>
              </div>
            </div>
            <form action={logOut}>
              <button type="submit" className="btn ghost">Log out</button>
            </form>
          </div>
          <MatchFinder
            profile={profiles[0]?.data ?? null}
            initialRun={latestRun}
            initialEmails={initialEmails}
            isPro={user.plan === "pro"}
          />
        </div>
      </main>
    </>
  );
}
