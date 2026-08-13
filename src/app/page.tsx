import Link from "next/link";
import { Newsletter } from "@/components/Newsletter";
import { ToolExplorer, type CategoryTab } from "@/components/ToolExplorer";
import { WhoIsHere } from "@/components/WhoIsHere";
import { getSiteData } from "@/lib/site-data";
import { MODEL_LABELS } from "@/lib/types";

// Re-render from Firestore at most hourly; the admin runner writes there.
export const revalidate = 3600;

function ModelChip({ label }: { label: string }) {
  return (
    <Link
      href="/models"
      className="rounded-md border border-stone-300 bg-white px-1.5 py-0.5 font-mono text-sm transition-colors hover:border-stone-900 hover:text-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:hover:border-stone-400 dark:hover:text-stone-100"
    >
      {label}
    </Link>
  );
}

export default async function Home() {
  const data = await getSiteData();

  const tabs: CategoryTab[] = data.categories.map((category) => ({
    slug: category.slug,
    emoji: category.emoji,
    name: category.name,
    scores: category.scores,
  }));

  return (
    <div className="space-y-8">
      <section className="relative space-y-5 pt-6 text-center">
        <span
          aria-hidden="true"
          className="absolute left-[8%] top-0 hidden -rotate-12 text-3xl text-emerald-500 md:block"
        >
          ✦
        </span>
        <span
          aria-hidden="true"
          className="absolute right-[10%] top-12 hidden rotate-12 text-xl text-amber-400 md:block"
        >
          ✧
        </span>
        <h1 className="font-display text-6xl font-extrabold tracking-tight sm:text-7xl">
          Does AI pick{" "}
          <span className="relative inline-block whitespace-nowrap">
            <span className="relative z-10">you</span>
            <span
              aria-hidden="true"
              className="absolute -inset-x-1 bottom-1 h-[0.5em] -rotate-2 rounded-sm bg-emerald-300/90 dark:bg-emerald-500/40"
            />
          </span>
          ?
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-stone-600 dark:text-stone-400">
          We ask{" "}
          {data.models.length > 0 ? (
            data.models.map((m, i) => (
              <span key={m}>
                {i > 0 && (i === data.models.length - 1 ? " and " : ", ")}
                <ModelChip label={MODEL_LABELS[m] ?? m} />
              </span>
            ))
          ) : (
            <span>the major AI models</span>
          )}{" "}
          the questions your buyers ask, like &ldquo;best form builder for a solo founder&rdquo;,
          and track which products they actually recommend.
        </p>
        {data.snapshotId && (
          <p className="text-sm text-stone-500">
            Latest snapshot: <span className="font-mono">{data.snapshotId}</span> ·{" "}
            {data.totalRuns.toLocaleString()} runs across{" "}
            <Link href="/categories" className="underline hover:text-stone-900 dark:hover:text-stone-100">
              {data.categories.length} categories
            </Link>{" "}
            ·{" "}
            <Link href="/models" className="underline hover:text-stone-900 dark:hover:text-stone-100">
              compare by model
            </Link>
          </p>
        )}
      </section>

      {data.source === "mock" && (
        <div className="rounded-xl border-2 border-amber-400 bg-amber-100 px-4 py-3 text-sm font-medium text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          🚧 You are looking at generated sample data. The first real snapshot replaces it.
        </div>
      )}

      <ToolExplorer categories={tabs} />

      <WhoIsHere />

      <Newsletter />
    </div>
  );
}
