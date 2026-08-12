import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Firestore,
} from "firebase/firestore";

export const SUBSCRIBERS_COLLECTION = "subscribers";

/** Where the address came from, so admin can tell list quality apart. */
export type SubscriberSource = "newsletter" | "signup";

export interface Subscriber {
  email: string;
  source: SubscriberSource;
  /** Present when the subscriber also has an account. */
  uid?: string | null;
  firstName?: string | null;
  createdAt?: unknown;
}

/** Doc ids are the normalized email, so re-subscribing can't duplicate a row. */
export function subscriberId(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/**
 * Adds an address to the list. Rules allow create-only for anonymous
 * visitors, so a second signup with the same email fails with
 * permission-denied; callers treat that as "already subscribed" rather
 * than an error, and it also stops anyone overwriting someone else's row.
 */
export async function subscribe(
  db: Firestore,
  email: string,
  extra: { source: SubscriberSource; uid?: string | null; firstName?: string | null } = {
    source: "newsletter",
  },
): Promise<"added" | "already"> {
  const id = subscriberId(email);
  const payload: Subscriber = {
    email: id,
    source: extra.source,
    uid: extra.uid ?? null,
    firstName: extra.firstName ?? null,
  };
  try {
    await setDoc(doc(db, SUBSCRIBERS_COLLECTION, id), {
      ...payload,
      createdAt: serverTimestamp(),
    });
    return "added";
  } catch (e) {
    if ((e as { code?: string })?.code === "permission-denied") return "already";
    throw e;
  }
}

export async function fetchSubscribers(db: Firestore): Promise<Subscriber[]> {
  const snap = await getDocs(
    query(collection(db, SUBSCRIBERS_COLLECTION), orderBy("createdAt", "desc")),
  );
  return snap.docs.map((d) => d.data() as Subscriber);
}
