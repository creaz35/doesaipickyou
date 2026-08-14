"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { countryName, flagEmoji, getGeoHint, pathLabel } from "@/lib/presence-geo";

/**
 * "Who's in the machine right now": anonymous live visitors, rendered as
 * the brand's little cube mascots. PresenceBeacon is the invisible half,
 * heartbeating from every page via the layout so the count covers the
 * whole site; WhoIsHere is the visible card on / and /stats.
 */

const HEARTBEAT_MS = 45_000;
const REFRESH_MS = 30_000;

// localStorage, not sessionStorage: one id per browser, so ten open tabs
// heartbeat as one visitor instead of ten
let memoryId: string | undefined;
function presenceId(): string {
  try {
    let id = localStorage.getItem("daipy-presence-id");
    if (!id) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem("daipy-presence-id", id);
    }
    return id;
  } catch {
    // Storage blocked (private mode): keep one stable id per tab at least
    if (!memoryId) memoryId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return memoryId;
  }
}

function sendHeartbeat() {
  try {
    const geo = getGeoHint();
    void fetch("/api/presence", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: presenceId(), path: window.location.pathname, ...geo }),
    }).catch(() => {});
  } catch {
    // presence must never break a page
  }
}

export function PresenceBeacon() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, HEARTBEAT_MS);
    return () => clearInterval(interval);
  }, [pathname]);
  return null;
}

interface PresenceStats {
  count: number;
  countries: Record<string, number>;
  recent: { country: string; city: string; path: string; ago: number }[];
}

/** One visitor = one cube in the machine, with a few face variants. */
function Cube({ index, sizeClass }: { index: number; sizeClass: string }) {
  const variant = index % 3;
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${sizeClass} animate-[cube-bob_2.4s_ease-in-out_infinite] motion-reduce:animate-none`}
      style={{
        animationDelay: `${-(index * 0.37) % 2.4}s`,
        transform: `rotate(${index % 2 === 0 ? -5 : 4}deg)`,
      }}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" fill="#10b981" stroke="#1c1917" strokeWidth="2" />
      {variant === 1 ? (
        <>
          {/* happy closed eyes */}
          <path d="M6.5 10.5 Q8 8.8 9.5 10.5" fill="none" stroke="#1c1917" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M14.5 10.5 Q16 8.8 17.5 10.5" fill="none" stroke="#1c1917" strokeWidth="1.6" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="8.2" cy="10" r="1.7" fill="#1c1917" />
          <circle cx="15.8" cy="10" r="1.7" fill="#1c1917" />
        </>
      )}
      {variant === 2 ? (
        <circle cx="12" cy="16" r="2" fill="#1c1917" />
      ) : (
        <path d="M8.5 15.2 Q12 18 15.5 15.2" fill="none" stroke="#1c1917" strokeWidth="1.8" strokeLinecap="round" />
      )}
    </svg>
  );
}

function agoLabel(seconds: number): string {
  if (seconds < 8) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.round(seconds / 60)}m ago`;
}

/**
 * The pit stays fun at any crowd size: cubes shrink as the machine fills
 * (a packed pit of tiny cubes reads as "wow, busy"), and past 120 we stop
 * adding DOM nodes and count the rest on the overflow chip.
 */
function pitPlan(count: number): { sizeClass: string; gapClass: string; shown: number } {
  if (count <= 14) return { sizeClass: "h-6 w-6", gapClass: "gap-1.5", shown: count };
  if (count <= 48) return { sizeClass: "h-4 w-4", gapClass: "gap-1", shown: count };
  return { sizeClass: "h-3 w-3", gapClass: "gap-0.5", shown: Math.min(count, 120) };
}

/** Feed paths are client-reported; only link the clean internal ones. */
function isSafeInternalPath(path: string): boolean {
  return /^\/[a-z0-9\-/]*$/.test(path);
}

