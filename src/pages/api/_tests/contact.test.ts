// Lives under an underscore-prefixed directory (not directly in
// src/pages/api/) so Astro's file-based router ignores it. Astro treats
// EVERY .ts file directly under src/pages as a page/endpoint regardless of
// its exports (verified against astro/dist/core/util.js's isPublicRoute),
// so a co-located `contact.test.ts` was built as a bogus `/api/contact.test`
// route and crashed `astro build` (vi.mock/vi.hoisted only work inside
// vitest's own runtime). The `_` prefix is Astro's one documented exclusion
// mechanism for path segments under src/pages; vitest's default test glob
// still matches this file by its `.test.ts` suffix.
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { APIContext } from 'astro';
import { site } from '../../../data/site';

const h = vi.hoisted(() => ({
  sql: vi.fn(async (_s: TemplateStringsArray, ..._v: unknown[]) => []),
  // Typed with an explicit param + a data|error union (rather than the
  // plan's exact zero-arg, always-success signature) so `astro check` can
  // type mockResolvedValueOnce({ data: null, error: {...} }) calls and
  // mock.calls[i][0] payload inspection below — the plan's literal
  // `vi.fn(async () => ({ data: { id: 'x' }, error: null }))` infers a
  // zero-parameter, single-shape mock that both of those need.
  send: vi.fn(
    async (
      _payload: Record<string, unknown>
    ): Promise<{ data: { id: string } | null; error: { message: string } | null }> => ({
      data: { id: 'x' },
      error: null,
    })
  ),
  put: vi.fn(async () => ({ url: 'https://blob/x' })),
}));
vi.mock('@neondatabase/serverless', () => ({ neon: () => h.sql }));
// NOTE: the plan's suggested factory used an arrow function
// (`vi.fn(() => ({...}))`), but the real route calls `new Resend(...)` —
// arrow functions cannot be used as constructors (`Reflect.construct` throws
// `TypeError: ... is not a constructor`), which the route's own try/catch
// silently swallows as "Resend send threw" before ever reaching
// `emails.send`. Using a regular `function` keeps the exact same `h.send`
// binding while being constructible.
vi.mock('resend', () => ({
  Resend: vi.fn(function Resend() {
    return { emails: { send: h.send } };
  }),
}));
vi.mock('@vercel/blob', () => ({ put: h.put }));

import { POST } from '../contact';

const VALID_FIELDS = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'Hello, I saw your portfolio and would like to talk.',
  locale: 'en',
  website: '',
};

function makeFormData(overrides: Partial<typeof VALID_FIELDS> = {}, files: File[] = []): FormData {
  const fd = new FormData();
  const fields = { ...VALID_FIELDS, ...overrides };
  fd.set('name', fields.name);
  fd.set('email', fields.email);
  fd.set('message', fields.message);
  fd.set('locale', fields.locale);
  fd.set('website', fields.website);
  for (const file of files) fd.append('files', file);
  return fd;
}

function makeFile(name: string, sizeBytes: number, type: string): File {
  return new File([new Uint8Array(sizeBytes)], name, { type });
}

async function post(body: BodyInit, headers: Record<string, string> = {}): Promise<Response> {
  const request = new Request('http://localhost/api/contact', { method: 'POST', body, headers });
  return POST({ request } as unknown as APIContext);
}

function stubHappyPathEnv() {
  vi.stubEnv('DATABASE_URL', 'postgres://test');
  vi.stubEnv('RESEND_API_KEY', 're_test_key');
}

let errorSpy: ReturnType<typeof vi.spyOn>;

