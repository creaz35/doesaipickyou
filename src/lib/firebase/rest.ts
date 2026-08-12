/**
 * Minimal server-side Firestore reader over the REST API.
 *
 * Public pages render on the server (build time + ISR revalidation), where
 * the client SDK doesn't belong. The catalog and snapshot collections are
 * world-readable by security rules, so these requests carry no credentials.
 */

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

export function isFirestoreRestConfigured(): boolean {
  return Boolean(PROJECT_ID);
}

function baseUrl(): string {
  return `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
}

interface FirestoreValue {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  nullValue?: null;
  timestampValue?: string;
  referenceValue?: string;
  mapValue?: { fields?: Record<string, FirestoreValue> };
  arrayValue?: { values?: FirestoreValue[] };
}

interface FirestoreDoc {
  name: string;
  fields?: Record<string, FirestoreValue>;
}

function decodeValue(value: FirestoreValue): unknown {
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.integerValue !== undefined) return Number(value.integerValue);
  if (value.doubleValue !== undefined) return value.doubleValue;
  if (value.booleanValue !== undefined) return value.booleanValue;
  if ("nullValue" in value) return null;
  if (value.timestampValue !== undefined) return value.timestampValue;
  if (value.referenceValue !== undefined) return value.referenceValue;
  if (value.mapValue) return decodeFields(value.mapValue.fields ?? {});
  if (value.arrayValue) return (value.arrayValue.values ?? []).map(decodeValue);
  return null;
}

function decodeFields(fields: Record<string, FirestoreValue>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]));
}

function decodeDoc(doc: FirestoreDoc): Record<string, unknown> {
  return decodeFields(doc.fields ?? {});
}

/** Reads a whole collection (follows pagination). Throws on HTTP errors. */
export async function fetchRestCollection(path: string): Promise<Record<string, unknown>[]> {
  const docs: Record<string, unknown>[] = [];
  let pageToken: string | undefined;
  do {
    const url = new URL(`${baseUrl()}/${path}`);
    url.searchParams.set("pageSize", "300");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error(`Firestore REST ${response.status} for ${path}`);
    const data = (await response.json()) as { documents?: FirestoreDoc[]; nextPageToken?: string };
    for (const doc of data.documents ?? []) docs.push(decodeDoc(doc));
    pageToken = data.nextPageToken;
  } while (pageToken);
  return docs;
}

/** Reads a single document; null when it doesn't exist. */
export async function fetchRestDoc(path: string): Promise<Record<string, unknown> | null> {
  const response = await fetch(`${baseUrl()}/${path}`, { signal: AbortSignal.timeout(10_000) });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Firestore REST ${response.status} for ${path}`);
  return decodeDoc((await response.json()) as FirestoreDoc);
}
