import { describe, expect, it } from 'vitest';
import { resolveHeroDiagramKey } from './hero-diagram';

// design.md "Locale variant by entry-id prefix": es entries get the
// Spanish-labeled SVG, every other prefix (en, and de/fr/ru inheriting the
// EN entry via content-fallback.ts) gets the .en.svg variant.
describe('resolveHeroDiagramKey', () => {
  it('resolves an es entry to the Spanish-labeled SVG', () => {
    expect(resolveHeroDiagramKey('es/x', 'x')).toBe('/src/assets/blog/x.svg');
  });

  it('resolves an en entry to the English-labeled SVG', () => {
    expect(resolveHeroDiagramKey('en/x', 'x')).toBe('/src/assets/blog/x.en.svg');
  });

  it('falls back to the English-labeled SVG for a non-es/en prefix', () => {
    expect(resolveHeroDiagramKey('de/x', 'x')).toBe('/src/assets/blog/x.en.svg');
  });
});
