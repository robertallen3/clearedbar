import "server-only";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { sql, type User } from "./db";

const SESSION_COOKIE = "cb_session";
const SESSION_DAYS = 30;
const BCRYPT_ROUNDS = 12;

// Only a SHA-256 of the session token is stored, so a leaked sessions table can't be replayed.
function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

// Used when the email doesn't exist, so failed logins take the same time either way.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_ROUNDS);

export async function verifyCredentials(email: string, password: string): Promise<User | null> {
  const rows = (await sql()`
    SELECT id, email, plan, password_hash FROM users WHERE email = ${email}
  `) as (User & { password_hash: string })[];
  const row = rows[0];
  const ok = await bcrypt.compare(password, row?.password_hash ?? DUMMY_HASH);
  if (!row || !ok) return null;
  return { id: row.id, email: row.email, plan: row.plan };
}

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await sql()`
    INSERT INTO sessions (token_hash, user_id, expires_at)
    VALUES (${hashToken(token)}, ${userId}, ${expires.toISOString()})
  `;
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = (await sql()`
    SELECT u.id, u.email, u.plan
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ${hashToken(token)} AND s.expires_at > now()
  `) as User[];
  return rows[0] ?? null;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await sql()`DELETE FROM sessions WHERE token_hash = ${hashToken(token)}`;
  }
  jar.delete(SESSION_COOKIE);
}
