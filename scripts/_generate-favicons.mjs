// One-off (but kept, re-runnable): regenerate PNG favicon fallbacks from
// public/favicon.svg. Run after editing the SVG: `node scripts/_generate-favicons.mjs`.
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const svg = readFileSync(new URL('../public/favicon.svg', import.meta.url));

// Dark-mode-safe rasterization: the SVG's <style> media query only applies
// when a `prefers-color-scheme` context exists. Raster fallbacks are for
// legacy consumers (old browsers, some crawlers) that ignore <link
// type="image/svg+xml"> anyway, so bake the light-mode colors in directly.
const targets = [
  { file: 'public/favicon-16x16.png', size: 16 },
  { file: 'public/favicon-32x32.png', size: 32 },
  { file: 'public/apple-touch-icon.png', size: 180 },
];

for (const { file, size } of targets) {
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(fileURLToPath(new URL(`../${file}`, import.meta.url)));
  console.log(`wrote ${file} (${size}x${size})`);
}
