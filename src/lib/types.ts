export type ModelId = "openai" | "anthropic" | "gemini" | "perplexity";

export const MODEL_LABELS: Record<ModelId, string> = {
  openai: "ChatGPT",
  anthropic: "Claude",
  gemini: "Gemini",
  perplexity: "Perplexity",
};

/**
 * An alias is matched against answer text with word boundaries.
 * Plain strings match case-insensitively. Product names that are also
 * common English words ("Later", "Linear", "Wave") must be marked
 * caseSensitive so "see you later" doesn't count as a mention.
 */
export type AliasDef = string | { text: string; caseSensitive: boolean };

export interface ProductDef {
  /** Stable slug, unique within its category. Never rename: history keys on it. */
  id: string;
  name: string;
  url: string;
  /** Short hand-maintained display price, e.g. "Free + $6/mo", "$89 once". */
  price: string;
  /** Complete list of strings that count as a mention. `name` is NOT matched implicitly. */
  aliases: AliasDef[];
}

export interface CategoryDef {
  slug: string;
  /** Single emoji shown next to the category name across the UI. */
  emoji: string;
  /** Display name, plural: "Social media schedulers" */
  name: string;
  /** Singular noun slotted into prompt templates: "social media scheduler" */
  noun: string;
  /** Product id of the best-known incumbent, used by {leader} templates. */
  leader: string;
  products: ProductDef[];
}

export interface Mention {
  productId: string;
  /** 1-based order of first appearance in the answer. */
  position: number;
}

export interface PromptRun {
  categorySlug: string;
  templateId: string;
  prompt: string;
  model: ModelId;
  /** 0-based repeat index (each prompt runs multiple times per model). */
  runIndex: number;
  mentions: Mention[];
  /**
   * The model's raw answer, truncated by the runner. Absent on mock data
   * and on runs recorded before answers were kept.
   */
  answer?: string;
}

export interface Snapshot {
  /** "YYYY-MM", one snapshot per monthly refresh. */
  id: string;
  createdAt: string;
  /** True for generated fixture data, so the UI can label it honestly. */
  mock?: boolean;
  models: ModelId[];
  runsPerPrompt: number;
  runs: PromptRun[];
}

export interface ProductScore {
  productId: string;
  name: string;
  url: string;
  price: string;
  /** 0–100: position-weighted share of runs that mention the product. */
  visibility: number;
  /** 0–1: share of runs that mention the product at all. */
  mentionRate: number;
  /** Average position when mentioned, null if never mentioned. */
  avgPosition: number | null;
  /** Total runs the score is computed over. */
  runs: number;
}
