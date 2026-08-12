import { fetchRestCollection, fetchRestDoc, isFirestoreRestConfigured } from "@/lib/firebase/rest";
import {
  isSpotId,
  RENEWAL_LABELS,
  sponsorIsActive,
  type RenewalStatus,
  type SponsorInfo,
} from "@/lib/sponsor-spots";

/**
 * Server-side reads for sponsor data (rails in the layout, price check in
 * the checkout API). Both collections are world-readable by rules, so this
 * rides the same unauthenticated REST reader as the leaderboards.
 * Failures degrade to "no sponsors" so the site never breaks over a rail.
 */

export async function getSponsors(): Promise<SponsorInfo[]> {
  if (!isFirestoreRestConfigured()) return [];
  try {
    const docs = await fetchRestCollection("sponsors");
    return docs
      .filter((d) => typeof d.spot === "string" && isSpotId(d.spot) && d.name && d.url)
      .map((d) => ({
        sessionId: String(d.sessionId ?? ""),
        spot: String(d.spot),
        name: String(d.name),
        tagline: String(d.tagline ?? ""),
        url: String(d.url),
        amountUsd: Number(d.amountUsd ?? 0),
        endsAt: d.endsAt ? String(d.endsAt) : null,
        renewal:
          typeof d.renewal === "string" && d.renewal in RENEWAL_LABELS
            ? (d.renewal as RenewalStatus)
            : null,
      }))
      // Run out the clock and the card leaves the rails on the next ISR
      // pass, which also puts the spot back on sale on /sponsor.
      .filter((s) => sponsorIsActive(s));
  } catch {
    return [];
  }
}

/** Price for the next sponsor in whole USD; null when not configured yet. */
export async function getSponsorPriceUsd(): Promise<number | null> {
  if (!isFirestoreRestConfigured()) return null;
  try {
    const settings = await fetchRestDoc("settings/sponsor");
    const price = settings?.priceUsd;
    return typeof price === "number" && price > 0 ? price : null;
  } catch {
    return null;
  }
}
