import { describe, expect, it } from 'vitest';
import { renderEmailLayout } from './email-layout';

function baseParams(overrides: Partial<Parameters<typeof renderEmailLayout>[0]> = {}) {
  return {
    locale: 'en',
    preheader: 'Preview text',
    bodyHtml: '<p>Hello there.</p>',
    ctas: [] as { label: string; href: string }[],
    letterhead: 'Test Letterhead',
    ...overrides,
  };
}

describe('renderEmailLayout', () => {
  it('declares a utf-8 charset in the document head', () => {
    // ✓, →, · and Cyrillic content depend on this rather than only on
    // Resend's default MIME charset header — cheap insurance.
    const html = renderEmailLayout(baseParams());
    expect(html).toMatch(/<meta charset="utf-8"\s*\/?>/i);
  });

  it('escapes a script tag injected via preheader', () => {
    const html = renderEmailLayout(baseParams({ preheader: '<script>alert(1)</script>' }));
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('escapes a script tag injected via a cta label', () => {
    const html = renderEmailLayout(
      baseParams({ ctas: [{ label: '<script>alert(1)</script>', href: 'https://juanpablo.info/en/blog/' }] }),
    );
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('passes bodyHtml through unescaped, by design (trusted pre-built HTML from callers)', () => {
    const html = renderEmailLayout(baseParams({ bodyHtml: '<p>Hello <strong>Ada</strong>, welcome.</p>' }));
    expect(html).toContain('<p>Hello <strong>Ada</strong>, welcome.</p>');
  });

  it('renders no button row when ctas is empty', () => {
    const html = renderEmailLayout(baseParams({ ctas: [] }));
    expect(html).not.toContain('<a href');
  });

  it('renders one button per cta, each with its own href', () => {
    const html = renderEmailLayout(
      baseParams({
        ctas: [
          { label: 'See my projects', href: 'https://juanpablo.info/en/projects/' },
          { label: 'Read the blog', href: 'https://juanpablo.info/en/blog/' },
          { label: 'Subscribe via RSS', href: 'https://juanpablo.info/en/rss.xml' },
        ],
      }),
    );
    expect(html).toContain('https://juanpablo.info/en/projects/');
    expect(html).toContain('https://juanpablo.info/en/blog/');
    expect(html).toContain('https://juanpablo.info/en/rss.xml');
    expect(html.match(/<a href/g)?.length).toBe(3);
  });

  it('never emits a <style> tag (most email clients strip it)', () => {
    const html = renderEmailLayout(baseParams());
    expect(html.toLowerCase()).not.toContain('<style');
  });

  it('never uses flex or grid CSS (unsupported by email clients)', () => {
    const html = renderEmailLayout(baseParams());
    expect(html).not.toMatch(/display:\s*flex/i);
    expect(html).not.toMatch(/display:\s*grid/i);
  });

  it('includes the footer note by default', () => {
    const html = renderEmailLayout(baseParams());
    expect(html).toMatch(/receiving this because you contacted/i);
  });

  it('omits the footer note row entirely when includeFooterNote is false', () => {
    const html = renderEmailLayout(baseParams({ includeFooterNote: false }));
    expect(html).not.toMatch(/receiving this because you contacted/i);
  });

  it('renders the preheader using the visually-hidden preview-text technique', () => {
    const html = renderEmailLayout(baseParams({ preheader: 'A short preview' }));
    // Real preheader convention: display:none + a near-zero font-size, so the
    // text is invisible in the email body but still readable by inbox preview
    // scrapers because it's the first text node in the document.
    expect(html).toMatch(/display:\s*none/i);
    expect(html).toMatch(/font-size:\s*1px/i);
    expect(html).toContain('A short preview');
  });

  it('escapes a script tag injected via letterhead', () => {
    const html = renderEmailLayout(baseParams({ letterhead: '<script>alert(1)</script>' }));
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('renders the letterhead once, above the card (outside its padded content region)', () => {
    const html = renderEmailLayout(baseParams({ letterhead: 'A Distinctive Letterhead Value' }));
    const letterheadIndex = html.indexOf('A Distinctive Letterhead Value');
    const cardContentIndex = html.indexOf('padding:32px; font-family');
    expect(letterheadIndex).toBeGreaterThan(-1);
    expect(cardContentIndex).toBeGreaterThan(-1);
    expect(letterheadIndex).toBeLessThan(cardContentIndex);
    expect(html.match(/A Distinctive Letterhead Value/g)?.length).toBe(1);
  });

  it('gives the card an accent top edge over a 1px border on the other sides', () => {
    const html = renderEmailLayout(baseParams());
    expect(html).toContain('border-top:3px solid #22d3ee');
  });

  it('gives CTA buttons a crisper 4px radius with a defining ink border', () => {
    const html = renderEmailLayout(
      baseParams({ ctas: [{ label: 'See my projects', href: 'https://juanpablo.info/en/projects/' }] }),
    );
    expect(html).toContain('border:1px solid #0a0a0a');
    expect(html).toContain('border-radius:4px');
  });
});
