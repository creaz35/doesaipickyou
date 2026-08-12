import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import { CATEGORIES } from "@/data/categories";
import type { AliasDef, ProductScore } from "@/lib/types";

export const CATEGORIES_COLLECTION = "categories";
export const TOOLS_COLLECTION = "tools";

export interface CategoryDoc {
  slug: string;
  emoji: string;
  name: string;
  noun: string;
  /** Tool id of the incumbent used by "alternatives to {leader}" prompts. */
  leader: string;
  updatedAt?: unknown;
  /** Latest live leaderboard, written by the snapshot runner. */
  scores?: ProductScore[];
  lastRunAt?: unknown;
}

/** A tool's result within one category, denormalized onto the tool doc. */
export interface ToolCategoryScore {
  rank: number;
  visibility: number;
  mentionRate: number;
  avgPosition: number | null;
  runs: number;
}

/** Alias stored in one uniform shape, unlike the string shorthand in code. */
export interface StoredAlias {
  text: string;
  caseSensitive: boolean;
}

export interface ToolDoc {
  id: string;
  name: string;
  url: string;
  price: string;
  aliases: StoredAlias[];
  /**
   * A tool can compete in several categories (Carrd is a landing page
   * builder and a link-in-bio tool), so tools are top-level documents
   * with category membership as data.
   */
  categorySlugs: string[];
  updatedAt?: unknown;
  /** Latest live results per category slug, written by the snapshot runner. */
  scores?: Record<string, ToolCategoryScore>;
  lastRunAt?: unknown;
}

function normalizeAliases(aliases: AliasDef[]): StoredAlias[] {
  return aliases.map((a) =>
    typeof a === "string" ? { text: a, caseSensitive: false } : { text: a.text, caseSensitive: true },
  );
}

/** Flattens src/data/categories.ts into Firestore-shaped docs. */
export function buildCatalogFromStatic(): { categories: CategoryDoc[]; tools: ToolDoc[] } {
  const categories: CategoryDoc[] = CATEGORIES.map((c) => ({
    slug: c.slug,
    emoji: c.emoji,
    name: c.name,
    noun: c.noun,
    leader: c.leader,
  }));

  const toolMap = new Map<string, ToolDoc>();
  for (const category of CATEGORIES) {
    for (const product of category.products) {
      const existing = toolMap.get(product.id);
      if (existing) {
        if (!existing.categorySlugs.includes(category.slug)) {
          existing.categorySlugs.push(category.slug);
        }
      } else {
        toolMap.set(product.id, {
          id: product.id,
          name: product.name,
          url: product.url,
          price: product.price,
          aliases: normalizeAliases(product.aliases),
          categorySlugs: [category.slug],
        });
      }
    }
  }

  return { categories, tools: [...toolMap.values()] };
}

/**
 * Upserts the static catalog into Firestore. Admin-only via rules; run it
 * again any time src/data/categories.ts changes — doc ids are the stable
 * slugs/ids, so re-syncing overwrites in place instead of duplicating.
 */
export async function seedCatalogFromStatic(
  db: Firestore,
): Promise<{ categories: number; tools: number }> {
  const { categories, tools } = buildCatalogFromStatic();

  const batch = writeBatch(db);
  for (const category of categories) {
    batch.set(doc(db, CATEGORIES_COLLECTION, category.slug), {
      ...category,
      updatedAt: serverTimestamp(),
    });
  }
  for (const tool of tools) {
    batch.set(doc(db, TOOLS_COLLECTION, tool.id), {
      ...tool,
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();

  return { categories: categories.length, tools: tools.length };
}

/**
 * Creates or updates one tool doc (the admin "Add tool" form). The tool
 * competes in the next snapshot run of its categories right away; adding
 * it to src/data/categories.ts as well keeps the open dataset in sync.
 * Merge keeps runner-written fields (scores, lastRunAt) across edits.
 */
export async function saveToolDoc(db: Firestore, tool: ToolDoc): Promise<void> {
  await setDoc(
    doc(db, TOOLS_COLLECTION, tool.id),
    { ...tool, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

/**
 * Creates or updates one category doc (the admin "Add category" form).
 * Same code-catalog caveat as tools: add it to src/data/categories.ts
 * as well to keep the open dataset and /models in sync.
 */
export async function saveCategoryDoc(db: Firestore, category: CategoryDoc): Promise<void> {
  await setDoc(
    doc(db, CATEGORIES_COLLECTION, category.slug),
    { ...category, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

/**
 * Deletes a tool doc and strips it from every category's live scores, so
 * it leaves the public leaderboards on the next ISR pass.
 *
 * The catalog's source of truth is src/data/categories.ts: while the tool
 * is still listed there, the next "Sync catalog from code" resurrects it.
 * Deleting here is for pulling something off the site now; removing it
 * from the code (and committing) makes it permanent.
 */
export async function deleteToolEverywhere(
  db: Firestore,
  toolId: string,
  categories: CategoryDoc[],
): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, TOOLS_COLLECTION, toolId));
  for (const category of categories) {
    if (category.scores?.some((s) => s.productId === toolId)) {
      batch.set(
        doc(db, CATEGORIES_COLLECTION, category.slug),
        { scores: category.scores.filter((s) => s.productId !== toolId) },
        { merge: true },
      );
    }
  }
  await batch.commit();
}

export async function fetchCategoryDocs(db: Firestore): Promise<CategoryDoc[]> {
  const snap = await getDocs(query(collection(db, CATEGORIES_COLLECTION), orderBy("name")));
  return snap.docs.map((d) => d.data() as CategoryDoc);
}

export async function fetchToolDocs(db: Firestore): Promise<ToolDoc[]> {
  const snap = await getDocs(query(collection(db, TOOLS_COLLECTION), orderBy("name")));
  return snap.docs.map((d) => d.data() as ToolDoc);
}
