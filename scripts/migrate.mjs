// Creates the tables (if missing) and the demo account (if configured).
// Runs automatically before every `npm run build`, so Vercel deploys keep the
// schema up to date. Safe to run any number of times.
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!url) {
  console.warn("[migrate] DATABASE_URL is not set — skipping database setup.");
  process.exit(0);
}

const sql = neon(url);

await sql`
  CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    plan          TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;
await sql`
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;
// Stripe billing: link each user to their Stripe customer and subscription.
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT`;
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT`;
await sql`CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id)`;
await sql`DELETE FROM sessions WHERE expires_at < now()`;

// AI feature: the athlete's latest profile, each matching run, and each coach email.
await sql`
  CREATE TABLE IF NOT EXISTS athlete_profiles (
    user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    data       JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;
await sql`
  CREATE TABLE IF NOT EXISTS match_runs (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profile    JSONB NOT NULL,
    result     JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;
await sql`CREATE INDEX IF NOT EXISTS match_runs_user_id_idx ON match_runs (user_id, created_at DESC)`;
await sql`
  CREATE TABLE IF NOT EXISTS coach_emails (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    run_id       INTEGER NOT NULL REFERENCES match_runs(id) ON DELETE CASCADE,
    school_index INTEGER NOT NULL,
    subject      TEXT NOT NULL,
    body         TEXT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (run_id, school_index)
  )
`;
console.log("[migrate] Tables are ready.");

// Demo account: credentials come from env vars, never from the code.
const demoEmail = process.env.DEMO_EMAIL?.trim().toLowerCase();
const demoPassword = process.env.DEMO_PASSWORD;
if (demoEmail && demoPassword) {
  const hash = await bcrypt.hash(demoPassword, 12);
  // Upsert so changing DEMO_PASSWORD in Vercel and redeploying updates it.
  await sql`
    INSERT INTO users (email, password_hash, plan)
    VALUES (${demoEmail}, ${hash}, 'pro')
    ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, plan = 'pro'
  `;
  console.log(`[migrate] Demo account ${demoEmail} is ready (plan = pro).`);
} else {
  console.log("[migrate] DEMO_EMAIL / DEMO_PASSWORD not set — skipping demo account.");
}
