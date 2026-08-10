// ponytail: one-off script, run manually, not part of the build pipeline.
// Generates a single branded default OG image (1200x630) from an inline SVG
// string, rasterized via `sharp` (transitive dep of astro's image pipeline —
// see `npm ls sharp`, no new dependency added). Re-run manually if the
// brand palette/copy changes; not wired into `npm run build` (design A8 —
// pre-rendered static PNGs, no runtime satori route).
//
// ponytail: per-post dynamic OG images are explicitly deferred (design ADR
// A8) — if that becomes desirable, replace this script with build-time
// satori/resvg generation inside blog/[...slug].astro's getStaticPaths.
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// ponytail: tried embedding the site's actual Fraunces/Manrope woff2 files
// as inline @font-face data URIs first — sharp's bundled librsvg doesn't
// reliably resolve them (falls back to system fonts regardless), so this
// uses generic serif/sans-serif stacks instead. Good enough for one static
// brand image; revisit only if pixel-perfect font matching is requested.
const INK_BG = '#1b1815';
const INK_BG_SUBTLE = '#242019';
const TEXT = '#f2ede6';
const TEXT_MUTED = '#b7ada0';
const TEAL = '#2dd4bf';

const WIDTH = 1200;
const HEIGHT = 630;

const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .name { font-family: Georgia, 'Times New Roman', serif; font-weight: 700; }
      .role { font-family: 'Segoe UI', Arial, sans-serif; font-weight: 600; }
    </style>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${INK_BG}" />
      <stop offset="100%" stop-color="${INK_BG_SUBTLE}" />
    </linearGradient>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)" />

  <!-- teal accent detail: a thin left rail + corner glyph, echoes the
       two-worlds connector "⇄" motif from TwoWorlds.astro -->
  <rect x="0" y="0" width="10" height="${HEIGHT}" fill="${TEAL}" />
  <circle cx="1120" cy="110" r="46" fill="none" stroke="${TEAL}" stroke-width="2" opacity="0.6" />
  <text x="1120" y="126" text-anchor="middle" class="role" font-size="34" fill="${TEAL}">&#8644;</text>

  <text x="96" y="300" class="name" font-size="72" fill="${TEXT}">Juan Pablo</text>
  <text x="96" y="382" class="name" font-size="72" fill="${TEXT}">Guzmán Martínez</text>

  <text x="98" y="440" class="role" font-size="30" fill="${TEAL}">Ingeniero Civil · IA y Ciencia de Datos</text>

  <text x="98" y="560" class="role" font-size="22" fill="${TEXT_MUTED}">Cali, Colombia</text>
</svg>
`;

const outPath = path.join(root, 'public/og/default.png');

sharp(Buffer.from(svg))
  .png()
  .toFile(outPath)
  .then(() => {
    console.log('Wrote', outPath);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
