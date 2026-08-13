import type { Metadata } from "next";
import { SubmitTool } from "@/components/SubmitTool";

export const metadata: Metadata = {
  title: "Submit your tool",
  description:
    "Get your product on the AI visibility leaderboards: open a pull request or submit it right here for review.",
};

const JOURNEY = [
  { emoji: "📝", title: "Submit", text: "Two minutes, either path. Free forever." },
  { emoji: "👀", title: "Human review", text: "Mostly to keep the alias table honest." },
  { emoji: "🤖", title: "The models get asked", text: "Same six questions as everyone else." },
  { emoji: "🏆", title: "Picked, or 👻", text: "The leaderboard doesn't care about feelings." },
];

export default function SubmissionPage() {
  return (
    <div className="space-y-12">
      <section className="relative space-y-4 pt-2 text-center">
        <span
          aria-hidden="true"
          className="absolute left-[9%] top-0 hidden -rotate-12 text-3xl text-emerald-500 md:block"
        >
          ✦
        </span>
        <span
          aria-hidden="true"
          className="absolute right-[11%] top-12 hidden rotate-12 text-xl text-amber-400 md:block"
        >
          ✧
        </span>
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          Get in the{" "}
          <span className="relative inline-block whitespace-nowrap">
            <span className="relative z-10">machine</span>
            <span
              aria-hidden="true"
              className="absolute -inset-x-1 bottom-1 h-[0.45em] -rotate-2 rounded-sm bg-emerald-300/90 dark:bg-emerald-500/40"
            />
          </span>{" "}
          <span aria-hidden="true">🕹️</span>
        </h1>
        <p className="mx-auto max-w-2xl text-stone-600 dark:text-stone-400">
          Every tool faces the same questions, so being listed costs nothing and answers the only
          question that matters now: does AI recommend you? A human reviews every submission
          before it goes live, mostly to keep the alias table honest.
        </p>
      </section>

      <SubmitTool />

      <section>
        <h2 className="mb-4 text-center font-display text-2xl font-bold">What happens next</h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {JOURNEY.map((step, i) => (
            <li
              key={step.title}
              className="rounded-2xl border-2 border-stone-900 bg-white p-4 shadow-[4px_4px_0_0_var(--ink)] transition-transform hover:-translate-y-1 dark:border-stone-600 dark:bg-stone-900"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-2xl" aria-hidden="true">
                  {step.emoji}
                </span>
                <span className="font-mono text-xs text-stone-400">{i + 1}/4</span>
              </div>
              <h3 className="font-display font-bold">{step.title}</h3>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
