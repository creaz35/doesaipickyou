import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  type Firestore,
} from "firebase/firestore";
import { SPONSOR_DAYS, type RenewalStatus, type SponsorInfo } from "@/lib/sponsor-spots";

/**
 * Client-side data layer for sold sponsor spots and the sponsor price.
 *
 * - sponsors/{sessionId}: one doc per live sponsor (world-readable, the
 *   rails render from it; only admins write, via the activate flow below).
 * - settings/sponsor: { priceUsd } for the NEXT sponsor. World-readable so
 *   /sponsor can show it; only admins write.
 *
 * Activation is a manual admin step by design: payment goes through Stripe
 * server-side, but the site has no service account, so the Firestore write
 * happens here with the signed-in admin's own credentials. It also means a
 * paid sponsor is reviewed before appearing on every page.
 */

export const SPONSORS_COLLECTION = "sponsors";
export const SETTINGS_COLLECTION = "settings";
export const SPONSOR_SETTINGS_DOC = "sponsor";

export async function fetchSponsors(db: Firestore): Promise<SponsorInfo[]> {
  const snap = await getDocs(collection(db, SPONSORS_COLLECTION));
  return snap.docs.map((d) => d.data() as SponsorInfo);
}

export async function fetchSponsorPriceUsd(db: Firestore): Promise<number | null> {
  const snap = await getDoc(doc(db, SETTINGS_COLLECTION, SPONSOR_SETTINGS_DOC));
  const price = snap.data()?.priceUsd;
  return typeof price === "number" && price > 0 ? price : null;
}

export async function saveSponsorPriceUsd(db: Firestore, priceUsd: number): Promise<void> {
  await setDoc(
    doc(db, SETTINGS_COLLECTION, SPONSOR_SETTINGS_DOC),
    { priceUsd, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function activateSponsor(db: Firestore, sponsor: SponsorInfo): Promise<void> {
  // The clock starts at activation, not at payment, so a slow review never
  // eats into the sponsor's 30 days.
  const endsAt = new Date(Date.now() + SPONSOR_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await setDoc(doc(db, SPONSORS_COLLECTION, sponsor.sessionId), {
    ...sponsor,
    endsAt,
    activatedAt: serverTimestamp(),
  });
}

export async function removeSponsor(db: Firestore, sessionId: string): Promise<void> {
  await deleteDoc(doc(db, SPONSORS_COLLECTION, sessionId));
}

export async function setSponsorRenewal(
  db: Firestore,
  sessionId: string,
  renewal: RenewalStatus | null,
): Promise<void> {
  await setDoc(doc(db, SPONSORS_COLLECTION, sessionId), { renewal }, { merge: true });
}
