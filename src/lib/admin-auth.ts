/**
 * HTTP Basic Auth check for the admin surface, shared by `pages/admin.astro`
 * (GET, page render) and `pages/api/admin-leads.ts` (POST, the lead
 * follow-up toggle) — extracted so both trust boundaries run the exact same
 * check instead of two copies drifting apart. Not fully pure (reads
 * `process.env`), but has no other I/O and is safe to unit-test directly.
 */
import { createHash, timingSafeEqual } from 'node:crypto';

function safeEqual(a: string, b: string): boolean {
  // Hash both sides to a fixed-length digest first so a length mismatch
  // can't short-circuit timingSafeEqual (which throws on unequal lengths)
  // and doesn't leak length via timing either.
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function isAuthorized(request: Request): boolean {
  const expectedUser = process.env.ADMIN_USER;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedUser || !expectedPassword) return false;

  const header = request.headers.get('authorization') ?? '';
  const [scheme, encoded] = header.split(' ');
  if (scheme !== 'Basic' || !encoded) return false;

  const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
  const sepIndex = decoded.indexOf(':');
  if (sepIndex === -1) return false;
  const user = decoded.slice(0, sepIndex);
  const password = decoded.slice(sepIndex + 1);

  return safeEqual(user, expectedUser) && safeEqual(password, expectedPassword);
}
