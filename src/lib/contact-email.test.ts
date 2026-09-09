import { describe, expect, it } from 'vitest';
import {
  escapeHtml,
  buildOwnerNotification,
  buildSenderAcknowledgement,
  isVerifiedSender,
} from './contact-email';

const ADMIN_URL = 'https://juanpablo.info/admin#leads';
const SITE_URL = 'https://juanpablo.info';
const FIXED_DATE = new Date('2026-09-09T12:00:00Z');

function baseOwnerParams(overrides: Partial<Parameters<typeof buildOwnerNotification>[0]> = {}) {
  return {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    message: 'Hello, I saw your portfolio and would like to talk.',
    locale: 'en',
    attachments: [] as { filename: string }[],
    adminUrl: ADMIN_URL,
    ...overrides,
  };
}

function baseAckParams(overrides: Partial<Parameters<typeof buildSenderAcknowledgement>[0]> = {}) {
  return {
    name: 'Ada',
    locale: 'en',
    siteUrl: SITE_URL,
    leadId: 42,
    receivedAt: FIXED_DATE,
    ...overrides,
  };
}

describe('escapeHtml', () => {
  it('escapes &, <, >, ", and \'', () => {
    expect(escapeHtml('& < > " \'')).toBe('&amp; &lt; &gt; &quot; &#39;');
  });

  it('escapes a script tag payload', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });
});

describe('buildOwnerNotification', () => {
  it('lists "No attachments" in html and text when there are none', () => {
    const result = buildOwnerNotification(baseOwnerParams());
    expect(result.html).toContain('No attachments');
    expect(result.text.toLowerCase()).toContain('no attachments');
  });

  it('lists filenames when there are two attachments', () => {
    const result = buildOwnerNotification(
      baseOwnerParams({ attachments: [{ filename: 'photo.png' }, { filename: 'brief.pdf' }] })
    );
    expect(result.html).toContain('photo.png');
    expect(result.html).toContain('brief.pdf');
    expect(result.text).toContain('photo.png');
    expect(result.text).toContain('brief.pdf');
  });

  it('escapes attachment filenames in html', () => {
    const result = buildOwnerNotification(
      baseOwnerParams({ attachments: [{ filename: '<script>.png' }] })
    );
    expect(result.html).not.toContain('<script>.png');
    expect(result.html).toContain('&lt;script&gt;.png');
  });

  it('truncates the subject preview at exactly 60 code points and appends an ellipsis', () => {
    const message = 'a'.repeat(65);
    const result = buildOwnerNotification(baseOwnerParams({ message }));
    expect(result.subject).toContain(`"${'a'.repeat(60)}…"`);
  });

  it('does not append an ellipsis when the message is 60 code points or fewer', () => {
    const message = 'a'.repeat(60);
    const result = buildOwnerNotification(baseOwnerParams({ message }));
    expect(result.subject).toContain(`"${'a'.repeat(60)}"`);
    expect(result.subject).not.toContain('…');
  });

  it('collapses CRLF in the name into a single-line subject', () => {
    const result = buildOwnerNotification(baseOwnerParams({ name: 'Ada\r\nLovelace' }));
    expect(result.subject).not.toContain('\r');
    expect(result.subject).not.toContain('\n');
    expect(result.subject).toContain('Ada Lovelace');
  });

  it('produces a subject for a whitespace-only name without throwing', () => {
    const result = buildOwnerNotification(baseOwnerParams({ name: '   ' }));
    expect(result.subject).toContain('[Lead · EN]');
  });

  it('handles a 5000-character message', () => {
    const message = 'x'.repeat(5000);
    const result = buildOwnerNotification(baseOwnerParams({ message }));
    expect(result.text).toContain(message);
    expect(result.html.length).toBeGreaterThan(5000);
  });

  it('converts CRLF and LF newlines in the message to <br> in html', () => {
    const result = buildOwnerNotification(baseOwnerParams({ message: 'line one\r\nline two\nline three' }));
    expect(result.html).toContain('line one<br>line two<br>line three');
  });

  it('builds a mailto reply link with an encoded subject and no raw ampersands', () => {
    const result = buildOwnerNotification(baseOwnerParams());
    expect(result.html).toContain('mailto:ada@example.com?subject=');
    expect(result.html).toContain('%20');
    const mailtoMatch = result.html.match(/href="([^"]*mailto:[^"]*)"/);
    expect(mailtoMatch).not.toBeNull();
    const href = mailtoMatch![1];
    // Every literal & in the href must be escaped as &amp; (no raw & survives).
    expect(href.replace(/&amp;/g, '')).not.toContain('&');
  });

  it('includes a link to the admin url', () => {
    const result = buildOwnerNotification(baseOwnerParams());
    expect(result.html).toContain(ADMIN_URL);
    expect(result.text).toContain(ADMIN_URL);
  });

  it('escapes name, email, and message in html', () => {
    const result = buildOwnerNotification(
      baseOwnerParams({
        name: '<b>Ada</b>',
        email: 'ada@example.com',
        message: 'Hello & welcome <to> "quotes" \'here\'',
      })
    );
    expect(result.html).not.toContain('<b>Ada</b>');
    expect(result.html).toContain('&lt;b&gt;Ada&lt;/b&gt;');
    expect(result.html).toContain('&amp;');
    expect(result.html).toContain('&quot;quotes&quot;');
  });

  it('uses the uppercased locale in the subject prefix', () => {
    const result = buildOwnerNotification(baseOwnerParams({ locale: 'es' }));
    expect(result.subject.startsWith('[Lead · ES]')).toBe(true);
  });

  it('produces a single-line subject even when locale contains CRLF', () => {
    const result = buildOwnerNotification(baseOwnerParams({ locale: 'en\r\nBcc: x@y.z' }));
    expect(result.subject).not.toContain('\r');
    expect(result.subject).not.toContain('\n');
  });

  it('wraps the body in the branded email layout with no marketing CTAs', () => {
    const result = buildOwnerNotification(baseOwnerParams());
    expect(result.html).toContain('<!doctype html>');
    expect(result.html.toLowerCase()).not.toContain('<style');
    // ctas: [] for the owner's own lead notification — Reply/Open admin stay
    // as plain links inside bodyHtml, no marketing buttons are added.
    expect(result.html).not.toContain('See my projects');
    expect(result.html).not.toContain('Read the blog');
    expect(result.html).not.toContain('Subscribe via RSS');
  });

  it('does not tell the owner they contacted themselves (footer note is submitter-only)', () => {
    const result = buildOwnerNotification(baseOwnerParams());
    expect(result.html).not.toMatch(/receiving this because you contacted/i);
  });

  it('carries the fixed lead-notification letterhead and no memo/stamp system (ack-only)', () => {
    const result = buildOwnerNotification(baseOwnerParams());
    expect(result.html).toContain('LEAD NOTIFICATION');
    expect(result.html).not.toContain('✓');
    expect(result.html).not.toContain('REF-');
  });
});

