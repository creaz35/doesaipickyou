import { CATEGORIES } from "@/data/categories";
import { fetchRestCollection, fetchRestDoc, isFirestoreRestConfigured } from "@/lib/firebase/rest";
import { scoreCategory } from "@/lib/scoring";
import { loadLatestSnapshot } from "@/lib/snapshots";
import type { AliasDef, ModelId, ProductDef, ProductScore, PromptRun } from "@/lib/types";

/**
 * The one data source public pages render from.
 *
 * "live" comes from Firestore (written by the /admin snapshot runner) via
 * unauthenticated REST reads. When Firestore has no snapshot yet, or the
 * read fails (no env, no network, rules not deployed), pages fall back to
 * the committed snapshot in data/snapshots/ so the site always builds.
 */
export interface SiteCategory {
  slug: string;
  emoji: string;
  name: string;
  noun: string;
  leader: string;
  scores: ProductScore[];
}

export interface SiteData {
  source: "live" | "mock" | "none";
  snapshotId: string | null;
  models: ModelId[];
  runsPerPrompt: number;
  totalRuns: number;
  categories: SiteCategory[];
}

export async function getSiteData(): Promise<SiteData> {
  const live = await getLiveData();
  if (live) return live;

  const snapshot = loadLatestSnapshot();
  return {
    source: snapshot ? (snapshot.mock ? "mock" : "live") : "none",
    snapshotId: snapshot?.id ?? null,
    models: snapshot?.models ?? [],
    runsPerPrompt: snapshot?.runsPerPrompt ?? 3,
    totalRuns: snapshot?.runs.length ?? 0,
    categories: CATEGORIES.map((c) => ({
      slug: c.slug,
      emoji: c.emoji,
      name: c.name,
      noun: c.noun,
      leader: c.leader,
      scores: snapshot ? scoreCategory(snapshot, c) : [],
    })),
  };
}

async function getLiveData(): Promise<SiteData | null> {
  if (!isFirestoreRestConfigured()) return null;
  try {
    const snapshots = await fetchRestCollection("snapshots");
    const real = snapshots.filter((s) => typeof s.id === "string" && s.mock !== true);
    if (real.length === 0) return null;
    const latest = real.sort((a, b) => String(a.id).localeCompare(String(b.id))).at(-1)!;

    const categoryDocs = await fetchRestCollection("categories");
    if (categoryDocs.length === 0) return null;
    const bySlug = new Map(categoryDocs.map((d) => [String(d.slug), d]));

    // Keep the hand-curated ordering from code; append any categories that
    // exist only in Firestore at the end.
    const categories: SiteCategory[] = [];
    for (const c of CATEGORIES) {
      const docData = bySlug.get(c.slug);
      bySlug.delete(c.slug);
      categories.push({
        slug: c.slug,
        emoji: String(docData?.emoji ?? c.emoji),
        name: String(docData?.name ?? c.name),
        noun: String(docData?.noun ?? c.noun),
        leader: String(docData?.leader ?? c.leader),
        scores: (docData?.scores as ProductScore[] | undefined) ?? [],
      });
    }
    for (const docData of bySlug.values()) {
      if (!docData.slug || !docData.name) continue;
      categories.push({
        slug: String(docData.slug),
        emoji: String(docData.emoji ?? ""),
        name: String(docData.name),
        noun: String(docData.noun ?? docData.name),
        leader: String(docData.leader ?? ""),
        scores: (docData.scores as ProductScore[] | undefined) ?? [],
      });
    }

    return {
      source: "live",
      snapshotId: String(latest.id),
      models: (latest.models as ModelId[] | undefined) ?? [],
      runsPerPrompt: Number(latest.runsPerPrompt ?? 3),
      totalRuns: categories.reduce((n, c) => n + (c.scores[0]?.runs ?? 0), 0),
      categories,
    };
  } catch {
    return null;
  }
}

/**
 * A tool that exists only in Firestore (added via /admin, not yet in
 * src/data/categories.ts). Lets its product page render without a code
 * change and deploy. Null when unknown there too.
 */
export async function getLiveTool(
  toolId: string,
): Promise<{ product: ProductDef; categorySlugs: string[] } | null> {
  if (!isFirestoreRestConfigured()) return null;
  try {
    const docData = await fetchRestDoc(`tools/${toolId}`);
    if (!docData?.id || !docData.name || !docData.url) return null;
    return {
      product: {
        id: String(docData.id),
        name: String(docData.name),
        url: String(docData.url),
        price: String(docData.price ?? ""),
        aliases: (docData.aliases as AliasDef[] | undefined) ?? [],
      },
      categorySlugs: (docData.categorySlugs as string[] | undefined) ?? [],
    };
  } catch {
    return null;
  }
}

/**
 * Raw runs for one category in the live snapshot (for the prompt-by-prompt
 * breakdown on product pages). Null when that category hasn't been run.
 */
export async function getLiveCategoryRuns(
  snapshotId: string,
  categorySlug: string,
): Promise<PromptRun[] | null> {
  try {
    const doc = await fetchRestDoc(`snapshots/${snapshotId}/categories/${categorySlug}`);
    const runs = doc?.runs as PromptRun[] | undefined;
    return runs && runs.length > 0 ? runs : null;
  } catch {
    return null;
  }
}
