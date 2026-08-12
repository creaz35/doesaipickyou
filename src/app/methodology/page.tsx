import type { Metadata } from "next";
import { CATEGORIES } from "@/data/categories";
import { TEMPLATES } from "@/data/templates";
import { FLOOR_WEIGHT, POSITION_WEIGHTS } from "@/lib/scoring";
import { getSiteData } from "@/lib/site-data";
import { MODEL_LABELS } from "@/lib/types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Methodology",
  description: "Every prompt we ask, how mentions are counted, and how the visibility score is computed.",
};

export default async function MethodologyPage() {
  const data = await getSiteData();

  return (
    <div className="prose-sm mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Methodology</h1>
        <p className="mt-2 text-stone-600 dark:text-stone-400">
          Everything here is published on purpose. If you think a number is wrong, the prompts, the
          alias tables and the raw counts are all open. Check them, then open an issue.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold">What we run</h2>
        <p className="text-stone-600 dark:text-stone-400">
          Six prompt templates, applied identically to all {CATEGORIES.length} categories so scores
          are comparable. <code className="font-mono text-sm">{"{cat}"}</code> is the category noun,{" "}
          <code className="font-mono text-sm">{"{leader}"}</code> is the best-known incumbent in the
          category.
        </p>
        <ul className="list-disc space-y-1 pl-5 text-stone-700 dark:text-stone-300">
          {TEMPLATES.map((t) => (
            <li key={t.id}>
              <code className="font-mono text-sm">{t.text}</code>
            </li>
          ))}
        </ul>
        <p className="text-stone-600 dark:text-stone-400">
          Each prompt runs {data.runsPerPrompt} times against each model (
          {(data.models.length > 0 ? data.models : (["openai", "anthropic"] as const))
            .map((m) => MODEL_LABELS[m] ?? m)
            .join(", ")}) to
          smooth out nondeterminism. Snapshots are taken monthly and never overwritten; the history
          is the point.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold">How mentions are counted</h2>
        <p className="text-stone-600 dark:text-stone-400">
          Answers are parsed against a hand-curated alias table per category: exact word-boundary
          matches only, no fuzzy matching. Product names that are also common English words
          (&ldquo;Later&rdquo;, &ldquo;Linear&rdquo;, &ldquo;Wave&rdquo;) are matched
          case-sensitively. If a product is missing an alias, its score is understated: that is a
          bug in the table, and a one-line pull request fixes it.
        </p>
        <p className="text-stone-600 dark:text-stone-400">
          One exception: on the two prompts that name the category leader (&ldquo;alternatives to
          Buffer&rdquo;), the leader itself is not counted, because answers echo the
          question&rsquo;s subject back and an echo is not a recommendation. Those runs also leave
          the leader&rsquo;s denominator, so leaders are scored over their four eligible prompts
          and everyone else over all six, and both can reach 100.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold">The visibility score</h2>
        <p className="text-stone-600 dark:text-stone-400">
          A mention is weighted by where it appears in the answer, then averaged over all runs:
        </p>
        <div className="overflow-x-auto">
          <table className="w-auto text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-stone-500 dark:border-stone-800">
                <th className="py-2 pr-6 font-medium">Position in answer</th>
                <th className="py-2 font-medium">Weight</th>
              </tr>
            </thead>
            <tbody>
              {POSITION_WEIGHTS.map((w, i) => (
                <tr key={i} className="border-b border-stone-100 dark:border-stone-900">
                  <td className="py-2 pr-6">{i + 1}</td>
                  <td className="py-2 font-mono">{w}</td>
                </tr>
              ))}
              <tr>
                <td className="py-2 pr-6">{POSITION_WEIGHTS.length + 1}+</td>
                <td className="py-2 font-mono">{FLOOR_WEIGHT}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-stone-600 dark:text-stone-400">
          <code className="font-mono text-sm">
            visibility = 100 × Σ weight(position) / total runs
          </code>
          <br />
          100 means named first in every run. 0 means the model never says your name.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold">Honest caveats</h2>
        <ul className="list-disc space-y-2 pl-5 text-stone-700 dark:text-stone-300">
          <li>
            We query model APIs, not the consumer chat apps. Consumer apps add web search and
            personalization, so what your customer sees can differ from what we measure.
          </li>
          <li>
            Model answers are nondeterministic. Multiple runs narrow the error bars; they do not
            eliminate them. Treat small score gaps as ties.
          </li>
          <li>
            Category product lists are curated, not exhaustive. If a product belongs in a category
            and isn&apos;t tracked, open an issue.
          </li>
          <li>
            Vendors will try to optimize for this. Good: the prompt set is public, so gaming it is
            visible in the diff.
          </li>
        </ul>
      </section>
    </div>
  );
}
