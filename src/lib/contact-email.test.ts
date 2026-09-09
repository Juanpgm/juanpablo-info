import { describe, expect, it } from 'vitest';
import {
  escapeHtml,
  buildOwnerNotification,
  buildSenderAcknowledgement,
  isVerifiedSender,
} from './contact-email';

const ADMIN_URL = 'https://juanpablo.info/admin#leads';

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
});

describe('buildSenderAcknowledgement', () => {
  it('does not mention attachments', () => {
    const result = buildSenderAcknowledgement({ name: 'Ada', locale: 'en' });
    // There is no message/attachments parameter on this function at all —
    // nothing beyond name + fixed copy should ever appear.
    expect(result.text).not.toMatch(/attachment/i);
    expect(result.html).not.toMatch(/attachment/i);
  });

  it('produces content in the requested locale', () => {
    const es = buildSenderAcknowledgement({ name: 'Ada', locale: 'es' });
    const en = buildSenderAcknowledgement({ name: 'Ada', locale: 'en' });
    expect(es.subject).not.toBe(en.subject);
  });

  it('falls back to en for an unknown locale', () => {
    const en = buildSenderAcknowledgement({ name: 'Ada', locale: 'en' });
    const unknown = buildSenderAcknowledgement({ name: 'Ada', locale: 'xx' });
    expect(unknown.subject).toBe(en.subject);
  });

  it('falls back to es as the last resort when called directly with es', () => {
    const result = buildSenderAcknowledgement({ name: 'Ada', locale: 'es' });
    expect(result.subject.length).toBeGreaterThan(0);
    expect(result.text.length).toBeGreaterThan(0);
  });

  it('escapes the name in html and strips CR/LF from the greeting', () => {
    const result = buildSenderAcknowledgement({ name: '<script>x\r\n</script>', locale: 'en' });
    expect(result.html).not.toContain('<script>x');
    expect(result.html).toContain('&lt;script&gt;x');
    expect(result.html).not.toContain('\r');
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
