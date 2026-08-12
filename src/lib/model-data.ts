import { CATEGORIES } from "@/data/categories";
import { fetchRestCollection, isFirestoreRestConfigured } from "@/lib/firebase/rest";
import { scoreCategory } from "@/lib/scoring";
import { loadLatestSnapshot } from "@/lib/snapshots";
import type { ModelId, ProductScore, PromptRun, Snapshot } from "@/lib/types";

/**
 * Data for the /models page: the same snapshot, sliced per model instead of
 * aggregated. Needs the raw runs (each run records which model answered),
 * so live mode reads the snapshot's category docs rather than the
 * pre-aggregated `categories/{slug}.scores`.
 *
 * Categories are always the ones defined in code: the catalog is synced
 * from code to Firestore, never authored in Firestore.
 */

const MODEL_ORDER: ModelId[] = ["openai", "anthropic", "gemini", "perplexity"];

export interface ModelPick {
  productId: string;
  name: string;
  url: string;
  visibility: number;
}

export interface FaceOffRow {
  slug: string;
  emoji: string;
  name: string;
  /** True when every model that ran this category named the same #1. */
  unanimous: boolean;
  picks: Partial<Record<ModelId, ModelPick | null>>;
}

export interface ModelBoardEntry {
  score: ProductScore;
  category: { slug: string; emoji: string; name: string };
}

export interface ModelBoard {
  model: ModelId;
  /** Total answers from this model across all categories in the snapshot. */
  totalRuns: number;
  top: ModelBoardEntry[];
}

export interface ByModelData {
  source: "live" | "mock" | "none";
  snapshotId: string | null;
  models: ModelId[];
  boards: ModelBoard[];
  faceOff: FaceOffRow[];
}

export async function getByModelData(): Promise<ByModelData> {
  const live = await loadLiveSnapshot();
  const snapshot = live ?? loadLatestSnapshot();
  if (!snapshot || snapshot.runs.length === 0) {
    return { source: "none", snapshotId: null, models: [], boards: [], faceOff: [] };
  }

  const seen = new Set(snapshot.runs.map((r) => r.model));
  const models = MODEL_ORDER.filter((m) => seen.has(m));

  // Score every (category, model) pair once; boards and the face-off table
  // are both views over this matrix.
  const matrix = new Map<string, Map<ModelId, ProductScore[]>>();
  for (const category of CATEGORIES) {
    const byModel = new Map<ModelId, ProductScore[]>();
    for (const model of models) {
      const scores = scoreCategory(snapshot, category, model);
      // runs === 0 means this model never ran this category; skip it so
      // empty categories don't show up as rows of zeros.
      if (scores[0]?.runs) byModel.set(model, scores);
    }
    if (byModel.size > 0) matrix.set(category.slug, byModel);
  }

  const boards: ModelBoard[] = models.map((model) => {
    const entries: ModelBoardEntry[] = [];
    let totalRuns = 0;
    for (const category of CATEGORIES) {
      const scores = matrix.get(category.slug)?.get(model);
      if (!scores) continue;
      totalRuns += scores[0].runs;
      for (const score of scores) {
        entries.push({
          score,
          category: { slug: category.slug, emoji: category.emoji, name: category.name },
        });
      }
    }
    entries.sort(
      (a, b) => b.score.visibility - a.score.visibility || a.score.name.localeCompare(b.score.name),
    );
    return { model, totalRuns, top: entries.slice(0, 10) };
  });

  const faceOff: FaceOffRow[] = [];
  for (const category of CATEGORIES) {
    const byModel = matrix.get(category.slug);
    if (!byModel) continue;
    const picks: FaceOffRow["picks"] = {};
    for (const model of models) {
      const top = byModel.get(model)?.[0];
      picks[model] =
        top && top.visibility > 0
          ? { productId: top.productId, name: top.name, url: top.url, visibility: top.visibility }
          : null;
    }
    const named = models.map((m) => picks[m]?.productId).filter(Boolean);
    faceOff.push({
      slug: category.slug,
      emoji: category.emoji,
      name: category.name,
      unanimous: named.length >= 2 && new Set(named).size === 1,
      picks,
    });
  }

  return {
    source: live ? "live" : snapshot.mock ? "mock" : "live",
    snapshotId: snapshot.id,
    models,
    boards,
    faceOff,
  };
}

/**
 * Rebuilds a Snapshot from the raw runs the admin runner stored under
 * snapshots/{id}/categories/{slug}. Null when Firestore isn't configured,
 * unreachable, or has no real snapshot yet, so callers fall back to the
 * committed snapshot file.
 */
async function loadLiveSnapshot(): Promise<Snapshot | null> {
  if (!isFirestoreRestConfigured()) return null;
  try {
    const snapshots = await fetchRestCollection("snapshots");
    const real = snapshots.filter((s) => typeof s.id === "string" && s.mock !== true);
    if (real.length === 0) return null;
    const latest = real.sort((a, b) => String(a.id).localeCompare(String(b.id))).at(-1)!;

    const categoryDocs = await fetchRestCollection(`snapshots/${latest.id}/categories`);
    const runs: PromptRun[] = [];
    for (const doc of categoryDocs) {
      const docRuns = doc.runs as PromptRun[] | undefined;
      if (docRuns) runs.push(...docRuns);
    }
    if (runs.length === 0) return null;

    return {
      id: String(latest.id),
      createdAt: String(latest.createdAt ?? ""),
      models: (latest.models as ModelId[] | undefined) ?? [],
      runsPerPrompt: Number(latest.runsPerPrompt ?? 3),
      runs,
    };
  } catch {
    return null;
  }
}
