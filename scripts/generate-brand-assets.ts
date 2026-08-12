/**
 * Renders the brand mark to PNGs for places that cannot take SVG:
 * Stripe branding (icon + logo), social cards, press use.
 *
 *   npx tsx scripts/generate-brand-assets.ts
 *
 * Keep the artwork in sync with src/components/BrandMark.tsx and
 * src/app/icon.svg. Text uses explicit textLength so the layout holds
 * even when the rendering machine substitutes a different font.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OUT_DIR = path.join(process.cwd(), "public", "img");

const INK = "#1c1917";
const CREAM = "#fef3c7";
const EMERALD = "#10b981";
const MINT = "#a7f3d0";

/** The claw-machine artwork, drawn in a 64x64 box. */
const clawArt = `
  <path d="M32 5 L32 16" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
  <rect x="21" y="15" width="22" height="7" rx="3.5" fill="${INK}"/>
  <path d="M24 23 L19.5 30 Q18.5 34 22.5 35.5" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M40 23 L44.5 30 Q45.5 34 41.5 35.5" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <ellipse cx="32" cy="53" rx="9" ry="1.8" fill="${INK}" opacity="0.14"/>
  <rect x="23.5" y="29" width="17" height="16" rx="3.5" fill="${EMERALD}" stroke="${INK}" stroke-width="3"/>
  <circle cx="28.6" cy="35.4" r="1.6" fill="${INK}"/>
  <circle cx="35.4" cy="35.4" r="1.6" fill="${INK}"/>
  <path d="M28.4 39.4 Q32 42 35.6 39.4" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
  <path d="M52 6 Q52 12 58 12 Q52 12 52 18 Q52 12 46 12 Q52 12 52 6 Z" fill="#f59e0b" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>
`;

/** Square icon, full-bleed cream so it reads on any background. */
function iconSvg(size: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
    <rect width="64" height="64" fill="${CREAM}"/>
    ${clawArt}
  </svg>`;
}

/**
 * Wide logo: mark + wordmark. Every text run declares its own width, so
 * the composition never depends on the available font's metrics.
 */
function logoSvg(width: number, height: number, background: string): string {
  const font = "Verdana, DejaVu Sans, Arial, sans-serif";
  const baseline = 162;
  const size = 80;

  // x, width for each run, laid out left to right.
  const does = { x: 244, w: 192 };
  const chip = { x: 448, w: 112 };
  const pick = { x: 576, w: 176 };
  const you = { x: 764, w: 152 };
  const mark = { x: 934, w: 32 };

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1024 256">
    <rect width="1024" height="256" fill="${background}"/>
    <!-- Tight viewBox crops the artwork's own padding so the mark holds
         its weight next to the wordmark. -->
    <svg x="40" y="34" width="186" height="186" viewBox="14 3 46 56">${clawArt}</svg>
    <text x="${does.x}" y="${baseline}" textLength="${does.w}" lengthAdjust="spacingAndGlyphs"
      font-family="${font}" font-size="${size}" font-weight="bold" fill="${INK}">does</text>
    <rect x="${chip.x}" y="${baseline - 66}" width="${chip.w}" height="82" rx="16" fill="${EMERALD}" stroke="${INK}" stroke-width="3"/>
    <text x="${chip.x + 20}" y="${baseline - 8}" textLength="${chip.w - 40}" lengthAdjust="spacingAndGlyphs"
      font-family="${font}" font-size="${size - 14}" font-weight="bold" fill="#ffffff">AI</text>
    <text x="${pick.x}" y="${baseline}" textLength="${pick.w}" lengthAdjust="spacingAndGlyphs"
      font-family="${font}" font-size="${size}" font-weight="bold" fill="${INK}">pick</text>
    <rect x="${you.x - 8}" y="${baseline - 36}" width="${you.w + 16}" height="38" rx="5" fill="${MINT}"/>
    <text x="${you.x}" y="${baseline}" textLength="${you.w}" lengthAdjust="spacingAndGlyphs"
      font-family="${font}" font-size="${size}" font-weight="bold" fill="${INK}">you</text>
    <text x="${mark.x}" y="${baseline}" textLength="${mark.w}" lengthAdjust="spacingAndGlyphs"
      font-family="${font}" font-size="${size}" font-weight="bold" fill="#059669">?</text>
  </svg>`;
}

async function write(name: string, svg: string) {
  const file = path.join(OUT_DIR, name);
  await sharp(Buffer.from(svg)).png().toFile(file);
  const { size } = fs.statSync(file);
  console.log(`${name.padEnd(28)} ${(size / 1024).toFixed(1)} KB`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  await write("brand-icon-512.png", iconSvg(512));
  await write("brand-icon-1024.png", iconSvg(1024));
  await write("brand-logo.png", logoSvg(1024, 256, CREAM));
  await write("brand-logo-white.png", logoSvg(1024, 256, "#ffffff"));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
