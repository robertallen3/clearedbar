import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { logOut } from "@/app/actions";
import SimpleNav from "@/components/SimpleNav";
import { getCurrentUser } from "@/lib/auth";
import "../auth.css";

export const metadata: Metadata = { title: "Dashboard · ClearedBar" };

export default async function Dashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <>
      <SimpleNav />
      <main className="auth-main">
        <div className="wrap auth-card">
          <div className="card">
            <h1>Dashboard</h1>
            <p className="auth-sub">You&apos;re logged in.</p>
            <div className="dash-row"><span>Email</span><b>{user.email}</b></div>
            <div className="dash-row">
              <span>Plan</span>
              <span className={`tag ${user.plan === "pro" ? "likely" : "target"}`}>{user.plan}</span>
            </div>
            <form action={logOut} className="dash-actions">
              <button type="submit" className="btn ghost auth-submit">Log out</button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
