import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnswersPanel } from "@/components/PromptAnswers";
import { ToolIcon } from "@/components/ToolIcon";
import { TrackedLink } from "@/components/TrackedLink";
import { CATEGORIES } from "@/data/categories";
import { getAllProductIds, getProduct, getProductStats } from "@/lib/product-stats";
import { getLiveCategoryRuns, getLiveTool, getSiteData } from "@/lib/site-data";
import { loadLatestSnapshot } from "@/lib/snapshots";
import { MODEL_LABELS, type Snapshot } from "@/lib/types";
import { withUtm } from "@/lib/utm";

const MEDALS = ["🥇", "🥈", "🥉"];

export const revalidate = 3600;

// Code-catalog tools are pre-built; tools added via /admin exist only in
// Firestore, so unknown slugs render on demand (and 404 when they are in
// neither place).
export const dynamicParams = true;

export function generateStaticParams() {
  return getAllProductIds().map((product) => ({ product }));
}

/**
 * The code catalog first, then Firestore (admin-added tools). The extra
 * categorySlugs are only set for Firestore-only tools; getProductStats
 * merges those into their categories.
 */
async function resolveProduct(
  productId: string,
): Promise<{ product: NonNullable<ReturnType<typeof getProduct>>; extraSlugs: string[] } | null> {
  const known = getProduct(productId);
  if (known) return { product: known, extraSlugs: [] };
  const live = await getLiveTool(productId);
  return live ? { product: live.product, extraSlugs: live.categorySlugs } : null;
}

export async function generateMetadata({ params }: PageProps<"/[product]">): Promise<Metadata> {
  const { product: productId } = await params;
  const resolved = await resolveProduct(productId);
  if (!resolved) return {};
  return {
    title: `${resolved.product.name} AI visibility`,
    description: `Do AI models recommend ${resolved.product.name}? Rank, prompt-by-prompt breakdown, and who beats it.`,
  };
}

// Full literal class strings so Tailwind's scanner picks them up.
const TILE_TONES = [
  "border-emerald-300 bg-emerald-100/70 dark:border-emerald-900 dark:bg-emerald-950/60",
  "border-amber-300 bg-amber-100/70 dark:border-amber-900 dark:bg-amber-950/60",
  "border-sky-300 bg-sky-100/70 dark:border-sky-900 dark:bg-sky-950/60",
  "border-violet-300 bg-violet-100/70 dark:border-violet-900 dark:bg-violet-950/60",
];

function StatTile({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail?: string;
  tone: string;
}) {
  return (
    <div className={`rounded-2xl border-2 p-4 ${tone}`}>
      <p className="font-mono text-[10px] uppercase tracking-widest text-stone-600 dark:text-stone-400">
        {label}
      </p>
      <p className="mt-1 font-display text-3xl font-bold">{value}</p>
      {detail && <p className="mt-0.5 text-xs text-stone-500">{detail}</p>}
    </div>
  );
}

