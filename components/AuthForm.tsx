"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { FormState } from "@/app/actions";

type Props = {
  mode: "login" | "signup";
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
};

export default function AuthForm({ mode, action }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const isSignup = mode === "signup";

  return (
    <form action={formAction} className="auth-form" noValidate>
      <label className="auth-label">
        Email
        <input
          className="auth-input"
          type="email"
          name="email"
          autoComplete="email"
          required
          defaultValue={state.email}
        />
      </label>
      <label className="auth-label">
        Password
        <input
          className="auth-input"
          type="password"
          name="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          minLength={isSignup ? 8 : undefined}
          required
        />
      </label>
      {isSignup && <p className="auth-hint">At least 8 characters.</p>}
      {state.error && (
        <p className="auth-error" role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" className="btn auth-submit" disabled={pending}>
        {pending ? "Please wait…" : isSignup ? "Create account" : "Log in"}
      </button>
      <p className="auth-switch">
        {isSignup ? (
          <>Already have an account? <Link href="/login">Log in</Link></>
        ) : (
          <>New to ClearedBar? <Link href="/signup">Create an account</Link></>
        )}
      </p>
    </form>
  );
}