describe('buildSenderAcknowledgement', () => {
  it('does not mention attachments', () => {
    const result = buildSenderAcknowledgement(baseAckParams());
    // There is no message/attachments parameter on this function at all —
    // nothing beyond name + fixed copy should ever appear.
    expect(result.text).not.toMatch(/attachment/i);
    expect(result.html).not.toMatch(/attachment/i);
  });

  it('produces content in the requested locale', () => {
    const es = buildSenderAcknowledgement(baseAckParams({ locale: 'es' }));
    const en = buildSenderAcknowledgement(baseAckParams({ locale: 'en' }));
    expect(es.subject).not.toBe(en.subject);
  });

  it('falls back to es (the site default locale) for an unknown locale', () => {
    // Matches `normalizeLocale`'s own contract (same fallback
    // `validateContactSubmission` already applies to the route's incoming
    // `locale` field) — 'es' is `astro.config.mjs`'s `defaultLocale`, not an
    // arbitrary choice.
    const es = buildSenderAcknowledgement(baseAckParams({ locale: 'es' }));
    const unknown = buildSenderAcknowledgement(baseAckParams({ locale: 'xx' }));
    expect(unknown.subject).toBe(es.subject);
  });

  it('produces content when called directly with es', () => {
    const result = buildSenderAcknowledgement(baseAckParams({ locale: 'es' }));
    expect(result.subject.length).toBeGreaterThan(0);
    expect(result.text.length).toBeGreaterThan(0);
  });

  it('escapes the name in html and strips CR/LF from the greeting', () => {
    const result = buildSenderAcknowledgement(baseAckParams({ name: '<script>x\r\n</script>' }));
    expect(result.html).not.toContain('<script>x');
    expect(result.html).toContain('&lt;script&gt;x');
    expect(result.html).not.toContain('\r');
  });

  it('wraps the body in the branded email layout', () => {
    const result = buildSenderAcknowledgement(baseAckParams());
    expect(result.html).toContain('<!doctype html>');
    expect(result.html.toLowerCase()).not.toContain('<style');
  });

  it('includes all three localized CTA links, resolved against siteUrl and locale', () => {
    const result = buildSenderAcknowledgement(baseAckParams());
    expect(result.html).toContain('https://juanpablo.info/en/projects/');
    expect(result.html).toContain('https://juanpablo.info/en/blog/');
    expect(result.html).toContain('https://juanpablo.info/en/rss.xml');
    // Plain-text mirror of the same three links, appended at the end of `text`.
    expect(result.text).toContain('https://juanpablo.info/en/projects/');
    expect(result.text).toContain('https://juanpablo.info/en/blog/');
    expect(result.text).toContain('https://juanpablo.info/en/rss.xml');
  });

  it('normalizes an unknown locale so copy, CTA links, and lang all agree (falls back to es)', () => {
    // Regression guard: locale used to flow into `resolveAckCopy`/
    // `resolveEmailCtaCopy` (each with its own internal en/es fallback) and
    // into the CTA hrefs/layout `lang` completely unvalidated, so an unknown
    // locale like 'xx' could in principle produce copy in one language
    // wrapped around a 404ing `/xx/projects/` link and a mismatched
    // `<html lang="xx">`. Normalizing once up front keeps all three in sync,
    // and to the same fallback ('es') the rest of the app already uses.
    const result = buildSenderAcknowledgement(baseAckParams({ locale: 'xx' }));
    expect(result.html).not.toContain('/xx/');
    expect(result.html).toContain('lang="es"');
    expect(result.html).toContain('https://juanpablo.info/es/projects/');
  });

  it('resolves CTA links for the requested locale, not a hardcoded one', () => {
    const result = buildSenderAcknowledgement(baseAckParams({ locale: 'es' }));
    expect(result.html).toContain('https://juanpablo.info/es/projects/');
    expect(result.html).toContain('https://juanpablo.info/es/blog/');
    expect(result.html).toContain('https://juanpablo.info/es/rss.xml');
  });

  it('never contains submitted message or attachment content (anti-backscatter)', () => {
    // This function still has no message/attachments parameter — adding the
    // CTA layout must not change that. Guards against a future signature
    // change accidentally leaking submitted content into a reply-to-nobody
    // acknowledgement email.
    const result = buildSenderAcknowledgement(baseAckParams());
    expect(result.html).not.toMatch(/attachment/i);
    expect(result.text).not.toMatch(/attachment/i);
  });

  it('shows the zero-padded reference code derived from the lead id in the memo header', () => {
    const result = buildSenderAcknowledgement(baseAckParams({ leadId: 42 }));
    expect(result.html).toContain('REF-000042');
  });

  it('zero-pads a leadId of 0 correctly', () => {
    const result = buildSenderAcknowledgement(baseAckParams({ leadId: 0 }));
    expect(result.html).toContain('REF-000000');
  });

  it('includes the REF code in the plaintext body too, not just html', () => {
    // A plaintext-only mail client never sees the HTML memo header — the
    // whole point of a *real* reference number is that it's citable, so it
    // must survive there as well.
    const result = buildSenderAcknowledgement(baseAckParams({ leadId: 42 }));
    expect(result.text).toContain('REF-000042');
  });

  it('shows the escaped submitter name next to the TO label in the memo header', () => {
    const result = buildSenderAcknowledgement(baseAckParams({ name: '<script>Ada</script>' }));
    expect(result.html).toContain('&lt;script&gt;Ada&lt;/script&gt;');
  });

  it('shows a formatted received date derived from receivedAt in the memo header', () => {
    const result = buildSenderAcknowledgement(baseAckParams({ locale: 'en', receivedAt: FIXED_DATE }));
    const expectedDate = new Intl.DateTimeFormat('en', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'America/Bogota',
    }).format(FIXED_DATE);
    expect(result.html).toContain(expectedDate);
  });

  it('shows the received-badge stamp with a leading checkmark', () => {
    const result = buildSenderAcknowledgement(baseAckParams({ locale: 'en' }));
    expect(result.html).toContain('✓ MESSAGE RECEIVED');
  });

  it('prefixes CTA labels with a leading arrow', () => {
    const result = buildSenderAcknowledgement(baseAckParams({ locale: 'en' }));
    expect(result.html).toContain('→ See my projects');
    expect(result.text).toContain('→ See my projects');
  });

  it('renders the CTA eyebrow text', () => {
    const result = buildSenderAcknowledgement(baseAckParams({ locale: 'en' }));
    expect(result.html).toContain('IN THE MEANTIME');
  });

  it('passes the locale letterhead through to the layout', () => {
    const result = buildSenderAcknowledgement(baseAckParams({ locale: 'en' }));
    expect(result.html).toContain('JUAN PABLO GUZMÁN MARTÍNEZ · PORTFOLIO');
  });
});

describe('isVerifiedSender', () => {
  it('returns false for undefined', () => {
    expect(isVerifiedSender(undefined)).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isVerifiedSender('')).toBe(false);
  });

  it('returns false for a resend.dev sandbox sender', () => {
    expect(isVerifiedSender('Portafolio <onboarding@resend.dev>')).toBe(false);
  });

  it('returns true for a verified custom-domain sender', () => {
    expect(isVerifiedSender('Juan <contacto@juanpablo.info>')).toBe(true);
  });
});
