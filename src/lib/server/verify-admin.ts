/**
 * Verifies that an API request comes from a signed-in admin, without a
 * Firebase service account.
 *
 * The uid is decoded from the JWT payload WITHOUT verifying the signature;
 * the Firestore read below is what actually authenticates. Firestore
 * validates the ID token server-side, and the security rules only allow
 * reading users/{uid} when the token's own uid matches, so a forged or
 * expired token cannot produce a successful read.
 */
export type AdminCheck = { ok: true; uid: string } | { ok: false; status: number; error: string };

export async function verifyAdmin(request: Request): Promise<AdminCheck> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  if (!token) return { ok: false, status: 401, error: "Missing bearer token." };

  let uid = "";
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    uid = payload.user_id ?? payload.sub ?? "";
  } catch {
    // fall through to the empty-uid check
  }
  if (!uid) return { ok: false, status: 401, error: "Invalid token." };

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) return { ok: false, status: 500, error: "Firebase is not configured." };

  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!response.ok) return { ok: false, status: 403, error: "Could not verify your account." };

  const doc = (await response.json()) as { fields?: { role?: { stringValue?: string } } };
  if (doc.fields?.role?.stringValue !== "admin") {
    return { ok: false, status: 403, error: "Admin role required." };
  }

  return { ok: true, uid };
}
