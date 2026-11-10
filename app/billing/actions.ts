"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { PRO_PRICE, stripe } from "@/lib/stripe";

async function baseUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function startCheckout() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.plan === "pro") redirect("/dashboard");

  const rows = (await sql()`SELECT stripe_customer_id FROM users WHERE id = ${user.id}`) as {
    stripe_customer_id: string | null;
  }[];
  const customerId = rows[0]?.stripe_customer_id;
  const base = await baseUrl();

  let url: string | null;
  try {
    const session = await stripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price_data: PRO_PRICE, quantity: 1 }],
      client_reference_id: String(user.id),
      ...(customerId ? { customer: customerId } : { customer_email: user.email }),
      success_url: `${base}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/dashboard?checkout=canceled`,
    });
    url = session.url;
  } catch (error) {
    console.error("Stripe checkout error:", error);
    url = null;
  }

  redirect(url ?? "/dashboard?checkout=error");
}