export function WhoIsHere() {
  const [stats, setStats] = useState<PresenceStats | null>(null);

  useEffect(() => {
    const refresh = async () => {
      try {
        const response = await fetch("/api/presence");
        if (response.ok) setStats((await response.json()) as PresenceStats);
      } catch {
        // stay hidden rather than break the page
      }
    };
    // Heartbeat first so the visitor counts themselves immediately.
    sendHeartbeat();
    const first = setTimeout(refresh, 600);
    const interval = setInterval(refresh, REFRESH_MS);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, []);

  if (!stats || stats.count < 1) return null;

  const countryEntries = Object.entries(stats.countries).sort((a, b) => b[1] - a[1]);
  const topCountries = countryEntries.slice(0, 6);
  const moreCountries = countryEntries.length - topCountries.length;
  const pit = pitPlan(stats.count);

  return (
    <section
      aria-label="Live visitors"
      className="rounded-2xl border-2 border-stone-900 bg-white p-5 shadow-[5px_5px_0_0_var(--ink)] sm:p-6 dark:border-stone-600 dark:bg-stone-900"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-stone-900 bg-emerald-100 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-800 dark:border-stone-600 dark:bg-emerald-950 dark:text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            live
          </span>
          <h2 className="font-display text-xl font-bold">Who&apos;s in the machine right now</h2>
        </div>
        <p className="text-xs text-stone-400">timezone-level guess, nobody is identifiable</p>
      </div>

      <div className="grid items-center gap-6 lg:grid-cols-[auto_1fr]">
        <div>
          <div className="flex items-baseline gap-4">
            <span className="font-display text-6xl font-extrabold leading-none tabular-nums">
              {stats.count}
            </span>
            <p className="text-sm font-medium text-stone-600 dark:text-stone-400">
              {stats.count === 1 ? (
                <>
                  cube in the machine
                  <br />
                  (that&apos;s you 👋)
                </>
              ) : (
                <>
                  cubes in the machine,
                  <br />
                  waiting to be picked
                </>
              )}
            </p>
          </div>

          <div
            title={`${stats.count} ${stats.count === 1 ? "visitor" : "visitors"} right now`}
            className={`mt-4 flex max-w-sm flex-wrap items-end rounded-xl border-2 border-dashed border-stone-300 px-3 pb-2.5 pt-4 dark:border-stone-700 ${pit.gapClass}`}
          >
            {Array.from({ length: pit.shown }, (_, i) => (
              <Cube key={i} index={i} sizeClass={pit.sizeClass} />
            ))}
            {stats.count > pit.shown && (
              <span className="pb-0.5 font-mono text-xs font-semibold text-stone-500">
                +{stats.count - pit.shown}
              </span>
            )}
          </div>

          {topCountries.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {topCountries.map(([code, count]) => (
                <span
                  key={code}
                  title={countryName(code)}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-stone-200 bg-white px-2.5 py-0.5 font-mono text-xs font-semibold text-stone-700 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-300"
                >
                  <span aria-hidden="true">{flagEmoji(code)}</span>
                  {code}
                  <span className="text-stone-400">{count}</span>
                </span>
              ))}
              {moreCountries > 0 && (
                <span className="inline-flex items-center px-1 font-mono text-xs text-stone-400">
                  +{moreCountries} more
                </span>
              )}
            </div>
          )}
        </div>

        <div className="divide-y divide-stone-100 dark:divide-stone-800">
          {stats.recent.map((visitor, index) => (
            <div key={index} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <span className="shrink-0 text-lg leading-none" aria-hidden="true">
                {flagEmoji(visitor.country)}
              </span>
              <p className="min-w-0 flex-1 truncate text-sm text-stone-600 dark:text-stone-400">
                someone{" "}
                {visitor.city ? (
                  <>
                    near <span className="font-semibold text-stone-900 dark:text-stone-100">{visitor.city}</span>
                  </>
                ) : (
                  <>in {countryName(visitor.country)}</>
                )}{" "}
                is checking{" "}
                {isSafeInternalPath(visitor.path) ? (
                  <Link
                    href={visitor.path}
                    className="font-mono text-xs text-emerald-700 underline decoration-emerald-300 underline-offset-2 hover:decoration-emerald-600 dark:text-emerald-400 dark:decoration-emerald-800 dark:hover:decoration-emerald-400"
                  >
                    {pathLabel(visitor.path)}
                  </Link>
                ) : (
                  <span className="font-mono text-xs text-emerald-700 dark:text-emerald-400">
                    {pathLabel(visitor.path)}
                  </span>
                )}
              </p>
              <span className="shrink-0 text-xs text-stone-400">{agoLabel(visitor.ago)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
