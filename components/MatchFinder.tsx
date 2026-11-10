"use client";

import { useActionState, useState, useTransition } from "react";
import { findMatchesAction, writeEmailAction, type MatchState } from "@/app/dashboard/actions";
import type { AthleteProfile, CoachEmail, MatchResult } from "@/lib/ai";

type Props = {
  profile: AthleteProfile | null;
  initialRun: { id: number; result: MatchResult } | null;
  initialEmails: Record<number, CoachEmail>;
  isPro: boolean;
};

const DIVISION_OPTIONS = ["D1", "D2", "D3", "NAIA"] as const;

export default function MatchFinder({ profile: savedProfile, initialRun, initialEmails, isPro }: Props) {
  const [state, formAction, searching] = useActionState<MatchState, FormData>(
    findMatchesAction,
    initialRun ? { run: initialRun } : {},
  );
  const run = state.run;
  // React resets the form after each submit; keep the athlete's last answers as the defaults.
  const profile = state.profile ?? savedProfile;
  const divisions = profile?.divisions ?? ["D1", "D2", "D3"];

  return (
    <>
      <div className="card">
        <h2 className="dash-h2">Find my schools</h2>
        <p className="auth-sub">
          Enter your marks and ClearedBar&apos;s AI sorts college programs into reach, target and likely.
          {!isPro && " Free plan: 1 search with 3 schools."}
        </p>
        <form action={formAction} className="match-form">
          <label className="auth-label">
            First name
            <input className="auth-input" name="firstName" required maxLength={40} defaultValue={profile?.firstName} />
          </label>
          <label className="auth-label">
            Team
            <select className="auth-input" name="team" defaultValue={profile?.team ?? "men"}>
              <option value="men">Men&apos;s</option>
              <option value="women">Women&apos;s</option>
            </select>
          </label>
          <label className="auth-label">
            Main event
            <input className="auth-input" name="event" required maxLength={60} placeholder="High jump" defaultValue={profile?.event} />
          </label>
          <label className="auth-label">
            PR in that event
            <input className="auth-input" name="mark" required maxLength={30} placeholder={`6'7"`} defaultValue={profile?.mark} />
          </label>
          <label className="auth-label">
            Grad year
            <input className="auth-input" name="gradYear" required inputMode="numeric" maxLength={4} placeholder="2028" defaultValue={profile?.gradYear} />
          </label>
          <label className="auth-label">
            GPA
            <input className="auth-input" name="gpa" maxLength={10} placeholder="3.6" defaultValue={profile?.gpa} />
          </label>
          <label className="auth-label">
            Home state
            <input className="auth-input" name="homeState" maxLength={40} placeholder="Pennsylvania" defaultValue={profile?.homeState} />
          </label>
          <label className="auth-label">
            <span>Other events &amp; PRs <span className="opt">(optional)</span></span>
            <input className="auth-input" name="otherEvents" maxLength={200} placeholder={`Long jump 21'4"`} defaultValue={profile?.otherEvents} />
          </label>
          <fieldset className="auth-label span-2">
            <legend>Divisions</legend>
            <div className="checks">
              {DIVISION_OPTIONS.map((d) => (
                <label key={d} className="check">
                  <input type="checkbox" name="divisions" value={d} defaultChecked={divisions.includes(d)} /> {d}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="auth-label span-2">
            <span>Anything else that matters? <span className="opt">(optional)</span></span>
            <textarea
              className="auth-input"
              name="preferences"
              rows={2}
              maxLength={400}
              placeholder="e.g. want to study engineering, prefer the Northeast, small school"
              defaultValue={profile?.preferences}
            />
          </label>
          {state.error && (
            <p className="auth-error span-2" role="alert">
              {state.error}
            </p>
          )}
          <button type="submit" className="btn span-2" disabled={searching}>
            {searching ? "Finding your schools… (up to a minute)" : "Find my schools"}
          </button>
        </form>
      </div>

      {run && <Results key={run.id} runId={run.id} result={run.result} initialEmails={run.id === initialRun?.id ? initialEmails : {}} />}
    </>
  );
}

function Results({ runId, result, initialEmails }: { runId: number; result: MatchResult; initialEmails: Record<number, CoachEmail> }) {
  return (
    <div className="card">
      <h2 className="dash-h2">Your matches</h2>
      <p className="auth-sub">{result.summary}</p>
      <div className="matches">
        {result.schools.map((school, i) => (
          <SchoolRow key={i} runId={runId} index={i} school={school} initialEmail={initialEmails[i]} />
        ))}
      </div>
      <p className="note">Benchmarks are AI estimates. Check each program&apos;s roster and conference results before you reach out.</p>
    </div>
  );
}

function SchoolRow({
  runId,
  index,
  school,
  initialEmail,
}: {
  runId: number;
  index: number;
  school: MatchResult["schools"][number];
  initialEmail?: CoachEmail;
}) {
  const [email, setEmail] = useState<CoachEmail | undefined>(initialEmail);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  function write() {
    setError(undefined);
    startTransition(async () => {
      const res = await writeEmailAction(runId, index);
      if (res.email) setEmail(res.email);
      else setError(res.error);
    });
  }

  async function copy() {
    if (!email) return;
    await navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="match">
      <div className="match-top">
        <div>
          <b>{school.school}</b>
          <small>
            {school.division} · {school.conference} · {school.location}
          </small>
        </div>
        <span className={`tag ${school.category}`}>{school.category}</span>
      </div>
      <p className="match-bench">{school.benchmark}</p>
      <p className="match-why">{school.reasoning}</p>
      {!email && (
        <button type="button" className="btn ghost btn-sm" onClick={write} disabled={pending}>
          {pending ? "Writing…" : `Write email to ${school.coachRole}`}
        </button>
      )}
      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}
      {email && (
        <div className="mail">
          <div className="hdr">
            <b>To:</b> {school.coachRole}, {school.school}
            <br />
            <b>Subject:</b> {email.subject}
          </div>
          <p className="mail-body">{email.body}</p>
          <button type="button" className="btn btn-sm mail-copy" onClick={copy}>
            {copied ? "Copied!" : "Copy email"}
          </button>
        </div>
      )}
    </div>
  );
}
