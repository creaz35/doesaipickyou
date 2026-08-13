import type { MetadataRoute } from "next";
import { getAllProductIds } from "@/lib/product-stats";
import { getSiteData } from "@/lib/site-data";

const SITE = "https://doesaipickyou.com";

// Refresh hourly so admin-added tools and categories join without a deploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await getSiteData();
  const now = new Date();

  // Categories: the code catalog plus anything added via /admin.
  const categorySlugs = data.categories.map((c) => c.slug);

  // Tools: the code catalog plus any Firestore-only ids present in live scores.
  const productIds = new Set(getAllProductIds());
  for (const category of data.categories) {
    for (const score of category.scores) productIds.add(score.productId);
  }

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/categories`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE}/models`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE}/stats`, lastModified: now, changeFrequency: "daily", priority: 0.5 },
    { url: `${SITE}/methodology`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE}/sponsor`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE}/submission`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.1 },
    { url: `${SITE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.1 },
  ];

  return [
    ...staticPages,
    ...categorySlugs.map((slug) => ({
      url: `${SITE}/category/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...[...productIds].sort().map((id) => ({
      url: `${SITE}/${id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
