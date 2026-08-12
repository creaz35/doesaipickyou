import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Full-bleed square: iOS applies its own corner mask to touch icons.
// Same claw-machine artwork as BrandMark / icon.svg, minus the tile border.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fef3c7",
        }}
      >
        <svg width="160" height="160" viewBox="0 0 64 64">
          <path d="M32 4 L32 15" stroke="#1c1917" strokeWidth="4" strokeLinecap="round" />
          <circle cx="32" cy="17" r="3.6" fill="#1c1917" />
          <path
            d="M30 17 C21 18 17 27 23 34"
            fill="none"
            stroke="#1c1917"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M34 17 C43 18 47 27 41 34"
            fill="none"
            stroke="#1c1917"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <ellipse cx="32" cy="55.5" rx="9" ry="1.8" fill="#1c1917" opacity="0.14" />
          <rect
            x="23.5"
            y="36"
            width="17"
            height="15.5"
            rx="3.5"
            fill="#10b981"
            stroke="#1c1917"
            strokeWidth="3"
          />
          <circle cx="28.6" cy="42.2" r="1.6" fill="#1c1917" />
          <circle cx="35.4" cy="42.2" r="1.6" fill="#1c1917" />
          <path
            d="M28.4 46.2 Q32 48.8 35.6 46.2"
            fill="none"
            stroke="#1c1917"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M50 8 Q50 14 56 14 Q50 14 50 20 Q50 14 44 14 Q50 14 50 8 Z"
            fill="#f59e0b"
            stroke="#1c1917"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
