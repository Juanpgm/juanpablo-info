import type { APIRoute } from 'astro';
import { neon } from '@neondatabase/serverless';
import { isAuthorized } from '../../lib/admin-auth';
import { parseLeadId, resolveContactedAction } from '../../lib/admin-leads';

// The lead follow-up toggle (see admin.astro's leads table). A `.astro`
// page's own exported `GET`/`POST` handlers are NOT actually routed by
// Astro — only files under `src/pages/**/*.ts` are real endpoints (verified
// against the build manifest: a page route is `type:"page"` and only
// `renderPage`s the component; `type:"endpoint"` is what
// `renderEndpoint`/method-dispatch actually runs). An earlier version of
// this feature exported `POST` from `admin.astro` itself, which silently
// did nothing — the form just re-rendered the page. This file is the real,
// routed endpoint; admin.astro's leads table form posts here.
export const prerender = false;

export const POST: APIRoute = async ({ request, redirect }) => {
  if (!isAuthorized(request)) {
    return new Response('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Admin"' },
    });
  }

  const formData = await request.formData();
  const leadId = parseLeadId(formData.get('leadId'));
  const action = resolveContactedAction(formData.get('action'));
  if (leadId === null || action === null) {
    return new Response('Invalid request', { status: 400 });
  }

  if (!process.env.DATABASE_URL) {
    return new Response('Server misconfiguration', { status: 500 });
  }

  // Per-request instantiation (never module top-level), same reasoning as
  // pages/api/contact.ts: a missing DATABASE_URL must never crash
  // prerendering of any other static page at build time.
  const sql = neon(process.env.DATABASE_URL);

  if (action === 'mark') {
    await sql`UPDATE contact_submissions SET contacted_at = now() WHERE id = ${leadId}`;
  } else {
    await sql`UPDATE contact_submissions SET contacted_at = NULL WHERE id = ${leadId}`;
  }

  return redirect('/admin#leads', 303);
};
