import { NextResponse } from "next/server";
import { decodeRestDocument } from "@/lib/firebase/rest";
import { submissionNotificationEmail } from "@/lib/server/email-templates";
import { isMailConfigured, sendMail } from "@/lib/server/mailer";

/**
 * Emails the site owner (GMAIL_USER) when a tool is submitted. Called
 * fire-and-forget by /submission after a successful create.
 *
 * Auth model, mirroring verify-admin: the caller sends their own ID token
 * and we read the submission THROUGH Firestore with that token. Rules only
 * let the owner read their own submission, so a valid response proves a
 * real signed-in user really created this doc; the uid check below stops
 * one user triggering mail for another's submission. Worst case for an
 * abuser is re-notifying about their own real submission.
 */
export async function POST(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  if (!token) return NextResponse.json({ error: "Missing bearer token." }, { status: 401 });

  let uid = "";
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    uid = payload.user_id ?? payload.sub ?? "";
  } catch {
    // fall through to the empty-uid check
  }
  if (!uid) return NextResponse.json({ error: "Invalid token." }, { status: 401 });

  let id = "";
  try {
    id = String(((await request.json()) as { id?: string }).id ?? "");
  } catch {
    // handled below
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    return NextResponse.json({ error: "Invalid submission id." }, { status: 400 });
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) return NextResponse.json({ error: "Not configured." }, { status: 500 });

  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/submissions/${id}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!response.ok) {
    return NextResponse.json({ error: "Submission not found." }, { status: 403 });
  }
  const submission = decodeRestDocument(await response.json());
  if (submission.uid !== uid) {
    return NextResponse.json({ error: "Not your submission." }, { status: 403 });
  }

  if (!isMailConfigured()) return NextResponse.json({ sent: false });

  try {
    const aliases = (submission.aliases as { text?: string; caseSensitive?: boolean }[] | undefined) ?? [];
    const email = submissionNotificationEmail({
      name: String(submission.name ?? id),
      toolId: id,
      url: String(submission.url ?? ""),
      price: String(submission.price ?? ""),
      aliases: aliases.map((a) => (a.caseSensitive ? `${a.text}!` : `${a.text}`)),
      categories: (submission.categorySlugs as string[] | undefined) ?? [],
      submitterEmail: submission.email ? String(submission.email) : null,
    });
    await sendMail({ to: process.env.GMAIL_USER!, ...email });
    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error("submission notification failed:", error);
    return NextResponse.json({ sent: false });
  }
}
