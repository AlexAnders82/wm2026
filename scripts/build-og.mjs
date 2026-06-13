// build-og.mjs — einmaliges statisches OG-Bild (1200x630), DESIGN_SYSTEM.md 7.
// Night-Hintergrund, Logo + Claim, grafisch (Flutlicht-Glow), keine Fotos.
// Rendert SVG -> public/og.png via sharp (in Astro vorhanden).

import sharp from "sharp";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../public/og.png");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glowA" cx="18%" cy="0%" r="70%">
      <stop offset="0%" stop-color="#2FCB6E" stop-opacity="0.16"/>
      <stop offset="70%" stop-color="#2FCB6E" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowB" cx="95%" cy="0%" r="60%">
      <stop offset="0%" stop-color="#F0B429" stop-opacity="0.14"/>
      <stop offset="70%" stop-color="#F0B429" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#0B1120"/>
  <rect width="1200" height="630" fill="url(#glowA)"/>
  <rect width="1200" height="630" fill="url(#glowB)"/>
  <g font-family="sans-serif" text-anchor="middle">
    <text x="600" y="300" font-size="140" font-weight="800" fill="#EDF1F8" letter-spacing="2">ANSTOSS <tspan fill="#2FCB6E">'</tspan>26</text>
    <text x="600" y="380" font-size="40" font-weight="600" fill="#94A1B8">Spielplan · Ergebnisse · Wo läuft's?</text>
    <text x="600" y="470" font-size="30" font-weight="500" fill="#94A1B8">WM 2026 · alle 104 Spiele · ARD · ZDF · MagentaTV</text>
  </g>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(OUT);
console.log(`✓ OG-Bild geschrieben → ${OUT}`);
