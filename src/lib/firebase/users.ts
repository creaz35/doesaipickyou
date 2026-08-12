import type { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, type Firestore } from "firebase/firestore";

export type UserRole = "user" | "admin";

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  photoURL: string | null;
  /** Firestore Timestamp, serialized when read. */
  createdAt?: unknown;
}

export const USERS_COLLECTION = "users";

/**
 * Splits a Google display name into first/last. Anything past the first
 * space is the last name, which is wrong for some names but is only a
 * default the user can correct later.
 */
export function splitDisplayName(displayName: string | null): {
  firstName: string;
  lastName: string;
} {
  const parts = (displayName ?? "").trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

export async function fetchUserProfile(db: Firestore, uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

/**
 * Creates the profile document on first sign-in. Role is always "user":
 * Firestore rules reject any client-written role, so admin is granted by
 * editing the document in the Firebase console.
 *
 * Existing profiles are left untouched, so a returning Google user never
 * has their name (or role) overwritten.
 */
export async function ensureUserProfile(
  db: Firestore,
  user: Pick<User, "uid" | "email" | "photoURL">,
  names: { firstName: string; lastName: string },
): Promise<UserProfile> {
  const existing = await fetchUserProfile(db, user.uid);
  if (existing) return existing;

  const profile: UserProfile = {
    uid: user.uid,
    email: user.email ?? "",
    firstName: names.firstName,
    lastName: names.lastName,
    role: "user",
    photoURL: user.photoURL ?? null,
  };

  await setDoc(doc(db, USERS_COLLECTION, user.uid), {
    ...profile,
    createdAt: serverTimestamp(),
  });

  return profile;
}
