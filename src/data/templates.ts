import type { CategoryDef } from "@/lib/types";

/**
 * The six prompt templates, applied identically to every category so
 * scores are comparable across categories. Written the way a real buyer
 * types, not the way a marketer writes.
 *
 * Template ids are part of snapshot history. Never rename or reword an
 * existing template without bumping its id, or old and new runs stop
 * being comparable.
 */
export interface PromptTemplate {
  id: string;
  /** {cat} = category noun, {leader} = display name of the category leader. */
  text: string;
}

export const TEMPLATES: PromptTemplate[] = [
  { id: "best-solo", text: "best {cat} for a solo founder" },
  { id: "cheapest-good", text: "cheapest {cat} that is actually good" },
  { id: "alternatives", text: "alternatives to {leader}" },
  { id: "stop-paying", text: "what should I use instead of {leader}? I want to stop paying" },
  { id: "best-ai", text: "best AI-powered {cat} in 2026" },
  { id: "small-budget", text: "recommend a {cat}, I have a small budget and no team" },
];

/**
 * Templates that name the category leader in the question. The leader is
 * excluded from mention parsing AND from its own denominator on these
 * runs: models echo the question's subject back ("if you want
 * alternatives to Buffer, ..."), and an echo is not a recommendation.
 */
export const LEADER_TEMPLATE_IDS: ReadonlySet<string> = new Set(
  TEMPLATES.filter((t) => t.text.includes("{leader}")).map((t) => t.id),
);

/**
 * "a CRM" but "an SEO research tool" and "an AI writing assistant".
 * Acronyms take the article of the letter name (es-ee-oh), not the letter.
 */
function needsAn(noun: string): boolean {
  const word = noun.split(" ")[0];
  if (/^[A-Z]{2,}/.test(word)) return "AEFHILMNORSX".includes(word[0]);
  return "aeiou".includes(word[0].toLowerCase());
}

export function renderPrompt(template: PromptTemplate, category: CategoryDef): string {
  const leader = category.products.find((p) => p.id === category.leader);
  if (!leader) throw new Error(`Category ${category.slug}: leader "${category.leader}" not in products`);
  let text = template.text;
  // "best AI-powered short-form AI video tool" doubles the AI, so drop the
  // qualifier when the noun already carries it.
  if (template.id === "best-ai" && /\bAI\b/.test(category.noun)) {
    text = "best {cat} in 2026";
  }
  if (needsAn(category.noun)) {
    text = text.replaceAll("a {cat}", "an {cat}");
  }
  return text.replaceAll("{cat}", category.noun).replaceAll("{leader}", leader.name);
}
