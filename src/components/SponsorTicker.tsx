"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ToolIcon } from "@/components/ToolIcon";
import { TrackedLink } from "@/components/TrackedLink";
import type { SponsorInfo } from "@/lib/sponsor-spots";
import { withUtm } from "@/lib/utm";

const ROTATE_MS = 4000;

/**
 * Slim rotating sponsor bar above the header for screens too small for the
 * side rails (hidden on 2xl+ where the rails take over). Cycles through
 * the live sponsors; with none sold it advertises the empty spot instead.
 * Clicks count toward the same per-sponsor totals as rail clicks, tagged
 * utm_campaign=sponsor_ticker so sponsors can tell the surfaces apart.
 */
export function SponsorTicker({ sponsors }: { sponsors: SponsorInfo[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (sponsors.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % sponsors.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [sponsors.length]);

  const sponsor = sponsors.length > 0 ? sponsors[index % sponsors.length] : null;

  return (
    <div className="bg-stone-900 text-stone-100 2xl:hidden dark:bg-black">
      <div className="mx-auto flex max-w-5xl items-center gap-2.5 overflow-hidden px-4 py-2 text-xs">
        <span className="shrink-0 font-mono text-[9px] font-semibold uppercase tracking-widest text-emerald-400">
          Sponsor
        </span>
        {sponsor ? (
          <TrackedLink
            key={sponsor.sessionId}
            kind="sponsor"
            id={sponsor.sessionId}
            href={withUtm(sponsor.url, "sponsor_ticker")}
            target="_blank"
            rel="noopener sponsored"
            className="group flex min-w-0 flex-1 animate-[ticker-in_0.4s_ease] items-center gap-2 motion-reduce:animate-none"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white">
              <ToolIcon name={sponsor.name} url={sponsor.url} size={14} />
            </span>
            <span className="shrink-0 font-semibold text-white group-hover:underline group-hover:decoration-emerald-400 group-hover:underline-offset-2">
              {sponsor.name}
            </span>
            <span className="min-w-0 truncate text-stone-400">{sponsor.tagline}</span>
            <span
              aria-hidden="true"
              className="shrink-0 text-emerald-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            >
              ↗
            </span>
          </TrackedLink>
        ) : (
          <Link href="/sponsor" className="group flex min-w-0 flex-1 items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-stone-300">
              <span aria-hidden="true">✨</span> This spot is for rent, on every page of the
              site.
            </span>
            <span className="shrink-0 rounded-full bg-emerald-500 px-2.5 py-0.5 font-semibold text-white shadow-[2px_2px_0_0_rgba(0,0,0,0.6)] transition-transform group-hover:-translate-y-0.5 group-active:translate-y-0">
              Sponsor me →
            </span>
          </Link>
        )}
        {sponsors.length > 1 && (
          <span className="shrink-0 font-mono text-[9px] text-stone-500">
            {(index % sponsors.length) + 1}/{sponsors.length}
          </span>
        )}
      </div>
    </div>
  );
}