afterEach(() => {
  errorSpy?.mockRestore();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe('POST /api/contact', () => {
  it('returns 200 ok and skips DB/email/upload when the honeypot is filled', async () => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    stubHappyPathEnv();
    const res = await post(makeFormData({ website: 'https://spam.example' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(h.sql).not.toHaveBeenCalled();
    expect(h.send).not.toHaveBeenCalled();
    expect(h.put).not.toHaveBeenCalled();
  });

  it('returns 400 for a non-form body', async () => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await post(JSON.stringify({ name: 'x' }), { 'content-type': 'application/json' });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid form data');
  });

  it('returns 400 with messages joined by "; " for invalid fields', async () => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await post(makeFormData({ name: '', email: '', message: '' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Name is required; Email is required; Message is required');
  });

  it('rejects more than the allowed number of attachments', async () => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const files = Array.from({ length: 4 }, (_, i) => makeFile(`file-${i}.png`, 100, 'image/png'));
    const res = await post(makeFormData({}, files));
    expect(res.status).toBe(400);
    expect(h.put).not.toHaveBeenCalled();
  });

  it('rejects an attachment over the per-file size limit', async () => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const files = [makeFile('huge.png', 4 * 1024 * 1024, 'image/png')];
    const res = await post(makeFormData({}, files));
    expect(res.status).toBe(400);
    expect(h.put).not.toHaveBeenCalled();
  });

  it('rejects a disallowed attachment file type', async () => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const files = [makeFile('virus.exe', 100, 'application/x-msdownload')];
    const res = await post(makeFormData({}, files));
    expect(res.status).toBe(400);
    expect(h.put).not.toHaveBeenCalled();
  });

  it('returns 500 Server misconfiguration when DATABASE_URL is unset', async () => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubEnv('RESEND_API_KEY', 're_test_key');
    const res = await post(makeFormData());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Server misconfiguration');
  });

  it('still sends the owner notification once when the DB insert throws (500 to the client)', async () => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    stubHappyPathEnv();
    h.sql.mockRejectedValueOnce(new Error('db down'));
    const res = await post(makeFormData());
    expect(res.status).toBe(500);
    expect(h.send).toHaveBeenCalledTimes(1);
  });

  it('never sends the acknowledgement when the DB insert failed, even with a verified sender', async () => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    stubHappyPathEnv();
    vi.stubEnv('CONTACT_FROM_EMAIL', 'Juan Pablo <contacto@juanpablo.info>');
    h.sql.mockRejectedValueOnce(new Error('db down'));
    const res = await post(makeFormData());
    expect(res.status).toBe(500);
    // Only the owner notification fires — the acknowledgement must be gated
    // on a stored lead, not just a delivered owner notification.
    expect(h.send).toHaveBeenCalledTimes(1);
  });

  it('returns 200 and logs "Resend send failed" when Resend resolves an error', async () => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    stubHappyPathEnv();
    h.send.mockResolvedValueOnce({ data: null, error: { message: 'bounced' } });
    const res = await post(makeFormData());
    expect(res.status).toBe(200);
    expect(h.send).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Resend send failed'), expect.anything());
  });

  it('returns 200 and logs "Resend send threw" when Resend throws', async () => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    stubHappyPathEnv();
    h.send.mockRejectedValueOnce(new Error('network error'));
    const res = await post(makeFormData());
    expect(res.status).toBe(200);
    expect(h.send).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Resend send threw'), expect.anything());
  });

  it('returns 200 when the owner notification succeeds but the acknowledgement rejects', async () => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    stubHappyPathEnv();
    vi.stubEnv('CONTACT_FROM_EMAIL', 'Juan Pablo <contacto@juanpablo.info>');
    h.send.mockResolvedValueOnce({ data: { id: 'owner' }, error: null });
    h.send.mockRejectedValueOnce(new Error('ack failed'));
    const res = await post(makeFormData());
    expect(res.status).toBe(200);
    expect(h.send).toHaveBeenCalledTimes(2);
  });

  it('never attempts the acknowledgement when the owner notification fails', async () => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    stubHappyPathEnv();
    vi.stubEnv('CONTACT_FROM_EMAIL', 'Juan Pablo <contacto@juanpablo.info>');
    h.send.mockResolvedValueOnce({ data: null, error: { message: 'bounced' } });
    const res = await post(makeFormData());
    expect(res.status).toBe(200);
    expect(h.send).toHaveBeenCalledTimes(1);
  });

  it('keeps a partial upload: one of two attachments fails, DB and email reflect only the uploaded one', async () => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    stubHappyPathEnv();
    h.put.mockRejectedValueOnce(new Error('blob down'));
    h.put.mockResolvedValueOnce({ url: 'https://blob/second' });
    const files = [makeFile('first.png', 100, 'image/png'), makeFile('second.png', 100, 'image/png')];
    const res = await post(makeFormData({}, files));
    expect(res.status).toBe(200);
    const insertedValues = h.sql.mock.calls[0].slice(1);
    const attachmentUrls = insertedValues[4] as string[];
    expect(attachmentUrls).toHaveLength(1);
    const ownerCall = h.send.mock.calls[0][0] as { attachments: unknown[] };
    expect(ownerCall.attachments).toHaveLength(1);
  });

  it('returns 200 and logs "RESEND_API_KEY is not set" when the key is missing', async () => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubEnv('DATABASE_URL', 'postgres://test');
    const res = await post(makeFormData());
    expect(res.status).toBe(200);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('RESEND_API_KEY is not set'));
  });

  it('falls back to the sandbox sender and sends no acknowledgement when CONTACT_FROM_EMAIL is unset', async () => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    stubHappyPathEnv();
    const res = await post(makeFormData());
    expect(res.status).toBe(200);
    expect(h.send).toHaveBeenCalledTimes(1);
    const ownerCall = h.send.mock.calls[0][0] as { from: string };
    expect(ownerCall.from).toBe('Portafolio <onboarding@resend.dev>');
  });

  it('sends an acknowledgement from the configured sender without leaking the submitted message', async () => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    stubHappyPathEnv();
    vi.stubEnv('CONTACT_FROM_EMAIL', 'Juan Pablo <contacto@juanpablo.info>');
    const res = await post(makeFormData());
    expect(res.status).toBe(200);
    expect(h.send).toHaveBeenCalledTimes(2);
    const ackCall = h.send.mock.calls[1][0] as { to: string; replyTo: string; from: string; text: string; html: string };
    expect(ackCall.to).toBe(VALID_FIELDS.email);
    expect(ackCall.replyTo).toBe(site.email);
    expect(ackCall.from).toBe('Juan Pablo <contacto@juanpablo.info>');
    expect(ackCall.text).not.toContain(VALID_FIELDS.message);
    expect(ackCall.html).not.toContain(VALID_FIELDS.message);
  });

  it('sends the owner notification to site.email, reply-to the submitter, with a locale-prefixed subject', async () => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    stubHappyPathEnv();
    const res = await post(makeFormData({ locale: 'en' }));
    expect(res.status).toBe(200);
    const ownerCall = h.send.mock.calls[0][0] as { to: string; replyTo: string; subject: string };
    expect(ownerCall.to).toBe(site.email);
    expect(ownerCall.replyTo).toBe(VALID_FIELDS.email);
    expect(ownerCall.subject.startsWith('[Lead · EN]')).toBe(true);
  });
});
