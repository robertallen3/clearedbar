import type Stripe from "stripe";
import { activateFromCheckout, stripe, syncSubscription } from "@/lib/stripe";

// Stripe calls this for billing events, e.g. when a subscription is canceled.
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) {
    return new Response("Webhook not configured", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(await request.text(), signature, secret);
  } catch (error) {
    console.error("Stripe webhook signature check failed:", error);
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      await activateFromCheckout(event.data.object);
      break;
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscription(event.data.object);
      break;
  }

  return new Response("ok");
}
