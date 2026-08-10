/**
 * Selects the locale-appropriate hero diagram asset key for the
 * `import.meta.glob('/src/assets/blog/*.svg', { query: '?raw', ... })` lookup
 * used by PostLayout/BlogCard (design.md "Locale variant by entry-id prefix
 * — zero change to content-fallback.ts"). The blog Content Collection loads
 * entries as `"{locale}/{slug}"` (content.config.ts), so the prefix before
 * the first "/" IS the locale. Only `es` gets the Spanish-labeled SVG; every
 * other prefix (en, and de/fr/ru which inherit the EN entry object via
 * getLocalizedEntries' fallback merge) gets the `.en.svg` variant.
 */
export function resolveHeroDiagramKey(entryId: string, slug: string): string {
  const prefix = entryId.slice(0, entryId.indexOf('/'));
  const suffix = prefix === 'es' ? '' : '.en';
  return `/src/assets/blog/${slug}${suffix}.svg`;
}
