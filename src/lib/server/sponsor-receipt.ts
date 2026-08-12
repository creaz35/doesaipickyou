import type Stripe from "stripe";
import { sponsorReceiptEmail } from "@/lib/server/email-templates";
import { isMailConfigured, sendMail } from "@/lib/server/mailer";

/**
 * Sends the branded receipt to the buyer (CC to the configured sender),
 * exactly once per checkout: a receiptSent flag written back into the
 * session metadata makes every later call a no-op. Two callers race for
 * it, whichever fires first wins:
 *
 * - /api/stripe/webhook on checkout.session.completed (reliable, fires
 *   even when the buyer never returns from Stripe)
 * - /api/sponsor/confirm when the buyer lands on /sponsor/thanks (covers
 *   local dev where no webhook is forwarding)
 *
 * Failures are swallowed after logging; a missing receipt must never look
 * like a failed payment.
 */
export async function sendSponsorReceiptOnce(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
): Promise<void> {
  if (!isMailConfigured()) return;
  if (session.metadata?.receiptSent === "1") return;
  const to = session.customer_details?.email ?? session.customer_email;
  if (!to || !session.metadata?.spot) return;

  try {
    const email = sponsorReceiptEmail({
      productName: session.metadata.name ?? "your product",
      tagline: session.metadata.tagline ?? "",
      spot: session.metadata.spot,
      amountUsd: (session.amount_total ?? 0) / 100,
      paidAt: session.created,
      sessionId: session.id,
    });
    await sendMail({ to, ...email, ccSender: true });
    await stripe.checkout.sessions.update(session.id, {
      metadata: { ...session.metadata, receiptSent: "1" },
    });
  } catch (error) {
    console.error("sponsor receipt email failed:", error);
  }
}
