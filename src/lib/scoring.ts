import { LEADER_TEMPLATE_IDS } from "@/data/templates";
import type { CategoryDef, ModelId, ProductScore, Snapshot } from "./types";

/**
 * Weight of a mention by its position in the answer. Being named first
 * is worth twice a fifth-place mention; anything past fifth gets a flat
 * floor: still counted, barely rewarded.
 *
 * These weights are part of the published methodology. Changing them
 * rescales every historical score, so don't.
 */
export const POSITION_WEIGHTS = [1, 0.85, 0.7, 0.6, 0.5] as const;
export const FLOOR_WEIGHT = 0.4;

export function positionWeight(position: number): number {
  return POSITION_WEIGHTS[position - 1] ?? FLOOR_WEIGHT;
}

/**
 * visibility = 100 x (sum of position weights across runs) / (total runs)
 *
 * 100 means "named first in every single run"; 0 means invisible.
 *
 * Pass `model` to score only that model's runs (the /models leaderboards).
 */
export function scoreCategory(
  snapshot: Snapshot,
  category: CategoryDef,
  model?: ModelId,
): ProductScore[] {
  const runs = snapshot.runs.filter(
    (r) => r.categorySlug === category.slug && (!model || r.model === model),
  );

  const scores = category.products.map((product) => {
    // The leader is excluded from parsing on prompts that name it, so
    // those runs leave its denominator too: otherwise its ceiling would
    // be ~67 while everyone else can reach 100.
    const eligible =
      product.id === category.leader
        ? runs.filter((r) => !LEADER_TEMPLATE_IDS.has(r.templateId))
        : runs;

    let weightSum = 0;
    let mentionedRuns = 0;
    let positionSum = 0;

    for (const run of eligible) {
      const mention = run.mentions.find((m) => m.productId === product.id);
      if (mention) {
        weightSum += positionWeight(mention.position);
        mentionedRuns += 1;
        positionSum += mention.position;
      }
    }

    return {
      productId: product.id,
      name: product.name,
      url: product.url,
      price: product.price,
      visibility: eligible.length ? Math.round((weightSum / eligible.length) * 1000) / 10 : 0,
      mentionRate: eligible.length ? mentionedRuns / eligible.length : 0,
      avgPosition: mentionedRuns ? Math.round((positionSum / mentionedRuns) * 10) / 10 : null,
      runs: eligible.length,
    };
  });

  return scores.sort((a, b) => b.visibility - a.visibility || a.name.localeCompare(b.name));
}
