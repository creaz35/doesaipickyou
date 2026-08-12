import { NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/server/stripe";

/**
 * Used by /sponsor/thanks to verify a payment straight after checkout.
 * Read-only against Stripe; exposes nothing beyond what the buyer already
 * knows about their own session.
 */
export async function GET(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Payments are not configured." }, { status: 501 });
  }

  const sessionId = new URL(request.url).searchParams.get("session_id") ?? "";
  if (!/^cs_[a-zA-Z0-9_]+$/.test(sessionId)) {
    return NextResponse.json({ error: "Invalid session id." }, { status: 400 });
  }

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    return NextResponse.json({
      paid: session.payment_status === "paid",
      name: session.metadata?.name ?? null,
      spot: session.metadata?.spot ?? null,
      amountUsd: (session.amount_total ?? 0) / 100,
    });
  } catch {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }
}
