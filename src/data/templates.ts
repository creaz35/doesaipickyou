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

export function renderPrompt(template: PromptTemplate, category: CategoryDef): string {
  const leader = category.products.find((p) => p.id === category.leader);
  if (!leader) throw new Error(`Category ${category.slug}: leader "${category.leader}" not in products`);
  let text = template.text;
  // "best AI-powered AI video generator" reads broken, so drop the qualifier
  // when the category noun already leads with "AI".
  if (template.id === "best-ai" && category.noun.startsWith("AI ")) {
    text = "best {cat} in 2026";
  }
  return text.replaceAll("{cat}", category.noun).replaceAll("{leader}", leader.name);
}
