import { ImageResponse } from "next/og";
import { OgMark } from "@/components/og-mark";
import { CATEGORIES } from "@/data/categories";

export const alt = "Does AI pick you? Monthly leaderboards of what AI models recommend.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const tools = new Set(CATEGORIES.flatMap((c) => c.products.map((p) => p.id))).size;

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

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 104, fontWeight: 800 }}>
            <span>Does AI pick</span>
            <span
              style={{
                background: "#a7f3d0",
                borderRadius: 12,
                padding: "0 14px",
                margin: "0 6px 0 20px",
              }}
            >
              you
            </span>
            <span style={{ color: "#059669" }}>?</span>
          </div>
          <div style={{ display: "flex", fontSize: 34, color: "#57534e", maxWidth: 980 }}>
            We ask ChatGPT, Claude and friends the questions your buyers ask, and track which
            products they actually recommend.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 14 }}>
            {[`${tools} tools`, `${CATEGORIES.length} categories`, "refreshed monthly"].map(
              (chip) => (
                <div
                  key={chip}
                  style={{
                    display: "flex",
                    border: "3px solid #1c1917",
                    borderRadius: 999,
                    padding: "8px 20px",
                    fontSize: 26,
                    fontWeight: 700,
                    background: "#ffffff",
                  }}
                >
                  {chip}
                </div>
              ),
            )}
          </div>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 700, color: "#059669" }}>
            doesaipickyou.com
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
