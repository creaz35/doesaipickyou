/**
 * The brand mark: an arcade claw (the AI) picking up a happy emerald cube
 * (you, the product). Cream tile, ink strokes, one amber sparkle.
 * Keep in sync with src/app/icon.svg and src/app/apple-icon.tsx.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      {/* tile */}
      <rect x="1.5" y="1.5" width="61" height="61" rx="14" fill="#fef3c7" stroke="#1c1917" strokeWidth="3" />

      {/* claw rod + joint */}
      <path d="M32 4 L32 15" stroke="#1c1917" strokeWidth="4" strokeLinecap="round" />
      <circle cx="32" cy="17" r="3.6" fill="#1c1917" />

      {/* claw prongs, open around the cube */}
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

      {/* ground shadow */}
      <ellipse cx="32" cy="55.5" rx="9" ry="1.8" fill="#1c1917" opacity="0.14" />

      {/* the cube: you, thrilled to be picked */}
      <rect x="23.5" y="36" width="17" height="15.5" rx="3.5" fill="#10b981" stroke="#1c1917" strokeWidth="3" />
      <circle cx="28.6" cy="42.2" r="1.6" fill="#1c1917" />
      <circle cx="35.4" cy="42.2" r="1.6" fill="#1c1917" />
      <path
        d="M28.4 46.2 Q32 48.8 35.6 46.2"
        fill="none"
        stroke="#1c1917"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* AI sparkle */}
      <path
        d="M50 8 Q50 14 56 14 Q50 14 50 20 Q50 14 44 14 Q50 14 50 8 Z"
        fill="#f59e0b"
        stroke="#1c1917"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
