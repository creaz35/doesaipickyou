import { CATEGORIES } from "@/data/categories";
import { LEADER_TEMPLATE_IDS, renderPrompt, TEMPLATES } from "@/data/templates";
import { positionWeight, scoreCategory } from "./scoring";
import type { CategoryDef, ModelId, ProductDef, ProductScore, Snapshot } from "./types";

export interface PromptStat {
  templateId: string;
  prompt: string;
  mentioned: number;
  runs: number;
  avgPosition: number | null;
  /**
   * True when this product is the category leader and the prompt names
   * it ("alternatives to Buffer" on Buffer's page): not scored, because
   * an answer echoing the question is not a recommendation.
   */
  excluded: boolean;
}

export interface ModelStat {
  model: ModelId;
  visibility: number;
  mentioned: number;
  runs: number;
}

export interface ProductCategoryStats {
  category: Pick<CategoryDef, "slug" | "name">;
  rank: number;
  totalProducts: number;
  score: ProductScore;
  /** Full category leaderboard, for the "who beats it" context. */
  board: ProductScore[];
  promptStats: PromptStat[];
  modelStats: ModelStat[];
}

/**
 * A product id can appear in more than one category (Carrd is both a
 * landing page builder and a link-in-bio tool), so product pages key on
 * the id and aggregate every category that tracks it.
 */
export function getAllProductIds(): string[] {
  return [...new Set(CATEGORIES.flatMap((c) => c.products.map((p) => p.id)))];
}

export function getProduct(productId: string): ProductDef | undefined {
  for (const category of CATEGORIES) {
    const product = category.products.find((p) => p.id === productId);
    if (product) return product;
  }
  return undefined;
}

export function getProductStats(
  snapshot: Snapshot,
  productId: string,
  /**
   * A tool living only in Firestore (added via /admin): not part of the
   * static category defs, so it is merged into its categories here.
   */
  extra?: { product: ProductDef; categorySlugs: string[] },
): ProductCategoryStats[] {
  const results: ProductCategoryStats[] = [];

  for (const staticCategory of CATEGORIES) {
    const inStatic = staticCategory.products.some((p) => p.id === productId);
    const viaExtra = extra?.categorySlugs.includes(staticCategory.slug) ?? false;
    if (!inStatic && !viaExtra) continue;

    const category: CategoryDef =
      viaExtra && !inStatic
        ? { ...staticCategory, products: [...staticCategory.products, extra!.product] }
        : staticCategory;

    const board = scoreCategory(snapshot, category);
    const rank = board.findIndex((s) => s.productId === productId) + 1;
    const score = board[rank - 1];
    const categoryRuns = snapshot.runs.filter((r) => r.categorySlug === category.slug);

    const isLeader = productId === category.leader;

    const promptStats: PromptStat[] = TEMPLATES.map((template) => {
      const templateRuns = categoryRuns.filter((r) => r.templateId === template.id);
      let mentioned = 0;
      let positionSum = 0;
      for (const run of templateRuns) {
        const mention = run.mentions.find((m) => m.productId === productId);
        if (mention) {
          mentioned += 1;
          positionSum += mention.position;
        }
      }
      return {
        templateId: template.id,
        prompt: renderPrompt(template, category),
        mentioned,
        runs: templateRuns.length,
        avgPosition: mentioned ? Math.round((positionSum / mentioned) * 10) / 10 : null,
        excluded: isLeader && LEADER_TEMPLATE_IDS.has(template.id),
      };
    });

    // Same eligibility rule as scoring: the leader's per-model numbers
    // ignore the runs that name it in the question.
    const eligibleRuns = isLeader
      ? categoryRuns.filter((r) => !LEADER_TEMPLATE_IDS.has(r.templateId))
      : categoryRuns;

    const modelStats: ModelStat[] = snapshot.models.map((model: ModelId) => {
      const modelRuns = eligibleRuns.filter((r) => r.model === model);
      let mentioned = 0;
      let weightSum = 0;
      for (const run of modelRuns) {
        const mention = run.mentions.find((m) => m.productId === productId);
        if (mention) {
          mentioned += 1;
          weightSum += positionWeight(mention.position);
        }
      }
      return {
        model,
        visibility: modelRuns.length ? Math.round((weightSum / modelRuns.length) * 1000) / 10 : 0,
        mentioned,
        runs: modelRuns.length,
      };
    });

    results.push({
      category: { slug: category.slug, name: category.name },
      rank,
      totalProducts: board.length,
      score,
      board,
      promptStats,
      modelStats,
    });
  }

  return results;
}
