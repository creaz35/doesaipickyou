/**
 * Sponsor spot definitions shared by the rails, the /sponsor picker, the
 * checkout API and the admin panel. Pure data, no Firebase imports, so it
 * is safe to import anywhere.
 *
 * A spot id is "left-1" … "left-6" / "right-1" … "right-6", top to bottom.
 * Ids are stable: sold spots key on them, so never renumber.
 */

export const SLOTS_PER_RAIL = 6;

export type RailSide = "left" | "right";

export function railSpots(side: RailSide): string[] {
  return Array.from({ length: SLOTS_PER_RAIL }, (_, i) => `${side}-${i + 1}`);
}

export const SPOT_IDS: string[] = [...railSpots("left"), ...railSpots("right")];

export function isSpotId(value: string): boolean {
  return SPOT_IDS.includes(value);
}

export function spotLabel(spot: string): string {
  const [side, slot] = spot.split("-");
  return `${side === "left" ? "Left" : "Right"} rail · slot ${slot}`;
}

/** How long one payment keeps a spot, matching the /sponsor page copy. */
export const SPONSOR_DAYS = 30;

/**
 * The sponsor's plan for when their 30 days end, set by the admin after
 * talking to them. Shown on /sponsor so buyers eyeing a taken spot know
 * whether it will actually free up.
 */
export type RenewalStatus = "renewing" | "deciding" | "leaving";

export const RENEWAL_LABELS: Record<RenewalStatus, string> = {
  renewing: "🔄 renewing",
  deciding: "🤔 still deciding",
  leaving: "👋 leaving, spot opens up",
};

/**
 * A sold, live sponsor as stored in Firestore (sponsors/{sessionId}).
 * Deliberately excludes the buyer's email: these docs are world-readable
 * because the rails render from them. Contact details stay in Stripe.
 */
export interface SponsorInfo {
  /** Stripe Checkout session id, doubles as the doc id. */
  sessionId: string;
  spot: string;
  name: string;
  tagline: string;
  url: string;
  /** What they paid, in whole USD, for the admin panel. */
  amountUsd: number;
  /** ISO timestamp when the 30 days run out, stamped at activation. */
  endsAt?: string | null;
  /** Renewal intention, edited in /admin. Absent until the admin sets it. */
  renewal?: RenewalStatus | null;
}

/** Expired sponsors stay in Firestore for the books but leave the rails. */
export function sponsorIsActive(sponsor: SponsorInfo, now = Date.now()): boolean {
  return !sponsor.endsAt || Date.parse(sponsor.endsAt) > now;
}

/** Field length limits, enforced in the form and again in the checkout API. */
export const SPONSOR_LIMITS = {
  name: 32,
  tagline: 60,
  url: 200,
} as const;

/**
 * A paid Stripe checkout as returned by /api/sponsor/purchases. Admin-only
 * data (includes the buyer's email), never stored in Firestore.
 */
export interface SponsorPurchase {
  sessionId: string;
  /** Unix seconds. */
  createdAt: number;
  amountUsd: number;
  email: string | null;
  spot: string;
  name: string;
  tagline: string;
  url: string;
}
