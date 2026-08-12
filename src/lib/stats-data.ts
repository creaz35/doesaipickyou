import { fetchRestCollection, isFirestoreRestConfigured } from "@/lib/firebase/rest";

/**
 * Server-side aggregation for the public /stats page. Reads the daily
 * rollup docs (stats/day-*) that visitors' browsers increment and sums
 * them; there is no all-time counter doc to drift out of sync.
 */

export interface DayStat {
  date: string;
  views: number;
  visitors: number;
  newVisitors: number;
  toolClicks: number;
  sponsorClicks: number;
}

export interface SiteStats {
  /** True when at least one day has been recorded. */
  hasData: boolean;
  since: string | null;
  daysOnAir: number;
  viewsToday: number;
  peakDayViews: number;
  peakDayDate: string | null;
  visitors7d: number;
  clicks7d: number;
  /** Page views over the last 30 days, the /sponsor pitch number. */
  views30d: number;
  totalViews: number;
  totalVisitors: number;
  totalClicks: number;
}

const EMPTY: SiteStats = {
  hasData: false,
  since: null,
  daysOnAir: 0,
  viewsToday: 0,
  peakDayViews: 0,
  peakDayDate: null,
  visitors7d: 0,
  clicks7d: 0,
  views30d: 0,
  totalViews: 0,
  totalVisitors: 0,
  totalClicks: 0,
};

export async function getSiteStats(): Promise<SiteStats> {
  if (!isFirestoreRestConfigured()) return EMPTY;

  let days: DayStat[];
  try {
    const docs = await fetchRestCollection("stats");
    days = docs
      .filter((d) => typeof d.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d.date))
      .map((d) => ({
        date: String(d.date),
        views: Number(d.views ?? 0),
        visitors: Number(d.visitors ?? 0),
        newVisitors: Number(d.newVisitors ?? 0),
        toolClicks: Number(d.toolClicks ?? 0),
        sponsorClicks: Number(d.sponsorClicks ?? 0),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return EMPTY;
  }
  if (days.length === 0) return EMPTY;

  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const last7 = days.filter((d) => d.date >= weekAgo);
  const last30 = days.filter((d) => d.date >= monthAgo);
  const peak = days.reduce((best, d) => (d.views > best.views ? d : best), days[0]);
  const since = days[0].date;

  return {
    hasData: true,
    since,
    // Calendar days since launch, not just days with traffic.
    daysOnAir:
      Math.floor((Date.parse(today) - Date.parse(since)) / (24 * 60 * 60 * 1000)) + 1,
    viewsToday: days.find((d) => d.date === today)?.views ?? 0,
    peakDayViews: peak.views,
    peakDayDate: peak.date,
    visitors7d: last7.reduce((n, d) => n + d.visitors, 0),
    clicks7d: last7.reduce((n, d) => n + d.toolClicks + d.sponsorClicks, 0),
    views30d: last30.reduce((n, d) => n + d.views, 0),
    totalViews: days.reduce((n, d) => n + d.views, 0),
    totalVisitors: days.reduce((n, d) => n + d.newVisitors, 0),
    totalClicks: days.reduce((n, d) => n + d.toolClicks + d.sponsorClicks, 0),
  };
}
