import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES } from "@/data/categories";
import { getSiteData } from "@/lib/site-data";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Categories",
  description: "Every category we track, with the current top three tools by AI visibility.",
};

const MEDALS = ["🥇", "🥈", "🥉"];

// Full literal class strings so Tailwind's scanner picks them up.
const TONES = [
  "border-emerald-300 bg-emerald-100/70 dark:border-emerald-900 dark:bg-emerald-950/60",
  "border-amber-300 bg-amber-100/70 dark:border-amber-900 dark:bg-amber-950/60",
  "border-violet-300 bg-violet-100/70 dark:border-violet-900 dark:bg-violet-950/60",
  "border-sky-300 bg-sky-100/70 dark:border-sky-900 dark:bg-sky-950/60",
  "border-rose-300 bg-rose-100/70 dark:border-rose-900 dark:bg-rose-950/60",
  "border-yellow-300 bg-yellow-100/70 dark:border-yellow-900 dark:bg-yellow-950/60",
];

export default async function CategoriesPage() {
  const data = await getSiteData();
  const totalTools = CATEGORIES.reduce((n, c) => n + c.products.length, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">All categories</h1>
        <p className="mt-2 text-stone-600 dark:text-stone-400">
          {data.categories.length} categories, {totalTools} tools tracked. Each card shows the
          current top three by AI visibility.
        </p>
      </div>

      {data.source === "mock" && (
        <div className="rounded-xl border-2 border-amber-400 bg-amber-100 px-4 py-3 text-sm font-medium text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          🚧 Generated sample data, not real model output yet.
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.categories.map((category, i) => {
          const top = category.scores.slice(0, 3);
          return (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className={`group rounded-2xl border-2 p-5 transition-all hover:-translate-y-1 hover:shadow-[5px_5px_0_0_var(--ink)] ${TONES[i % TONES.length]}`}
            >
              <span className="mb-2 block text-2xl" aria-hidden="true">
                {category.emoji}
              </span>
              <h2 className="mb-3 font-display font-bold">{category.name}</h2>
              {top.length > 0 ? (
                <ol className="space-y-2">
                  {top.map((score, rank) => (
                    <li key={score.productId} className="flex items-center gap-2 text-sm">
                      <span className="w-6 shrink-0" aria-hidden="true">
                        {MEDALS[rank]}
                      </span>
                      <span className="flex-1 truncate">{score.name}</span>
                      <span className="font-mono font-semibold">{score.visibility}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-stone-500">First snapshot pending</p>
              )}
            </Link>
          );
        })}
      </section>
    </div>
  );
}
