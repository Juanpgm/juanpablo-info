import { describe, expect, it } from 'vitest';
import { localeUrlAbsolute, switchLocalePath } from './locale-path';

// design.md §5.3: pure prefix swap, no slug-translation map — route segments
// are stable English strings across locales.
describe('switchLocalePath', () => {
  it('swaps the locale prefix for the root path', () => {
    expect(switchLocalePath('/es/', 'en')).toBe('/en/');
    expect(switchLocalePath('/en/', 'es')).toBe('/es/');
  });

  it('preserves nested path segments while swapping the prefix', () => {
    expect(switchLocalePath('/es/about/', 'en')).toBe('/en/about/');
    expect(switchLocalePath('/en/about/', 'de')).toBe('/de/about/');
  });

  it('preserves blog post paths', () => {
    expect(switchLocalePath('/es/blog/rag-nsr-10/', 'en')).toBe('/en/blog/rag-nsr-10/');
    expect(switchLocalePath('/en/blog/rag-nsr-10/', 'de')).toBe('/de/blog/rag-nsr-10/');
  });

  it('does not translate the slug — pure prefix swap only', () => {
    // If a slug-translation map ever gets introduced, this changes on
    // purpose; today "about" and "blog/rag-nsr-10" stay byte-identical.
    const target = switchLocalePath('/es/about/', 'de');
    expect(target).toContain('/about/');
    expect(target.startsWith('/de/')).toBe(true);
  });
});

// design.md open item: getAbsoluteLocaleUrl shares localePath's `es`-prefix
// defect, since it builds on getLocaleRelativeUrl internally. Confirmed
// broken; localeUrlAbsolute is the fix (used by SeoHead/Hreflang canonical +
// hreflang tags).
describe('localeUrlAbsolute', () => {
  it('prefixes the default locale (es) same as any other', () => {
    expect(localeUrlAbsolute('https://juanpablo.info', 'es', 'about')).toBe('https://juanpablo.info/es/about/');
    expect(localeUrlAbsolute('https://juanpablo.info', 'en', 'about')).toBe('https://juanpablo.info/en/about/');
  });

  it('handles the empty path (home)', () => {
    expect(localeUrlAbsolute('https://juanpablo.info', 'es')).toBe('https://juanpablo.info/es/');
  });
});
