import Link from "next/link";
import { ToolIcon } from "@/components/ToolIcon";
import { TrackedLink } from "@/components/TrackedLink";
import type { SponsorInfo } from "@/lib/sponsor-spots";
import { withUtm } from "@/lib/utm";

/**
 * Sponsor bars for screens too small for the side rails (hidden on 2xl+
 * where the rails take over): one above the header, one fixed to the
 * bottom of the viewport. Sponsors scroll in an endless marquee, favicon
 * and name at full size. Clicks count into the same per-sponsor totals as
 * rail clicks, tagged utm_campaign=sponsor_ticker.
 *
 * Server component: the marquee is pure CSS, only the tracked links ship
 * client code.
 */

/** Repeats per half so the loop is wider than any phone viewport. */
const REPEATS = 3;

function MarqueeItems({ sponsors, copy }: { sponsors: SponsorInfo[]; copy: number }) {
  return (
    <>
      {Array.from({ length: REPEATS }, (_, r) => (
        <span key={r} className="flex items-center">
          {sponsors.map((sponsor) => (
            <TrackedLink
              key={`${copy}-${r}-${sponsor.sessionId}`}
              kind="sponsor"
              id={sponsor.sessionId}
              href={withUtm(sponsor.url, "sponsor_ticker")}
              target="_blank"
              rel="noopener sponsored"
              className="group mx-6 flex shrink-0 items-center gap-2.5"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white">
                <ToolIcon name={sponsor.name} url={sponsor.url} size={18} />
              </span>
              <span className="whitespace-nowrap text-sm font-semibold text-white group-hover:underline group-hover:decoration-emerald-400 group-hover:underline-offset-2">
                {sponsor.name}
              </span>
            </TrackedLink>
          ))}
          <Link
            key={`${copy}-${r}-cta`}
            href="/sponsor"
            className="mx-6 flex shrink-0 items-center gap-2 whitespace-nowrap text-sm text-stone-400 hover:text-white"
          >
            <span className="text-emerald-400" aria-hidden="true">
              ＋
            </span>
            your product here
          </Link>
        </span>
      ))}
    </>
  );
}

export function SponsorBar({
  sponsors,
  position,
}: {
  sponsors: SponsorInfo[];
  position: "top" | "bottom";
}) {
  const shell =
    position === "top"
      ? "border-b-2 border-stone-900 dark:border-stone-700"
      : "fixed inset-x-0 bottom-0 z-40 border-t-2 border-stone-900 pb-[env(safe-area-inset-bottom)] dark:border-stone-700";

  return (
    <div className={`bg-stone-900 text-stone-100 2xl:hidden dark:bg-black ${shell}`}>
      {sponsors.length === 0 ? (
        <Link
          href="/sponsor"
          className="group mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2.5 text-sm"
        >
          <span className="min-w-0 truncate text-stone-300">
            <span aria-hidden="true">✨</span> This spot is for rent, on every page of the site.
          </span>
          <span className="shrink-0 rounded-full bg-emerald-500 px-3 py-1 text-sm font-semibold text-white shadow-[2px_2px_0_0_rgba(0,0,0,0.6)] transition-transform group-hover:-translate-y-0.5 group-active:translate-y-0">
            Sponsor me →
          </span>
        </Link>
      ) : (
        <div className="flex overflow-hidden py-2.5">
          {/* Two identical halves sliding left forever = seamless loop. */}
          <div className="flex shrink-0 animate-[marquee_30s_linear_infinite] motion-reduce:animate-none">
            <MarqueeItems sponsors={sponsors} copy={0} />
          </div>
          <div
            aria-hidden="true"
            className="flex shrink-0 animate-[marquee_30s_linear_infinite] motion-reduce:animate-none"
          >
            <MarqueeItems sponsors={sponsors} copy={1} />
          </div>
        </div>
      )}
    </div>
  );
}
