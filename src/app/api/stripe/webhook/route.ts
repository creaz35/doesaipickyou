import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { sendSponsorReceiptOnce } from "@/lib/server/sponsor-receipt";
import { getStripe, isStripeConfigured } from "@/lib/server/stripe";

/**
 * Stripe webhook: the reliable path for sponsor receipts. Fires when a
 * checkout completes even if the buyer closes the tab on Stripe's page
 * and never reaches /sponsor/thanks.
 *
 * The signature check is the security boundary: the raw body must be
 * verified against STRIPE_WEBHOOK_SECRET before anything in it is
 * believed. Without that, anyone could POST a fake "paid" session here.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!isStripeConfigured() || !secret) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 501 });
  }

  const signature = request.headers.get("stripe-signature") ?? "";
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  // async_payment_succeeded covers delayed methods (bank debits etc.),
  // where completed fires before the money actually arrives.
  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object;
    if (session.payment_status === "paid" && session.metadata?.spot) {
      await sendSponsorReceiptOnce(getStripe(), session);
    }
  }

  // Always 200 for verified events, or Stripe retries for days.
  return NextResponse.json({ received: true });
}
