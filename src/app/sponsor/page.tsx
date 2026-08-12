import type { Metadata } from "next";
import { Newsletter } from "@/components/Newsletter";
import { SponsorCheckout } from "@/components/SponsorCheckout";
import { CATEGORIES } from "@/data/categories";
import { getSiteData } from "@/lib/site-data";
import { getSponsorPriceUsd, getSponsors } from "@/lib/sponsor-data";
import { getSiteStats } from "@/lib/stats-data";

// Short window: taken spots and the price should feel current. The
// checkout API re-verifies both anyway, so staleness can't oversell.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Sponsor",
  description:
    "Put your product in front of the indie hackers checking whether AI recommends them. Pick a spot, pay with Stripe, go live.",
};

const STEPS = [
  {
    emoji: "🎯",
    title: "Pick a spot",
    text: "Two rails, twelve slots, shown beside every page of the site. First come picks the best position.",
  },
  {
    emoji: "💳",
    title: "Pay once",
    text: "Stripe checkout, one-time payment, no subscription. The price is whatever it says today; sold spots keep their price.",
  },
  {
    emoji: "👀",
    title: "Quick review",
    text: "A human looks at the card, then it goes live, usually the same day. Your 30 days start at go-live, not at payment.",
  },
  {
    emoji: "📈",
    title: "30 days of clicks",
    text: "Favicon, name and pitch, linked to your site. Clicks arrive tagged utm_source=doesaipickyou, so you can verify them in your own analytics.",
  },
];

export default async function SponsorPage() {
  const [sponsors, priceUsd, stats, site] = await Promise.all([
    getSponsors(),
    getSponsorPriceUsd(),
    getSiteStats(),
    getSiteData(),
  ]);
  const totalTools = CATEGORIES.reduce((n, c) => n + c.products.length, 0);

  // Lead with traffic once there is real traffic to brag about; until
  // then the dataset is the more impressive honest number.
  const headline =
    stats.views30d >= 1000
      ? { value: `${stats.views30d.toLocaleString()}+`, label: "views in the last 30 days" }
      : { value: site.totalRuns.toLocaleString(), label: "AI answers parsed monthly" };

  const heroStats = [
    { ...headline, accent: false },
    { value: totalTools.toLocaleString(), label: "tools fighting for rank", accent: false },
    { value: "founders", label: "checking if AI picks them", accent: false },
    { value: `${sponsors.length}/12`, label: "spots taken right now", accent: true },
  ];

  return (
    <div className="space-y-10">
      <section className="space-y-4 pt-2 text-center">
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          Sponsor the leaderboards
        </h1>
        <p className="mx-auto max-w-2xl text-stone-600 dark:text-stone-400">
          Two rails, twelve spots, visible on every page of the site. The audience is founders
          checking whether AI recommends their product, which is a fairly good audience to be
          seen by.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-x-4 gap-y-8 py-2 text-center lg:grid-cols-4">
        {heroStats.map((stat) => (
          <div key={stat.label}>
            <p
              className={`font-display text-4xl font-extrabold tracking-tight sm:text-5xl ${
                stat.accent ? "text-emerald-600 dark:text-emerald-400" : ""
              }`}
            >
              {stat.value}
            </p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-stone-500">
              {stat.label}
            </p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-4 font-display text-2xl font-bold">How it works</h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="rounded-2xl border-2 border-stone-900 bg-white p-4 shadow-[4px_4px_0_0_var(--ink)] dark:border-stone-600 dark:bg-stone-900"
            >
              <div className="mb-2 flex items-center gap-2">
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

      <SponsorCheckout sponsors={sponsors} priceUsd={priceUsd} />

      <Newsletter
        title="All spots taken?"
        text="Leave your email and we will tell you the moment a slot frees up, plus who moved on the leaderboards each month."
      />
    </div>
  );
}
