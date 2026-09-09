import { afterEach, describe, expect, it, vi } from 'vitest';
import { isAuthorized } from './admin-auth';

function basicHeader(user: string, password: string): string {
  return `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`;
}

function request(headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/admin', { headers });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('isAuthorized', () => {
  it('rejects when ADMIN_USER/ADMIN_PASSWORD are unset, even with correct-looking creds', () => {
    const req = request({ authorization: basicHeader('admin', 'secret') });
    expect(isAuthorized(req)).toBe(false);
  });

  it('rejects when only ADMIN_USER is set', () => {
    vi.stubEnv('ADMIN_USER', 'admin');
    const req = request({ authorization: basicHeader('admin', 'secret') });
    expect(isAuthorized(req)).toBe(false);
  });

  it('accepts correct credentials', () => {
    vi.stubEnv('ADMIN_USER', 'admin');
    vi.stubEnv('ADMIN_PASSWORD', 'secret');
    const req = request({ authorization: basicHeader('admin', 'secret') });
    expect(isAuthorized(req)).toBe(true);
  });

  it('rejects a wrong password', () => {
    vi.stubEnv('ADMIN_USER', 'admin');
    vi.stubEnv('ADMIN_PASSWORD', 'secret');
    const req = request({ authorization: basicHeader('admin', 'wrong') });
    expect(isAuthorized(req)).toBe(false);
  });

  it('rejects a wrong user', () => {
    vi.stubEnv('ADMIN_USER', 'admin');
    vi.stubEnv('ADMIN_PASSWORD', 'secret');
    const req = request({ authorization: basicHeader('someone-else', 'secret') });
    expect(isAuthorized(req)).toBe(false);
  });

  it('rejects a missing authorization header', () => {
    vi.stubEnv('ADMIN_USER', 'admin');
    vi.stubEnv('ADMIN_PASSWORD', 'secret');
    expect(isAuthorized(request())).toBe(false);
  });

  it('rejects a non-Basic scheme', () => {
    vi.stubEnv('ADMIN_USER', 'admin');
    vi.stubEnv('ADMIN_PASSWORD', 'secret');
    const req = request({ authorization: 'Bearer sometoken' });
    expect(isAuthorized(req)).toBe(false);
  });

  it('rejects malformed base64 without throwing', () => {
    vi.stubEnv('ADMIN_USER', 'admin');
    vi.stubEnv('ADMIN_PASSWORD', 'secret');
    const req = request({ authorization: 'Basic not-valid-base64!!!' });
    expect(() => isAuthorized(req)).not.toThrow();
    expect(isAuthorized(req)).toBe(false);
  });

  it('rejects a decoded value with no colon separator', () => {
    vi.stubEnv('ADMIN_USER', 'admin');
    vi.stubEnv('ADMIN_PASSWORD', 'secret');
    const req = request({ authorization: `Basic ${Buffer.from('no-colon-here').toString('base64')}` });
    expect(isAuthorized(req)).toBe(false);
  });

  it('accepts a password that itself contains a colon (splits on the first colon only)', () => {
    vi.stubEnv('ADMIN_USER', 'admin');
    vi.stubEnv('ADMIN_PASSWORD', 'sec:ret');
    const req = request({ authorization: basicHeader('admin', 'sec:ret') });
    expect(isAuthorized(req)).toBe(true);
  });
});
