import type { Metadata } from "next";
import { getSiteData } from "@/lib/site-data";
import { getSiteStats } from "@/lib/stats-data";

// The page brags "refreshed every minute", so keep it honest.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Stats",
  description:
    "Public traffic stats for doesaipickyou.com: page views, visitors, and outbound clicks. Open data for an open project.",
};

function formatDay(date: string | null): string {
  if (!date) return "n/a";
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function StatCard({
  label,
  value,
  detail,
  accent = false,
}: {
  label: string;
  value: string;
  detail: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border-2 border-stone-900 bg-white p-5 shadow-[4px_4px_0_0_var(--ink)] dark:border-stone-600 dark:bg-stone-900">
      <p className="font-mono text-[10px] uppercase tracking-widest text-stone-500">{label}</p>
      <p
        className={`mt-2 font-display text-4xl font-extrabold tracking-tight ${
          accent ? "text-emerald-600 dark:text-emerald-400" : ""
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-stone-500">{detail}</p>
    </div>
  );
}

export default async function StatsPage() {
  const [stats, site] = await Promise.all([getSiteStats(), getSiteData()]);
  const totalTools = site.categories.reduce((n, c) => n + c.scores.length, 0);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">Site stats</h1>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            Public, because why not. Counted in the open like everything else here.
          </p>
        </div>
        <p className="font-mono text-xs text-stone-500">refreshed every minute</p>
      </div>

      {!stats.hasData && (
        <div className="rounded-xl border-2 border-amber-400 bg-amber-100 px-4 py-3 text-sm font-medium text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          🚧 No traffic recorded yet. Counting starts as soon as the first visitor lands.
        </div>
      )}

      <section>
        <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-stone-500">
          Right now
        </p>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Peak day"
            value={stats.peakDayViews.toLocaleString()}
            detail={
              stats.peakDayDate
                ? `most views in one day, ${formatDay(stats.peakDayDate)}`
                : "most views in one day"
            }
            accent
          />
          <StatCard
            label="Views today"
            value={stats.viewsToday.toLocaleString()}
            detail="since midnight UTC"
          />
          <StatCard
            label="Visitors · 7d"
            value={stats.visitors7d.toLocaleString()}
            detail="unique people"
          />
          <StatCard
            label="Clicks out · 7d"
            value={stats.clicks7d.toLocaleString()}
            detail="tools + sponsors visited"
          />
        </div>
      </section>

      <section>
        <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-stone-500">
          All-time · counting since {formatDay(stats.since)}
        </p>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Page views"
            value={stats.totalViews.toLocaleString()}
            detail="all time"
            accent
          />
          <StatCard
            label="Visitors"
            value={stats.totalVisitors.toLocaleString()}
            detail="unique people, all time"
          />
          <StatCard
            label="Clicks out"
            value={stats.totalClicks.toLocaleString()}
            detail="visits sent to tools and sponsors"
          />
          <StatCard
            label="Days on air"
            value={stats.daysOnAir.toLocaleString()}
            detail="and counting"
          />
        </div>
      </section>

      <section>
        <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-stone-500">
          The dataset
        </p>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Categories"
            value={site.categories.length.toLocaleString()}
            detail="tracked every month"
          />
          <StatCard label="Tools" value={totalTools.toLocaleString()} detail="on the leaderboards" />
          <StatCard
            label="Answers"
            value={site.totalRuns.toLocaleString()}
            detail={`in the ${site.snapshotId ?? "current"} snapshot`}
            accent
          />
          <StatCard
            label="Models asked"
            value={site.models.length.toLocaleString()}
            detail="ChatGPT, Claude & friends"
          />
        </div>
      </section>
    </div>
  );
}
