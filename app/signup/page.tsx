import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signUp } from "@/app/actions";
import AuthForm from "@/components/AuthForm";
import SimpleNav from "@/components/SimpleNav";
import { getCurrentUser } from "@/lib/auth";
import "../auth.css";

export const metadata: Metadata = { title: "Create your account · ClearedBar" };

export default async function Page() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <>
      <SimpleNav />
      <main className="auth-main">
        <div className="wrap auth-card">
          <div className="card">
            <h1>Create your account</h1>
            <p className="auth-sub">Start free. No credit card needed.</p>
            <AuthForm mode="signup" action={signUp} />
          </div>
        </div>
      </main>
    </>
  );
}
