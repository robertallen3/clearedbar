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
await sql`CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id)`;
await sql`DELETE FROM sessions WHERE expires_at < now()`;
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
