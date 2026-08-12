/**
 * Generates a deterministic fake snapshot so the site renders end-to-end
 * before the real model runner exists. The output is labeled mock: true
 * and the UI shows a banner. Never let this masquerade as real data.
 *
 * Usage: npm run snapshot:mock [-- 2026-08]
 */
import fs from "node:fs";
import path from "node:path";
import { CATEGORIES } from "../src/data/categories";
import { TEMPLATES, renderPrompt } from "../src/data/templates";
import type { Mention, ModelId, PromptRun, Snapshot } from "../src/lib/types";

const MODELS: ModelId[] = ["openai", "anthropic"];
const RUNS_PER_PROMPT = 3;

// Seeded PRNG (mulberry32) so regenerating produces the same fixture.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);

const snapshotId = process.argv[2] ?? new Date().toISOString().slice(0, 7);
const runs: PromptRun[] = [];

for (const category of CATEGORIES) {
  // Fixed per-product popularity: leader strongest, long tail weaker, and
  // one random product left near-invisible so the /invisible page has data.
  const invisibleIdx = Math.floor(rand() * category.products.length);
  const popularity = category.products.map((p, i) => {
    if (p.id === category.leader) return 0.95;
    if (i === invisibleIdx && p.id !== category.leader) return 0.05;
    return 0.25 + rand() * 0.55;
  });

  for (const template of TEMPLATES) {
    const prompt = renderPrompt(template, category);
    for (const model of MODELS) {
      for (let runIndex = 0; runIndex < RUNS_PER_PROMPT; runIndex++) {
        const picked = category.products
          .map((p, i) => ({ id: p.id, pop: popularity[i], roll: rand() }))
          .filter((x) => x.roll < x.pop)
          .map((x) => ({ ...x, order: x.pop + (rand() - 0.5) * 0.3 }))
          .sort((a, b) => b.order - a.order);
        const mentions: Mention[] = picked.map((x, i) => ({ productId: x.id, position: i + 1 }));
        runs.push({ categorySlug: category.slug, templateId: template.id, prompt, model, runIndex, mentions });
      }
    }
  }
}

const snapshot: Snapshot = {
  id: snapshotId,
  createdAt: new Date().toISOString(),
  mock: true,
  models: MODELS,
  runsPerPrompt: RUNS_PER_PROMPT,
  runs,
};

const dir = path.join(process.cwd(), "data", "snapshots");
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, `${snapshotId}.json`);
fs.writeFileSync(file, JSON.stringify(snapshot, null, 2));
console.log(`Wrote ${runs.length} runs to ${file}`);
