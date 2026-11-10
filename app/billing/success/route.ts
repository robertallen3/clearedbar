import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { activateFromCheckout, stripe } from "@/lib/stripe";

// Stripe sends the user here after paying. Confirm the payment with Stripe
// (never trust the URL alone) and upgrade the account right away.
export async function GET(request: NextRequest) {
  const dashboard = new URL("/dashboard", request.url);
  const sessionId = request.nextUrl.searchParams.get("session_id");
  const user = await getCurrentUser();

  if (sessionId && user) {
    try {
      const session = await stripe().checkout.sessions.retrieve(sessionId);
      if (session.client_reference_id === String(user.id) && (await activateFromCheckout(session))) {
        dashboard.searchParams.set("checkout", "success");
        return NextResponse.redirect(dashboard);
      }
    } catch (error) {
      console.error("Stripe success check failed:", error);
    }
  }

  dashboard.searchParams.set("checkout", "pending");
  return NextResponse.redirect(dashboard);
}