function Faq({ name }: { name: string }) {
  const items = [
    {
      q: "What does the visibility score mean?",
      a: `100 means named first in every single answer, 0 means never mentioned. Each mention is weighted by its position, so being the first recommendation counts more than being the fifth. The methodology page lists the exact weights.`,
    },
    {
      q: "Where do these numbers come from?",
      a: `We ask ChatGPT, Claude and friends the six buyer questions shown above, several times each, every month. The answers are parsed for product mentions and the raw text is published behind the 💬 buttons, unedited.`,
    },
    {
      q: `An answer clearly names ${name}. Why wasn't it counted?`,
      a: `Mentions are matched against a hand-maintained alias list, exact words only, never fuzzy. If a real mention slipped through, an alias is missing: that is a one-line fix, so open an issue on GitHub and the next snapshot catches it.`,
    },
    {
      q: `Can ${name} pay for a better rank?`,
      a: `No. Sponsor spots are clearly marked ads on the page edges and never touch the scores. The only way up is being recommended more often by the models themselves.`,
    },
  ];

  return (
    <section>
      <h2 className="mb-3 font-display text-xl font-bold">FAQ</h2>
      <div className="space-y-2">
        {items.map((item) => (
          <details
            key={item.q}
            className="group rounded-xl border-2 border-stone-200 px-4 py-3 transition-colors open:border-stone-900 dark:border-stone-800 dark:open:border-stone-500"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium [&::-webkit-details-marker]:hidden">
              {item.q}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="h-3.5 w-3.5 shrink-0 text-stone-400 transition-transform duration-200 group-open:rotate-180"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">{item.a}</p>
          </details>
        ))}
      </div>
      {/* FAQ rich results in search engines, mirroring the visible text. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: items.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            })),
          }),
        }}
      />
    </section>
  );
}

function Bar({ pct }: { pct: number }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
      <div
        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default async function ProductPage({ params }: PageProps<"/[product]">) {
  const { product: productId } = await params;
  const resolved = await resolveProduct(productId);
  if (!resolved) notFound();
  const { product, extraSlugs } = resolved;

  // Prefer live runs from Firestore (per category this tool competes in);
  // fall back to the committed snapshot when none exist yet.
  const data = await getSiteData();
  let snapshot: Snapshot | null = null;
  if (data.source === "live" && data.snapshotId) {
    const slugs = [
      ...new Set([
        ...CATEGORIES.filter((c) => c.products.some((p) => p.id === productId)).map(
          (c) => c.slug,
        ),
        ...extraSlugs,
      ]),
    ];
    const runsPerCategory = await Promise.all(
      slugs.map((slug) => getLiveCategoryRuns(data.snapshotId!, slug)),
    );
    const runs = runsPerCategory.flatMap((r) => r ?? []);
    if (runs.length > 0) {
      snapshot = {
        id: data.snapshotId,
        createdAt: "",
        models: data.models,
        runsPerPrompt: data.runsPerPrompt,
        runs,
      };
    }
  }
  snapshot ??= loadLatestSnapshot();
  const stats = snapshot
    ? getProductStats(
        snapshot,
        productId,
        extraSlugs.length > 0 ? { product, categorySlugs: extraSlugs } : undefined,
      )
    : [];

  return (
    <div className="space-y-10">
      <div>
        <Link href="/" className="text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100">
          ← Leaderboards
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <ToolIcon
            name={product.name}
            url={product.url}
            size={48}
            className="rounded-xl border-2 border-stone-900 bg-white p-1 dark:border-stone-600"
          />
          <h1 className="font-display text-3xl font-bold tracking-tight">{product.name}</h1>
          <span className="rounded-full border border-stone-300 bg-white px-2.5 py-0.5 font-mono text-sm dark:border-stone-700 dark:bg-stone-900">
            {product.price}
          </span>
          <TrackedLink
            kind="tool"
            id={productId}
            href={withUtm(product.url, "tool_page")}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border-2 border-stone-900 bg-white px-3 py-1 text-sm font-semibold shadow-[2px_2px_0_0_var(--ink)] transition-transform hover:-translate-y-0.5 dark:border-stone-600 dark:bg-stone-900"
          >
            Visit site ↗
          </TrackedLink>
        </div>
        <p className="mt-2 text-sm text-stone-500">
          Tracked in{" "}
          {stats.map((s, i) => (
            <span key={s.category.slug}>
              {i > 0 && " and "}
              <Link
                href={`/category/${s.category.slug}`}
                className="underline hover:text-stone-900 dark:hover:text-stone-100"
              >
                {s.category.name}
              </Link>
            </span>
          ))}
        </p>
      </div>

      {snapshot?.mock && (
        <div className="rounded-xl border-2 border-amber-400 bg-amber-100 px-4 py-3 text-sm font-medium text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          🚧 Generated sample data, not real model output yet.
        </div>
      )}

      {stats.length === 0 && (
        <p className="text-stone-500">First snapshot pending.</p>
      )}

      {stats.map((entry) => (
        <section key={entry.category.slug} className="space-y-6">
          {stats.length > 1 && (
            <h2 className="font-display text-xl font-bold">
              As a{" "}
              <Link
                href={`/category/${entry.category.slug}`}
                className="hover:text-emerald-600 dark:hover:text-emerald-400"
              >
                {entry.category.name.toLowerCase()}
              </Link>{" "}
              tool
            </h2>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="Visibility"
              value={String(entry.score.visibility)}
              detail="out of 100"
              tone={TILE_TONES[0]}
            />
            <StatTile
              label="Rank"
              value={`#${entry.rank}`}
              detail={`of ${entry.totalProducts} tracked`}
              tone={TILE_TONES[1]}
            />
            <StatTile
              label="Mention rate"
              value={`${Math.round(entry.score.mentionRate * 100)}%`}
              detail={`of ${entry.score.runs} runs`}
              tone={TILE_TONES[2]}
            />
            <StatTile
              label="Avg. position"
              value={entry.score.avgPosition !== null ? String(entry.score.avgPosition) : "n/a"}
              detail="when mentioned"
              tone={TILE_TONES[3]}
            />
          </div>

          <div>
            <h3 className="mb-3 font-display text-lg font-bold">
              The competition in {entry.category.name.toLowerCase()}
            </h3>
            <ol>
              {entry.board.map((score, i) => {
                const isSelf = score.productId === productId;
                return (
                  <li
                    key={score.productId}
                    className={`flex items-center gap-3 py-2.5 ${
                      isSelf
                        ? "-mx-3 my-1 rounded-xl border-2 border-emerald-400 bg-emerald-100/60 px-3 dark:border-emerald-700 dark:bg-emerald-950/50"
                        : "border-b border-stone-200/70 dark:border-stone-800/70"
                    }`}
                  >
                    <span className="w-7 shrink-0 text-center">
                      {i < 3 ? (
                        <span className="text-lg" aria-label={`Rank ${i + 1}`}>
                          {MEDALS[i]}
                        </span>
                      ) : (
                        <span className="font-mono text-sm text-stone-400">{i + 1}</span>
                      )}
                    </span>
                    <span className={`min-w-0 flex-1 truncate ${isSelf ? "font-semibold" : ""}`}>
                      {isSelf ? (
                        <>
                          {score.name}
                          <span className="ml-2 rounded-full bg-emerald-400/30 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
                            you
                          </span>
                        </>
                      ) : (
                        <Link
                          href={`/${score.productId}`}
                          className="hover:text-emerald-600 dark:hover:text-emerald-400"
                        >
                          {score.name}
                        </Link>
                      )}
                    </span>
                    <div className="hidden w-28 shrink-0 sm:block">
                      <Bar pct={score.visibility} />
                    </div>
                    <span className="w-10 shrink-0 text-right font-mono text-sm">
                      {score.visibility}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>

          <div>
            <h3 className="mb-3 font-display text-lg font-bold">Prompt by prompt</h3>
            <ul className="space-y-3">
              {entry.promptStats.map((stat) => {
                // Runs that kept their answer text (real snapshots from now
                // on; mock data and older runs have none).
                const answerRuns = (snapshot?.runs ?? []).filter(
                  (r) =>
                    r.categorySlug === entry.category.slug &&
                    r.templateId === stat.templateId &&
                    r.answer,
                );
                const row = (
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                    <span className="min-w-0 flex-1 truncate rounded-2xl rounded-bl-md border border-stone-300 bg-white px-3 py-2 font-mono text-sm text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300">
                      &ldquo;{stat.prompt}&rdquo;
                    </span>
                    <div className="flex shrink-0 items-center gap-3">
                      <div className="w-28">
                        <Bar pct={stat.runs ? (stat.mentioned / stat.runs) * 100 : 0} />
                      </div>
                      <span className="w-12 text-right font-mono text-sm font-semibold">
                        {stat.mentioned}/{stat.runs}
                      </span>
                      <span
                        className={`w-16 text-right text-xs ${
                          stat.avgPosition !== null ? "text-stone-500" : "text-rose-500"
                        }`}
                      >
                        {stat.avgPosition !== null ? (
                          `avg #${stat.avgPosition}`
                        ) : (
                          <>
                            <span
                              aria-hidden="true"
                              className="inline-block animate-[ghost-float_2s_ease-in-out_infinite] motion-reduce:animate-none"
                            >
                              👻
                            </span>{" "}
                            never
                          </>
                        )}
                      </span>
                      {answerRuns.length > 0 && (
                        <span
                          className="inline-flex shrink-0 items-center gap-1 rounded-full border-2 border-stone-300 bg-white px-2.5 py-0.5 font-mono text-xs font-semibold text-stone-600 transition-all group-hover:border-stone-900 group-hover:text-stone-900 group-open:border-emerald-500 group-open:bg-emerald-50 group-open:text-emerald-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400 dark:group-hover:border-stone-400 dark:group-hover:text-stone-100 dark:group-open:border-emerald-500 dark:group-open:bg-emerald-950 dark:group-open:text-emerald-300"
                          title="Read the model answers"
                        >
                          💬 {answerRuns.length} answers
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                            className="h-3 w-3 transition-transform duration-200 group-open:rotate-180"
                          >
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>
                );
                return (
                  <li key={stat.templateId}>
                    {answerRuns.length > 0 ? (
                      <details className="group">
                        <summary className="cursor-pointer list-none rounded-xl transition-colors hover:bg-stone-50 [&::-webkit-details-marker]:hidden dark:hover:bg-stone-900">
                          {row}
                        </summary>
                        <AnswersPanel runs={answerRuns} product={product} />
                      </details>
                    ) : (
                      row
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 font-display text-lg font-bold">By model</h3>
            <ul className="space-y-2">
              {entry.modelStats.map((stat) => (
                <li key={stat.model} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-sm text-stone-600 dark:text-stone-400">
                    {MODEL_LABELS[stat.model]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Bar pct={stat.visibility} />
                  </div>
                  <span className="w-10 shrink-0 text-right font-mono text-sm">
                    {stat.visibility}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}

      <Faq name={product.name} />

      <p className="text-sm text-stone-500">
        Scores come from the {snapshot?.id} snapshot.{" "}
        <Link href="/methodology" className="underline hover:text-stone-900 dark:hover:text-stone-100">
          How they are computed
        </Link>
        .
      </p>
    </div>
  );
}
