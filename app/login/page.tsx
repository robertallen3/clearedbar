import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { logIn } from "@/app/actions";
import AuthForm from "@/components/AuthForm";
import SimpleNav from "@/components/SimpleNav";
import { getCurrentUser } from "@/lib/auth";
import "../auth.css";

export const metadata: Metadata = { title: "Log in · ClearedBar" };

export default async function Page() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <>
      <SimpleNav />
      <main className="auth-main">
        <div className="wrap auth-card">
          <div className="card">
            <h1>Log in</h1>
            <p className="auth-sub">Welcome back. Log in to see your matches.</p>
            <AuthForm mode="login" action={logIn} />
          </div>
        </div>
      </main>
    </>
  );
}
