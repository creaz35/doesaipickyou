import type { Metadata } from "next";
import Link from "next/link";
import { ToolIcon } from "@/components/ToolIcon";
import { getByModelData, type ModelBoard } from "@/lib/model-data";
import { MODEL_LABELS, type ModelId } from "@/lib/types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "By model",
  description:
    "The same buyer questions, answered by ChatGPT, Claude, Gemini and Perplexity. See where the models agree on the best tool, and where they don't.",
};

// Full literal class strings so Tailwind's scanner picks them up.
const TONES: Record<ModelId, { card: string; dot: string; chip: string }> = {
  openai: {
    card: "border-emerald-300 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/40",
    dot: "bg-emerald-500",
    chip: "border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  },
  anthropic: {
    card: "border-amber-300 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/40",
    dot: "bg-amber-500",
    chip: "border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
  },
  gemini: {
    card: "border-sky-300 bg-sky-50/60 dark:border-sky-900 dark:bg-sky-950/40",
    dot: "bg-sky-500",
    chip: "border-sky-300 bg-sky-100 text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200",
  },
  perplexity: {
    card: "border-violet-300 bg-violet-50/60 dark:border-violet-900 dark:bg-violet-950/40",
    dot: "bg-violet-500",
    chip: "border-violet-300 bg-violet-100 text-violet-900 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-200",
  },
};

const MEDALS = ["🥇", "🥈", "🥉"];

function ModelChip({ model }: { model: ModelId }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 font-mono text-sm font-medium ${TONES[model].chip}`}
    >
      <span className={`h-2 w-2 rounded-full ${TONES[model].dot}`} aria-hidden="true" />
      {MODEL_LABELS[model]}
    </span>
  );
}

function BoardCard({ board }: { board: ModelBoard }) {
  return (
    <section
      className={`rounded-2xl border-2 p-5 shadow-[5px_5px_0_0_var(--ink)] ${TONES[board.model].card}`}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <h3 className="font-display text-xl font-bold">{MODEL_LABELS[board.model]}</h3>
        <ModelChip model={board.model} />
      </div>
      <p className="mb-4 text-xs text-stone-500">
        Top 10 of everything it was asked · {board.totalRuns.toLocaleString()} answers
      </p>
      <ol className="space-y-1">
        {board.top.map((entry, i) => (
          <li
            key={`${entry.category.slug}-${entry.score.productId}`}
            className="flex items-center gap-2.5 rounded-lg px-1 py-1.5 transition-colors hover:bg-white/70 dark:hover:bg-stone-900/60"
          >
            <span className="w-6 shrink-0 text-center text-sm" aria-hidden="true">
              {MEDALS[i] ?? <span className="font-mono text-stone-400">{i + 1}</span>}
            </span>
            <ToolIcon name={entry.score.name} url={entry.score.url} size={24} />
            <Link
              href={`/${entry.score.productId}`}
              className="min-w-0 flex-1 truncate text-sm font-medium hover:text-emerald-700 dark:hover:text-emerald-400"
            >
              {entry.score.name}
            </Link>
            <Link
              href={`/category/${entry.category.slug}`}
              title={entry.category.name}
              className="shrink-0 text-sm opacity-70 transition-opacity hover:opacity-100"
            >
              {entry.category.emoji}
            </Link>
            <span className="w-11 shrink-0 text-right font-mono text-sm font-semibold">
              {entry.score.visibility}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default async function ModelsPage() {
  const data = await getByModelData();
  const split = data.faceOff.filter((row) => !row.unanimous);

  return (
    <div className="space-y-10">
      <section className="space-y-4 pt-2 text-center">
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          Same question, different answer
        </h1>
        <p className="mx-auto max-w-2xl text-stone-600 dark:text-stone-400">
          Every leaderboard on this site averages the models together. This page pulls them apart:
          the exact same buyer questions, one column per model, so you can see who{" "}
          <em>your</em> buyers&apos; favorite AI actually recommends.
        </p>
        {data.models.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {data.models.map((m) => (
              <ModelChip key={m} model={m} />
            ))}
          </div>
        )}
      </section>

      {data.source === "mock" && (
        <div className="rounded-xl border-2 border-amber-400 bg-amber-100 px-4 py-3 text-sm font-medium text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          🚧 Generated sample data, not real model output yet.
        </div>
      )}

      {data.source === "none" ? (
        <p className="py-16 text-center text-stone-500">First snapshot pending.</p>
      ) : (
        <>
          <section>
            <div className="mb-3">
              <h2 className="font-display text-2xl font-bold">The face-off</h2>
              <p className="text-sm text-stone-500">
                Each model&apos;s #1 pick per category.{" "}
                {data.models.length > 1 && (
                  <>
                    They disagree in {split.length} of {data.faceOff.length} categories.
                  </>
                )}
              </p>
            </div>
            <div className="overflow-x-auto rounded-2xl border-2 border-stone-900 shadow-[5px_5px_0_0_var(--ink)] dark:border-stone-600">
              <table className="w-full min-w-[640px] border-collapse bg-white text-sm dark:bg-stone-950">
                <thead>
                  <tr className="border-b-2 border-stone-900 text-left dark:border-stone-600">
                    <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-stone-500">
                      Category
                    </th>
                    {data.models.map((m) => (
                      <th key={m} className="px-4 py-3">
                        <ModelChip model={m} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.faceOff.map((row) => (
                    <tr
                      key={row.slug}
                      className="border-b border-stone-200/70 last:border-b-0 hover:bg-stone-50 dark:border-stone-800/70 dark:hover:bg-stone-900"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/category/${row.slug}`}
                            className="font-medium hover:text-emerald-700 hover:underline dark:hover:text-emerald-400"
                          >
                            {row.emoji} {row.name}
                          </Link>
                          {data.models.length > 1 && (
                            <span
                              className="cursor-default text-sm"
                              title={row.unanimous ? "All models agree" : "The models disagree"}
                            >
                              {row.unanimous ? "🤝" : "⚔️"}
                            </span>
                          )}
                        </div>
                      </td>
                      {data.models.map((m) => {
                        const pick = row.picks[m];
                        return (
                          <td key={m} className="px-4 py-3">
                            {pick ? (
                              <div className="flex items-center gap-2">
                                <ToolIcon name={pick.name} url={pick.url} size={20} />
                                <Link
                                  href={`/${pick.productId}`}
                                  className="truncate font-medium hover:text-emerald-700 hover:underline dark:hover:text-emerald-400"
                                >
                                  {pick.name}
                                </Link>
                                <span className="font-mono text-xs text-stone-400">
                                  {pick.visibility}
                                </span>
                              </div>
                            ) : (
                              <span className="text-stone-400" title="No pick from this model">
                                👻
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <div className="mb-4">
              <h2 className="font-display text-2xl font-bold">Each model&apos;s top 10</h2>
              <p className="text-sm text-stone-500">
                All categories mixed together, ranked by how loudly each model recommends the tool.
              </p>
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              {data.boards.map((board) => (
                <BoardCard key={board.model} board={board} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
