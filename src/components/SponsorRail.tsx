import Link from "next/link";
import { ToolIcon } from "@/components/ToolIcon";
import { TrackedLink } from "@/components/TrackedLink";
import { railSpots, type RailSide, type SponsorInfo } from "@/lib/sponsor-spots";
import { withUtm } from "@/lib/utm";

// Full literal class strings so Tailwind's scanner picks them up.
// Tone follows the slot, not the sponsor, so the rails stay balanced.
const SLOT_TONES = [
  "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950",
  "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950",
  "border-violet-200 bg-violet-50 dark:border-violet-900 dark:bg-violet-950",
  "border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950",
  "border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950",
  "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950",
];

function SponsorCard({ sponsor, tone }: { sponsor: SponsorInfo; tone: string }) {
  return (
    <TrackedLink
      kind="sponsor"
      id={sponsor.sessionId}
      href={withUtm(sponsor.url, "sponsor_card")}
      target="_blank"
      rel="noopener sponsored"
      className={`block rounded-2xl border-2 p-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--ink)] ${tone}`}
    >
      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-stone-900">
        <ToolIcon name={sponsor.name} url={sponsor.url} size={28} />
      </div>
      <div className="font-mono text-sm font-semibold">{sponsor.name}</div>
      <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">{sponsor.tagline}</p>
    </TrackedLink>
  );
}

/** Same anatomy as SponsorCard (icon tile, name, tagline) so slots line up. */
function PlaceholderCard({ spot }: { spot: string }) {
  return (
    <Link
      href={`/sponsor?spot=${spot}`}
      className="block rounded-2xl border-2 border-dashed border-stone-300 p-4 text-center transition-all hover:-translate-y-0.5 hover:border-emerald-500 dark:border-stone-700 dark:hover:border-emerald-500"
    >
      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-stone-300 text-lg text-stone-400 dark:border-stone-700">
        +
      </div>
      <div className="font-mono text-sm font-semibold text-stone-500">Sponsor this spot</div>
      <p className="mt-1 text-xs text-stone-500">your product, right here →</p>
    </Link>
  );
}

/**
 * Fixed sponsor rail pinned to the viewport edge. Only rendered on 2xl+
 * screens, where there is room beside the max-w-5xl content column.
 * Sponsors come from Firestore (sold via /sponsor, activated in /admin).
 */
export function SponsorRail({ side, sponsors }: { side: RailSide; sponsors: SponsorInfo[] }) {
  const bySpot = new Map(sponsors.map((s) => [s.spot, s]));
  return (
    <aside
      className={`fixed top-20 hidden w-52 flex-col gap-3 2xl:flex ${
        side === "left" ? "left-4" : "right-4"
      }`}
    >
      {railSpots(side).map((spot, i) => {
        const sponsor = bySpot.get(spot);
        return sponsor ? (
          <SponsorCard key={spot} sponsor={sponsor} tone={SLOT_TONES[i % SLOT_TONES.length]} />
        ) : (
          <PlaceholderCard key={spot} spot={spot} />
        );
      })}
    </aside>
  );
}
