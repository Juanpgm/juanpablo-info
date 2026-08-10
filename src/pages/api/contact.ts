import type { APIRoute } from 'astro';
import { neon } from '@neondatabase/serverless';
import { Resend } from 'resend';
import { put } from '@vercel/blob';
import { validateContactSubmission, validateAttachments } from '../../lib/contact-form';

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

// Filenames land straight in a Blob pathname (and, indirectly, the notified
// email subject/body) — collapse anything outside a conservative safe set so
// a hostile filename can't inject path segments or odd bytes into storage.
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-]/g, '_').slice(-100);
}

interface UploadedAttachment {
  url: string;
  filename: string;
  buffer: Buffer;
  contentType: string;
}

// Best-effort per file: a single failed upload (e.g. a transient Blob error)
// shouldn't sink the whole submission — the submitter's message is still the
// primary thing being captured. Failures are logged and the file is simply
// omitted from both the DB record and the email.
async function uploadAttachments(files: File[]): Promise<UploadedAttachment[]> {
  const uploaded: UploadedAttachment[] = [];
  for (const [index, file] of files.entries()) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const pathname = `contact-uploads/${Date.now()}-${index}-${sanitizeFilename(file.name)}`;
      const blob = await put(pathname, buffer, {
        access: 'private',
        contentType: file.type || undefined,
      });
      uploaded.push({
        url: blob.url,
        filename: file.name,
        buffer,
        contentType: file.type || 'application/octet-stream',
      });
    } catch (error) {
      console.error('[contact] Attachment upload failed for', file.name, error);
    }
  }
  return uploaded;
}

export const POST: APIRoute = async ({ request }) => {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ ok: false, error: 'Invalid form data' }, 400);
  }

  const result = validateContactSubmission({
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
    website: formData.get('website'),
    locale: formData.get('locale'),
  });
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

  // Files can't go through JSON — the client sends real multipart/form-data,
  // parsed above. Re-validate server-side: the client's own check (same pure
  // function) is UX only, never trusted alone.
  const files = formData.getAll('files').filter((entry): entry is File => entry instanceof File && entry.size > 0);
  const attachmentsResult = validateAttachments(files.map((f) => ({ name: f.name, size: f.size, type: f.type })));
  if (!attachmentsResult.valid) {
    return json({ ok: false, error: attachmentsResult.errors.join('; ') }, 400);
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

  // Blob store (private access) is populated before the DB write so the
  // stored `attachment_urls` reflects exactly what actually made it to
  // storage — a file that fails to upload is silently dropped (see
  // uploadAttachments), never referenced by a URL that doesn't exist.
  const uploaded = await uploadAttachments(files);
  const attachmentUrls = uploaded.map((u) => u.url);

  let dbOk = false;
  try {
    await sql`
      INSERT INTO contact_submissions (name, email, message, locale, attachment_urls)
      VALUES (${name}, ${email}, ${message}, ${locale}, ${attachmentUrls})
    `;
    dbOk = true;
  } catch (error) {
    console.error('[contact] DB insert failed:', error);
  }

  let emailOk = false;
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      // The Blob store is private (deliberate — these are unsolicited
      // uploads from strangers), so a bare URL wouldn't be openable from the
      // email without the read token anyway. Attach the actual file content
      // (already buffered above for the upload) instead of just linking.
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: NOTIFY_EMAIL,
        replyTo: email,
        subject: `New portfolio contact from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\nLocale: ${locale}\n\n${message}`,
        attachments: uploaded.map((u) => ({
          content: u.buffer,
          filename: u.filename,
          contentType: u.contentType,
        })),
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
