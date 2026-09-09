// Same underscore-prefixed-directory reasoning as `_tests/contact.test.ts`:
// Astro treats every .ts file directly under src/pages as a page/endpoint
// regardless of its exports, so a co-located `admin-leads.test.ts` would be
// built as a bogus route. Vitest still discovers it by its `.test.ts` suffix.
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { APIContext } from 'astro';

const h = vi.hoisted(() => ({
  sql: vi.fn(async (_s: TemplateStringsArray, ..._v: unknown[]) => []),
}));
vi.mock('@neondatabase/serverless', () => ({ neon: () => h.sql }));

import { POST } from '../admin-leads';

function basicHeader(user: string, password: string): string {
  return `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`;
}

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

async function post(body: FormData, authHeader?: string): Promise<Response> {
  const headers: Record<string, string> = authHeader ? { authorization: authHeader } : {};
  const request = new Request('http://localhost/api/admin-leads', { method: 'POST', body, headers });
  // `Response.redirect()` (unlike Astro's real `context.redirect()`) rejects
  // a relative URL with `ERR_INVALID_URL` — build the Response by hand so
  // this mock accepts the same relative path the real handler passes.
  const redirect = (path: string, status = 302) => new Response(null, { status, headers: { location: path } });
  return POST({ request, redirect } as unknown as APIContext);
}

function stubAdminEnv() {
  vi.stubEnv('ADMIN_USER', 'admin');
  vi.stubEnv('ADMIN_PASSWORD', 'secret');
  vi.stubEnv('DATABASE_URL', 'postgres://test');
}

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe('POST /api/admin-leads', () => {
  it('returns 401 without credentials', async () => {
    stubAdminEnv();
    const res = await post(makeFormData({ leadId: '1', action: 'mark' }));
    expect(res.status).toBe(401);
    expect(h.sql).not.toHaveBeenCalled();
  });

  it('returns 401 with wrong credentials', async () => {
    stubAdminEnv();
    const res = await post(makeFormData({ leadId: '1', action: 'mark' }), basicHeader('admin', 'wrong'));
    expect(res.status).toBe(401);
    expect(h.sql).not.toHaveBeenCalled();
  });

  it('returns 400 for an invalid leadId', async () => {
    stubAdminEnv();
    const res = await post(makeFormData({ leadId: 'abc', action: 'mark' }), basicHeader('admin', 'secret'));
    expect(res.status).toBe(400);
    expect(h.sql).not.toHaveBeenCalled();
  });

  it('returns 400 for an invalid action', async () => {
    stubAdminEnv();
    const res = await post(makeFormData({ leadId: '1', action: 'delete' }), basicHeader('admin', 'secret'));
    expect(res.status).toBe(400);
    expect(h.sql).not.toHaveBeenCalled();
  });

  it('returns 500 when DATABASE_URL is unset', async () => {
    vi.stubEnv('ADMIN_USER', 'admin');
    vi.stubEnv('ADMIN_PASSWORD', 'secret');
    const res = await post(makeFormData({ leadId: '1', action: 'mark' }), basicHeader('admin', 'secret'));
    expect(res.status).toBe(500);
    expect(h.sql).not.toHaveBeenCalled();
  });

  it('marks a lead contacted and redirects with 303', async () => {
    stubAdminEnv();
    const res = await post(makeFormData({ leadId: '42', action: 'mark' }), basicHeader('admin', 'secret'));
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toContain('/admin#leads');
    expect(h.sql).toHaveBeenCalledTimes(1);
    const query = (h.sql.mock.calls[0][0] as TemplateStringsArray).join('');
    expect(query).toContain('SET contacted_at = now()');
    expect(h.sql.mock.calls[0][1]).toBe(42);
  });

  it('unmarks a lead and redirects with 303', async () => {
    stubAdminEnv();
    const res = await post(makeFormData({ leadId: '42', action: 'unmark' }), basicHeader('admin', 'secret'));
    expect(res.status).toBe(303);
    expect(h.sql).toHaveBeenCalledTimes(1);
    const query = (h.sql.mock.calls[0][0] as TemplateStringsArray).join('');
    expect(query).toContain('SET contacted_at = NULL');
    expect(h.sql.mock.calls[0][1]).toBe(42);
  });
});
