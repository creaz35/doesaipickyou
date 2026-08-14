import { NextResponse } from "next/server";

/**
 * Anonymous live-visitor presence for "who's in the machine right now".
 *
 * POST: heartbeat from a browser: random per-tab id, current path, and a
 * geo hint the client derives from its own IANA timezone (no network
 * call, no IP lookup). If the site ever sits behind Cloudflare, the
 * cf-ipcountry header takes precedence over the client hint.
 * GET: current stats (count, countries, recent activity).
 *
 * Privacy: the id is a random client string mapping to nothing, geo is
 * timezone-level (city at best, self-reported), and no IP or user agent
 * is stored. Entries expire after 2 minutes without a heartbeat.
 *
 * The store is process memory anchored on globalThis: perfect on a
 * single-instance deploy, resets on restart (fine for a live counter).
 * If the app ever scales to multiple instances, counts fragment and this
 * should move to a shared store.
 */

export const dynamic = "force-dynamic";

const PRUNE_MS = 2 * 60 * 1000;
const MAX_ENTRIES = 5000;

interface PresenceEntry {
  country: string;
  city: string;
  path: string;
  lastSeen: number;
}

const globalStore = globalThis as typeof globalThis & {
  __daipyPresence?: Map<string, PresenceEntry>;
};
const store = globalStore.__daipyPresence ?? (globalStore.__daipyPresence = new Map());

function prune(now: number) {
  for (const [id, entry] of store) {
    if (now - entry.lastSeen > PRUNE_MS) store.delete(id);
  }
}

export async function POST(request: Request) {
  const now = Date.now();
  prune(now);

  let body: { id?: string; path?: string; country?: string; city?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Bad body." }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : "";
  if (id.length < 8 || id.length > 64) {
    return NextResponse.json({ error: "Bad id." }, { status: 400 });
  }

  // Rendering crawlers execute JS and would fire the beacon; drop them the
  // same way analytics tools do, or bots show up as "visitors"
  const ua = (request.headers.get("user-agent") ?? "").toLowerCase();
  if (
    !ua ||
    /bot|crawl|spider|slurp|headless|lighthouse|pingdom|uptime|monitor|preview|scrape|fetch|curl|python|node-fetch|axios/.test(ua)
  ) {
    return NextResponse.json({ ok: true });
  }
  if (store.size >= MAX_ENTRIES && !store.has(id)) {
    return NextResponse.json({ ok: true });
  }

  const isCountry = (c: string) => /^[A-Z]{2}$/.test(c) && c !== "XX" && c !== "T1";
  const headerCountry = (request.headers.get("cf-ipcountry") ?? "").trim().toUpperCase();
  const bodyCountry = String(body.country ?? "").trim().toUpperCase();
  const country = isCountry(headerCountry) ? headerCountry : isCountry(bodyCountry) ? bodyCountry : "";

  const city = String(body.city ?? "")
    .replace(/[^\p{L}\p{N} .'-]/gu, "")
    .slice(0, 40);
  // Internal paths only: "//host" would be a protocol-relative external URL
  const path =
    typeof body.path === "string" && body.path.startsWith("/") && !body.path.startsWith("//")
      ? body.path.slice(0, 80)
      : "/";

  store.set(id, { country, city, path, lastSeen: now });
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const now = Date.now();
  prune(now);

  const entries = [...store.values()];
  const countries: Record<string, number> = {};
  for (const entry of entries) {
    if (entry.country) countries[entry.country] = (countries[entry.country] ?? 0) + 1;
  }
  const recent = entries
    .sort((a, b) => b.lastSeen - a.lastSeen)
    .slice(0, 4)
    .map((entry) => ({
      country: entry.country,
      city: entry.city,
      path: entry.path,
      ago: Math.max(0, Math.round((now - entry.lastSeen) / 1000)),
    }));

  return NextResponse.json(
    { count: entries.length, countries, recent },
    { headers: { "cache-control": "no-store" } },
  );
}
