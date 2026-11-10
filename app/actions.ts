"use server";

import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { createSession, destroySession, hashPassword, verifyCredentials } from "@/lib/auth";

export type FormState = { error?: string; email?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readForm(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  return { email, password };
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const { email, password } = readForm(formData);

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return { error: "Enter a valid email address.", email };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters.", email };
  }
  if (password.length > 72) {
    // bcrypt only uses the first 72 bytes.
    return { error: "Password must be 72 characters or fewer.", email };
  }

  const passwordHash = await hashPassword(password);
  const rows = (await sql()`
    INSERT INTO users (email, password_hash)
    VALUES (${email}, ${passwordHash})
    ON CONFLICT (email) DO NOTHING
    RETURNING id
  `) as { id: number }[];

  if (rows.length === 0) {
    return { error: "An account with that email already exists. Try logging in.", email };
  }

  await createSession(rows[0].id);
  redirect("/dashboard");
}

export async function logIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const { email, password } = readForm(formData);
  if (!email || !password) {
    return { error: "Enter your email and password.", email };
  }

  const user = await verifyCredentials(email, password);
  if (!user) {
    return { error: "Incorrect email or password.", email };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logOut() {
  await destroySession();
  redirect("/login");
}
