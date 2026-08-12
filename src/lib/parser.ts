import type { CategoryDef, Mention } from "./types";

export const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

interface Hit {
  productId: string;
  start: number;
  end: number;
}

/**
 * Extract which of a category's products are mentioned in an answer, in
 * order of first appearance.
 *
 * Matching is exact-alias with word boundaries. No fuzzy matching, ever.
 * A fuzzy leaderboard is quietly wrong; a strict one is visibly missing an
 * alias, which someone can fix with a one-line PR to the alias table.
 *
 * When two products' aliases overlap in the text ("Notion AI" vs "Notion"),
 * the longer match wins and the shorter is discarded for that span.
 */
export function extractMentions(text: string, category: CategoryDef): Mention[] {
  const hits: Hit[] = [];

  for (const product of category.products) {
    for (const alias of product.aliases) {
      const { text: aliasText, caseSensitive } =
        typeof alias === "string" ? { text: alias, caseSensitive: false } : alias;
      const re = new RegExp(`\\b${escapeRegExp(aliasText)}\\b`, caseSensitive ? "g" : "gi");
      for (const m of text.matchAll(re)) {
        hits.push({ productId: product.id, start: m.index, end: m.index + m[0].length });
      }
    }
  }

  // Sort by position, longest-first at equal starts, so an overlapping
  // shorter alias from a different product gets skipped.
  hits.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

  const accepted: Hit[] = [];
  for (const h of hits) {
    const overlapsOther = accepted.some(
      (a) => a.productId !== h.productId && h.start < a.end && a.start < h.end,
    );
    if (!overlapsOther) accepted.push(h);
  }

  const firstSeen = new Map<string, number>();
  for (const h of accepted) {
    if (!firstSeen.has(h.productId)) firstSeen.set(h.productId, h.start);
  }

  return [...firstSeen.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([productId], i) => ({ productId, position: i + 1 }));
}
