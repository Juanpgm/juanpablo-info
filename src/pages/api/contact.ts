import type { APIRoute } from 'astro';
import { neon } from '@neondatabase/serverless';
import { Resend } from 'resend';
import { validateContactSubmission } from '../../lib/contact-form';

// This is the site's ONE server-rendered route (design ADR A1 keeps the rest
// static). `prerender = false` opts only this file out, so the Vercel
// adapter emits it as a serverless function while every other page stays a
// prerendered static HTML file — verified in the build output, see
// apply-progress.
export const prerender = false;

const NOTIFY_EMAIL = 'juanp.gzmz@gmail.com';
// Verified domain per orchestrator (juanpablo.info). Sanity-checked at
// send-time below — if Resend rejects this exact address, the error is
// logged verbatim server-side so it's debuggable/fixable.
const FROM_EMAIL = 'Portafolio <contacto@juanpablo.info>';

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON body' }, 400);
  }

  const result = validateContactSubmission(body);
  if (!result.valid) {
    return json({ ok: false, error: result.errors.join('; ') }, 400);
  }

  const { name, email, message, locale, honeypot } = result.data;

  // Honeypot tripped: return the exact same success shape as a real
  // submission, but skip the DB write and the email entirely. Never tell a
  // bot it was caught — standard honeypot practice.
  if (honeypot) {
    return json({ ok: true }, 200);
  }

  if (!process.env.DATABASE_URL) {
    // Missing env var at *request* time, not build time — other prerendered
    // pages are unaffected either way, but this request can't be fulfilled.
    console.error('[contact] DATABASE_URL is not set — cannot store submission');
    return json({ ok: false, error: 'Server misconfiguration' }, 500);
  }

  // neon() is instantiated per-request inside the handler (never at module
  // top-level) so a missing env var can never crash prerendering of any
  // other static page at build time.
  const sql = neon(process.env.DATABASE_URL);

  let dbOk = false;
  try {
    await sql`
      INSERT INTO contact_submissions (name, email, message, locale)
      VALUES (${name}, ${email}, ${message}, ${locale})
    `;
    dbOk = true;
  } catch (error) {
    console.error('[contact] DB insert failed:', error);
  }

  let emailOk = false;
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: NOTIFY_EMAIL,
        replyTo: email,
        subject: `New portfolio contact from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\nLocale: ${locale}\n\n${message}`,
      });
      if (error) {
        console.error('[contact] Resend send failed:', error);
      } else {
        emailOk = true;
      }
    } catch (error) {
      console.error('[contact] Resend send threw:', error);
    }
  } else {
    console.error('[contact] RESEND_API_KEY is not set — skipping email notification');
  }

  // Success semantics: the submitter's data being safely recorded is what
  // matters most (this form exists to capture the lead, not just to ping an
  // inbox). A successful DB write is a 200 even if the email notification
  // failed — the message is not lost, and the failure is still logged above
  // for debugging. Only a failed DB write fails the whole request: without
  // it, a submitter who got an "error" would be justified in retrying, and
  // one who got "success" with no record anywhere would have no recourse.
  if (!dbOk) {
    return json(
      { ok: false, error: 'Could not save your message. Please try again or email me directly.' },
      500
    );
  }

  if (!emailOk) {
    console.error('[contact] Submission stored but email notification failed for', email);
  }

  return json({ ok: true }, 200);
};
