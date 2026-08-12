/**
 * Prints every prompt exactly as the runner sends it, one block per
 * category. Read this before changing templates or nouns: wording bugs
 * ("best CRM for a solo founder for a solo founder") hide in the
 * combinations, not in the parts.
 *
 *   npx tsx scripts/list-prompts.ts
 */
import { CATEGORIES } from "../src/data/categories";
import { renderPrompt, TEMPLATES } from "../src/data/templates";

for (const category of CATEGORIES) {
  console.log(`\n== ${category.name} (${category.slug})`);
  for (const template of TEMPLATES) {
    console.log(`   ${renderPrompt(template, category)}`);
  }
}
