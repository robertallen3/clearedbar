import "server-only";
import Stripe from "stripe";
import { sql } from "./db";

let client: Stripe | null = null;

/** Reads STRIPE_SECRET_KEY from the environment. Never put the key in code. */
export function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
  client ??= new Stripe(key);
  return client;
}

// ClearedBar Pro, matching the pricing section on the homepage.
export const PRO_PRICE = {
  currency: "usd",
  unit_amount: 999,
  recurring: { interval: "month" as const },
  product_data: { name: "ClearedBar Pro", description: "Unlimited school matches and coach emails" },
};

function idOf(value: string | { id: string } | null | undefined) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

/** Marks a user as pro after a completed Checkout Session. Safe to call more than once. */
export async function activateFromCheckout(session: Stripe.Checkout.Session) {
  const userId = Number(session.client_reference_id);
  if (!userId || session.status !== "complete") return false;
  await sql()`
    UPDATE users
    SET plan = 'pro',
        stripe_customer_id = ${idOf(session.customer)},
        stripe_subscription_id = ${idOf(session.subscription)}
    WHERE id = ${userId}
  `;
  return true;
}

/** Keeps the plan in sync when a subscription changes or ends. */
export async function syncSubscription(subscription: Stripe.Subscription) {
  const active = ["active", "trialing", "past_due"].includes(subscription.status);
  await sql()`
    UPDATE users SET plan = ${active ? "pro" : "free"}
    WHERE stripe_subscription_id = ${subscription.id}
  `;
}
