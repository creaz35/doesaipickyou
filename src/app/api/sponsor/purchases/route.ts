import { NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/server/stripe";
import { verifyAdmin } from "@/lib/server/verify-admin";
import type { SponsorPurchase } from "@/lib/sponsor-spots";

/**
 * Admin-only list of paid sponsor checkouts, straight from Stripe. The
 * admin panel cross-references these with the sponsors collection to show
 * which purchases still need to be activated into their spot.
 */

export async function GET(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 501 });
  }

  const sessions = await getStripe().checkout.sessions.list({ limit: 100, status: "complete" });

  const purchases: SponsorPurchase[] = sessions.data
    .filter((s) => s.payment_status === "paid" && s.metadata?.spot)
    .map((s) => ({
      sessionId: s.id,
      createdAt: s.created,
      amountUsd: (s.amount_total ?? 0) / 100,
      email: s.customer_details?.email ?? s.customer_email ?? null,
      spot: s.metadata!.spot!,
      name: s.metadata!.name ?? "",
      tagline: s.metadata!.tagline ?? "",
      url: s.metadata!.url ?? "",
    }));

  return NextResponse.json({ purchases });
}
