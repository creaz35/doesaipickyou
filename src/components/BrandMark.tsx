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

      {/* claw rod + housing */}
      <path d="M32 5 L32 16" stroke="#1c1917" strokeWidth="4" strokeLinecap="round" />
      <rect x="21" y="15" width="22" height="7" rx="3.5" fill="#1c1917" />

      {/* prongs, hooked around the cube */}
      <path
        d="M24 23 L19.5 30 Q18.5 34 22.5 35.5"
        fill="none"
        stroke="#1c1917"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M40 23 L44.5 30 Q45.5 34 41.5 35.5"
        fill="none"
        stroke="#1c1917"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ground shadow */}
      <ellipse cx="32" cy="53" rx="9" ry="1.8" fill="#1c1917" opacity="0.14" />

      {/* the cube: you, thrilled to be picked */}
      <rect x="23.5" y="29" width="17" height="16" rx="3.5" fill="#10b981" stroke="#1c1917" strokeWidth="3" />
      <circle cx="28.6" cy="35.4" r="1.6" fill="#1c1917" />
      <circle cx="35.4" cy="35.4" r="1.6" fill="#1c1917" />
      <path
        d="M28.4 39.4 Q32 42 35.6 39.4"
        fill="none"
        stroke="#1c1917"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* AI sparkle */}
      <path
        d="M52 6 Q52 12 58 12 Q52 12 52 18 Q52 12 46 12 Q52 12 52 6 Z"
        fill="#f59e0b"
        stroke="#1c1917"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
