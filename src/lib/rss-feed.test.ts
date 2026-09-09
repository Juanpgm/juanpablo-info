import { describe, expect, it } from 'vitest';
import { buildFeedItems, feedMeta, type FeedSourceEntry } from './rss-feed';

const SITE = 'https://juanpablo.info';

// Minimal stand-in for localeUrlAbsolute's shape — proves buildFeedItems
// stays pure and never imports astro:i18n transitively (design constraint).
function fakeUrlBuilder(site: string | URL | undefined, locale: string, path = ''): string {
  return `${site}/${locale}/${path}/`.replace(/\/+/g, '/').replace(':/', '://');
}

function makeEntry(overrides: Partial<FeedSourceEntry['data']> & { id?: string } = {}): FeedSourceEntry {
  const { id = 'en/sample-post', ...data } = overrides;
  return {
    id,
    data: {
      title: 'Sample post',
      description: 'A sample post description.',
      pubDate: new Date('2024-01-01T00:00:00Z'),
      tags: ['ia'],
      draft: false,
      ...data,
    },
  };
}

describe('buildFeedItems', () => {
  it('returns an empty array for an empty collection', () => {
    expect(buildFeedItems([], 'en', SITE, fakeUrlBuilder)).toEqual([]);
  });

  it('excludes entries with draft: true', () => {
    const entries = [makeEntry({ id: 'en/published' }), makeEntry({ id: 'en/unpublished', draft: true })];
    const items = buildFeedItems(entries, 'en', SITE, fakeUrlBuilder);
    expect(items).toHaveLength(1);
    expect(items[0].link).toContain('published');
  });

  it('sorts items by pubDate descending (newest first)', () => {
    const entries = [
      makeEntry({ id: 'en/oldest', pubDate: new Date('2023-01-01') }),
      makeEntry({ id: 'en/newest', pubDate: new Date('2025-01-01') }),
      makeEntry({ id: 'en/middle', pubDate: new Date('2024-01-01') }),
    ];
    const items = buildFeedItems(entries, 'en', SITE, fakeUrlBuilder);
    expect(items.map((i) => i.link)).toEqual([
      fakeUrlBuilder(SITE, 'en', 'blog/newest'),
      fakeUrlBuilder(SITE, 'en', 'blog/middle'),
      fakeUrlBuilder(SITE, 'en', 'blog/oldest'),
    ]);
  });

  it('maps tags to categories', () => {
    const entries = [makeEntry({ tags: ['ia', 'carrera'] })];
    const items = buildFeedItems(entries, 'en', SITE, fakeUrlBuilder);
    expect(items[0].categories).toEqual(['ia', 'carrera']);
  });

  it('builds title, description, and pubDate from entry data', () => {
    const pubDate = new Date('2024-06-15T12:00:00Z');
    const entries = [makeEntry({ pubDate })];
    const items = buildFeedItems(entries, 'en', SITE, fakeUrlBuilder);
    expect(items[0].title).toBe('Sample post');
    expect(items[0].description).toBe('A sample post description.');
    expect(items[0].pubDate).toBe(pubDate);
  });

  it('builds the link via the injected url builder, stripping the locale prefix from the slug', () => {
    const entries = [makeEntry({ id: 'es/rag-nsr-10' })];
    const items = buildFeedItems(entries, 'es', SITE, fakeUrlBuilder);
    expect(items[0].link).toBe(fakeUrlBuilder(SITE, 'es', 'blog/rag-nsr-10'));
  });
});

describe('feedMeta', () => {
  it('returns a title and description for es', () => {
    const meta = feedMeta('es');
    expect(meta.title.length).toBeGreaterThan(0);
    expect(meta.description.length).toBeGreaterThan(0);
  });

  it('returns different titles for different known locales', () => {
    expect(feedMeta('es').title).not.toBe(feedMeta('en').title);
    expect(feedMeta('en').title).not.toBe(feedMeta('de').title);
  });

  it('returns metadata for every supported locale', () => {
    for (const locale of ['es', 'en', 'de', 'fr', 'ru']) {
      const meta = feedMeta(locale);
      expect(meta.title.length).toBeGreaterThan(0);
      expect(meta.description.length).toBeGreaterThan(0);
    }
  });

  it('falls back to en for an unknown locale', () => {
    expect(feedMeta('xx')).toEqual(feedMeta('en'));
  });
});
