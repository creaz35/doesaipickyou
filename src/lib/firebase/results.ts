import { doc, serverTimestamp, writeBatch, type Firestore } from "firebase/firestore";
import {
  CATEGORIES_COLLECTION,
  TOOLS_COLLECTION,
  type ToolCategoryScore,
} from "@/lib/firebase/catalog";
import type { ModelId, ProductScore, PromptRun } from "@/lib/types";

export const SNAPSHOTS_COLLECTION = "snapshots";

/** What /api/run-category returns for one category. */
export interface CategoryRunResult {
  categorySlug: string;
  runs: PromptRun[];
  scores: ProductScore[];
  models: ModelId[];
  runsPerPrompt: number;
  failed: number;
}

/**
 * Persists one category's live run, written from the admin's browser with
 * their own credentials (rules: admin-only). Three destinations:
 *
 * - snapshots/{YYYY-MM}/categories/{slug}: the raw history, never trimmed.
 *   Re-running a category in the same month overwrites that month's entry.
 * - categories/{slug}.scores: the live leaderboard the site can read.
 * - tools/{id}.scores.{slug}: per-tool denormalized rank and visibility.
 */
export async function saveCategoryRunResult(
  db: Firestore,
  snapshotId: string,
  result: CategoryRunResult,
): Promise<void> {
  const batch = writeBatch(db);

  batch.set(
    doc(db, SNAPSHOTS_COLLECTION, snapshotId),
    {
      id: snapshotId,
      models: result.models,
      runsPerPrompt: result.runsPerPrompt,
      mock: false,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  batch.set(doc(db, SNAPSHOTS_COLLECTION, snapshotId, "categories", result.categorySlug), {
    categorySlug: result.categorySlug,
    runs: result.runs,
    scores: result.scores,
    models: result.models,
    runsPerPrompt: result.runsPerPrompt,
    failed: result.failed,
    completedAt: serverTimestamp(),
  });

  batch.set(
    doc(db, CATEGORIES_COLLECTION, result.categorySlug),
    { scores: result.scores, lastRunAt: serverTimestamp() },
    { merge: true },
  );

  result.scores.forEach((score, index) => {
    const entry: ToolCategoryScore = {
      rank: index + 1,
      visibility: score.visibility,
      mentionRate: score.mentionRate,
      avgPosition: score.avgPosition,
      runs: score.runs,
    };
    batch.set(
      doc(db, TOOLS_COLLECTION, score.productId),
      { scores: { [result.categorySlug]: entry }, lastRunAt: serverTimestamp() },
      { merge: true },
    );
  });

  await batch.commit();
}
