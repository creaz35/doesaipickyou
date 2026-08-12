import { ImageResponse } from "next/og";
import { OgMark } from "@/components/og-mark";
import { CATEGORIES } from "@/data/categories";
import { getAllProductIds, getProduct } from "@/lib/product-stats";

export const alt = "Does AI recommend this tool?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Pre-render one card per known tool; admin-added tools render on demand.
export function generateStaticParams() {
  return getAllProductIds().map((product) => ({ product }));
}

/**
 * Per-tool share card. Deliberately data-free: it names the tool and the
 * question, but never the score. Scores change every month while social
 * platforms cache these images for weeks, so a number baked in here would
 * eventually be a lie told on someone else's timeline.
 */
export default async function OpengraphImage({ params }: PageProps<"/[product]">) {
  const { product: productId } = await params;
  const product = getProduct(productId);
  const name = product?.name ?? productId;
  const category = CATEGORIES.find((c) => c.products.some((p) => p.id === productId));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#fef3c7",
          padding: "56px 64px",
          fontFamily: "sans-serif",
          color: "#1c1917",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <OgMark size={72} />
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700 }}>
            <span>does</span>
            <span
              style={{
                background: "#10b981",
                color: "#ffffff",
                borderRadius: 8,
                padding: "0 10px",
                margin: "0 4px",
              }}
            >
              AI
            </span>
            <span>pickyou</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", fontSize: 32, color: "#57534e", fontWeight: 600 }}>
            {category ? `${category.emoji} ${category.name}` : "AI visibility"}
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              fontSize: name.length > 14 ? 88 : 108,
              fontWeight: 800,
              lineHeight: 1.1,
            }}
          >
            <span>Does AI pick</span>
            <span
              style={{
                background: "#a7f3d0",
                borderRadius: 12,
                padding: "0 16px",
                margin: "0 8px 0 20px",
              }}
            >
              {name}
            </span>
            <span style={{ color: "#059669" }}>?</span>
          </div>
          <div style={{ display: "flex", fontSize: 32, color: "#57534e" }}>
            Rank, mention rate, and the raw answers from every model we ask.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              border: "3px solid #1c1917",
              borderRadius: 999,
              padding: "10px 24px",
              fontSize: 26,
              fontWeight: 700,
              background: "#ffffff",
            }}
          >
            see the score →
          </div>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 700, color: "#059669" }}>
            doesaipickyou.com/{productId}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
