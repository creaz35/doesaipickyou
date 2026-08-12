import { NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/server/stripe";
import { getSponsorPriceUsd, getSponsors } from "@/lib/sponsor-data";
import { isSpotId, SPONSOR_LIMITS, spotLabel } from "@/lib/sponsor-spots";

/**
 * Creates a Stripe Checkout session for one sponsor spot.
 *
 * The price is read from settings/sponsor server-side, never trusted from
 * the client, so whatever is shown on /sponsor, Stripe charges what the
 * admin panel says. The sponsor's details ride along as session metadata;
 * after payment the admin activates the spot from /admin.
 */

interface CheckoutBody {
  spot?: string;
  name?: string;
  tagline?: string;
  url?: string;
  email?: string;
}

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function cleanUrl(raw: string): string | null {
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    if (!parsed.hostname.includes(".")) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return bad("Payments are not configured yet. Set STRIPE_SECRET_KEY.", 501);
  }

  let body: CheckoutBody;
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return bad("Invalid JSON body.");
  }

  const spot = (body.spot ?? "").trim();
  const name = (body.name ?? "").trim();
  const tagline = (body.tagline ?? "").trim();
  const email = (body.email ?? "").trim();
  const url = cleanUrl((body.url ?? "").trim());

  if (!isSpotId(spot)) return bad("Pick a valid spot.");
  if (!name || name.length > SPONSOR_LIMITS.name) {
    return bad(`Product name is required (max ${SPONSOR_LIMITS.name} characters).`);
  }
  if (!tagline || tagline.length > SPONSOR_LIMITS.tagline) {
    return bad(`Tagline is required (max ${SPONSOR_LIMITS.tagline} characters).`);
  }
  if (!url || url.length > SPONSOR_LIMITS.url) return bad("Enter a valid website URL.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return bad("Enter a valid email address.");

  const priceUsd = await getSponsorPriceUsd();
  if (!priceUsd) {
    return bad("Sponsorship is not open yet: no price is configured.", 409);
  }

  // Best-effort double-booking guard; the admin activation step is the
  // final arbiter if two buyers race for the same spot.
  const sponsors = await getSponsors();
  if (sponsors.some((s) => s.spot === spot)) {
    return bad("That spot was just taken. Pick another one.", 409);
  }

  const origin = request.headers.get("origin") ?? new URL(request.url).origin;
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(priceUsd * 100),
          product_data: {
            name: `doesaipickyou.com sponsor · ${spotLabel(spot)}`,
            description: `${name}: ${tagline}`,
          },
        },
      },
    ],
    customer_email: email,
    metadata: { spot, name, tagline, url },
    success_url: `${origin}/sponsor/thanks?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/sponsor?spot=${spot}`,
  });

  return NextResponse.json({ url: session.url });
}
