import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Firestore,
} from "firebase/firestore";
import type { StoredAlias } from "@/lib/firebase/catalog";

/**
 * In-site tool submissions. A submission is a proposed catalog entry made
 * by a signed-in founder; nothing goes live until an admin approves it in
 * /admin, which copies it into the tools collection with ownerUid set to
 * the submitter (that link is the "claim"). The doc id is the proposed
 * tool slug, so two people cannot race for the same id: rules are
 * create-only for users, and a second setDoc on an existing id is an
 * update, which gets denied.
 */

export const SUBMISSIONS_COLLECTION = "submissions";

export type SubmissionStatus = "pending" | "active" | "rejected";

export interface ToolSubmission {
  /** Proposed tool id, doubles as the doc id. Stable forever if approved. */
  id: string;
  name: string;
  url: string;
  price: string;
  aliases: StoredAlias[];
  categorySlugs: string[];
  status: SubmissionStatus;
  /** The submitter; becomes ownerUid on the tool when approved. */
  uid: string;
  email: string | null;
  createdAt?: unknown;
}

export async function createSubmission(
  db: Firestore,
  submission: Omit<ToolSubmission, "status" | "createdAt">,
): Promise<void> {
  await setDoc(doc(db, SUBMISSIONS_COLLECTION, submission.id), {
    ...submission,
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

/** The signed-in user's own submissions (rules restrict the query to uid). */
export async function fetchMySubmissions(db: Firestore, uid: string): Promise<ToolSubmission[]> {
  const snap = await getDocs(
    query(collection(db, SUBMISSIONS_COLLECTION), where("uid", "==", uid)),
  );
  return snap.docs.map((d) => d.data() as ToolSubmission);
}

/** Admin: every submission, newest first. */
export async function fetchAllSubmissions(db: Firestore): Promise<ToolSubmission[]> {
  const snap = await getDocs(
    query(collection(db, SUBMISSIONS_COLLECTION), orderBy("createdAt", "desc")),
  );
  return snap.docs.map((d) => d.data() as ToolSubmission);
}

export async function setSubmissionStatus(
  db: Firestore,
  id: string,
  status: SubmissionStatus,
): Promise<void> {
  await updateDoc(doc(db, SUBMISSIONS_COLLECTION, id), {
    status,
    reviewedAt: serverTimestamp(),
  });
}
