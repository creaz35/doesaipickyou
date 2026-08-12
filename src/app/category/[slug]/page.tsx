import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InvisibleBadge } from "@/components/InvisibleBadge";
import { CATEGORIES, getCategory } from "@/data/categories";
import { TEMPLATES } from "@/data/templates";
import { getSiteData } from "@/lib/site-data";
import { MODEL_LABELS } from "@/lib/types";

export const revalidate = 3600;

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  // The code catalog first; categories added via /admin only exist in
  // Firestore, which getSiteData appends.
  const category =
    getCategory(slug) ?? (await getSiteData()).categories.find((c) => c.slug === slug);
  if (!category) return {};
  return {
    title: category.name,
    description: `Which ${category.noun} do AI models actually recommend? Monthly AI visibility leaderboard.`,
  };
}

export default async function CategoryPage({ params }: PageProps<"/category/[slug]">) {
  const { slug } = await params;

  // getSiteData covers both code-catalog and admin-added categories;
  // anything in neither 404s.
  const data = await getSiteData();
  const category = data.categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const scores = category.scores;
  const invisible = scores.filter((s) => s.visibility === 0);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/" className="text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100">
          ← All categories
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
          <span aria-hidden="true">{category.emoji}</span> {category.name}
        </h1>
        {data.snapshotId && (
          <p className="mt-2 text-sm text-stone-500">
            Snapshot <span className="font-mono">{data.snapshotId}</span> ·{" "}
            {TEMPLATES.length} prompts ×{" "}
            {data.models.map((m) => MODEL_LABELS[m] ?? m).join(" + ")} × {data.runsPerPrompt} runs
            each
          </p>
        )}
      </div>

      {data.source === "mock" && (
        <div className="rounded-xl border-2 border-amber-400 bg-amber-100 px-4 py-3 text-sm font-medium text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          🚧 Generated sample data, not real model output yet.
        </div>
      )}

      {scores.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-stone-900 text-left font-mono text-[10px] uppercase tracking-widest text-stone-500 dark:border-stone-700">
                <th className="py-2 pr-4 font-medium">#</th>
                <th className="py-2 pr-4 font-medium">Product</th>
                <th className="py-2 pr-4 font-medium">Visibility</th>
                <th className="py-2 pr-4 font-medium">Mention rate</th>
                <th className="py-2 font-medium">Avg. position</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((score, i) => (
                <tr key={score.productId} className="border-b border-stone-100 dark:border-stone-900">
                  <td className="py-3 pr-4">
                    {i < 3 ? (
                      <span className="text-lg" aria-label={`Rank ${i + 1}`}>
                        {["🥇", "🥈", "🥉"][i]}
                      </span>
                    ) : (
                      <span className="font-mono text-stone-400">{i + 1}</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <Link
                      href={`/${score.productId}`}
                      className="font-medium hover:text-emerald-600 dark:hover:text-emerald-400"
                    >
                      {score.name}
                    </Link>
                    {score.visibility === 0 && (
                      <span className="ml-2 inline-block align-middle">
                        <InvisibleBadge />
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 w-32 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                          style={{ width: `${score.visibility}%` }}
                        />
                      </div>
                      <span className="font-mono font-semibold">{score.visibility}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 font-mono">{Math.round(score.mentionRate * 100)}%</td>
                  <td className="py-3 font-mono">{score.avgPosition ?? "n/a"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-stone-500">No snapshot yet. The first run for this category hasn&apos;t happened.</p>
      )}

      {invisible.length > 0 && (
        <p className="text-sm text-stone-500">
          {invisible.map((s) => s.name).join(", ")}{" "}
          {invisible.length === 1 ? "was" : "were"} never mentioned in any run this month.
        </p>
      )}

      <p className="text-sm text-stone-500">
        Visibility is the position-weighted share of runs that name the product.{" "}
        <Link href="/methodology" className="underline hover:text-stone-900 dark:hover:text-stone-100">
          Full methodology
        </Link>
        , including every prompt we ask.
      </p>
    </div>
  );
}
