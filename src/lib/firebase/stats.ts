import {
  collection,
  doc,
  getDocs,
  increment,
  setDoc,
  type Firestore,
} from "firebase/firestore";

/**
 * Anonymous visitor counters, written straight from the browser.
 *
 * - stats/day-{YYYY-MM-DD}: one doc per UTC day with { date, views,
 *   visitors, newVisitors, toolClicks, sponsorClicks }. The /stats page
 *   sums these; there is deliberately no all-time doc, so there is no
 *   single hot document absorbing every write forever.
 * - clicks/{tool-id | sponsor-sessionId}: per-entity outbound click
 *   totals, shown in /admin.
 *
 * Security rules only allow bumping a counter by 1 per write, so a
 * hostile visitor can click-spam like any analytics tool suffers, but can
 * never set, lower, or delete a number. Every write here is fire and
 * forget: analytics must never break the page.
 */

export const STATS_COLLECTION = "stats";
export const CLICKS_COLLECTION = "clicks";

/** UTC day, matching the competitor convention of "since midnight UTC". */
export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

const EVER_KEY = "daipy-visitor";
const DAY_KEY_PREFIX = "daipy-visited-";

/** Reads and updates the localStorage first-visit flags. */
function visitFlags(today: string): { newEver: boolean; newToday: boolean } {
  try {
    const newEver = localStorage.getItem(EVER_KEY) === null;
    const newToday = localStorage.getItem(DAY_KEY_PREFIX + today) === null;
    localStorage.setItem(EVER_KEY, "1");
    // Replace yesterday's flag instead of piling one up per day.
    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
      const key = localStorage.key(i);
      if (key?.startsWith(DAY_KEY_PREFIX) && key !== DAY_KEY_PREFIX + today) {
        localStorage.removeItem(key);
      }
    }
    localStorage.setItem(DAY_KEY_PREFIX + today, "1");
    return { newEver, newToday };
  } catch {
    // Storage blocked (private mode): count the view, skip visitor counts.
    return { newEver: false, newToday: false };
  }
}

export async function trackPageView(db: Firestore): Promise<void> {
  const today = todayUtc();
  const { newEver, newToday } = visitFlags(today);
  const bump: Record<string, unknown> = { date: today, views: increment(1) };
  if (newToday) bump.visitors = increment(1);
  if (newEver) bump.newVisitors = increment(1);
  await setDoc(doc(db, STATS_COLLECTION, `day-${today}`), bump, { merge: true });
}

export type ClickKind = "tool" | "sponsor";

export async function trackClick(db: Firestore, kind: ClickKind, id: string): Promise<void> {
  const today = todayUtc();
  const key = `${kind}-${id}`;
  await Promise.allSettled([
    setDoc(doc(db, CLICKS_COLLECTION, key), { key, count: increment(1) }, { merge: true }),
    setDoc(
      doc(db, STATS_COLLECTION, `day-${today}`),
      { date: today, [kind === "tool" ? "toolClicks" : "sponsorClicks"]: increment(1) },
      { merge: true },
    ),
  ]);
}

/** All per-entity click totals, keyed "tool-{id}" / "sponsor-{sessionId}". */
export async function fetchClickCounts(db: Firestore): Promise<Record<string, number>> {
  const snap = await getDocs(collection(db, CLICKS_COLLECTION));
  const counts: Record<string, number> = {};
  for (const d of snap.docs) {
    const count = d.data().count;
    if (typeof count === "number") counts[d.id] = count;
  }
  return counts;
}
