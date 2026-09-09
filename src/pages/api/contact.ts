import type { APIRoute } from 'astro';
import { neon } from '@neondatabase/serverless';
import { Resend } from 'resend';
import { put } from '@vercel/blob';
import { validateContactSubmission, validateAttachments } from '../../lib/contact-form';
import { buildOwnerNotification, buildSenderAcknowledgement, isVerifiedSender } from '../../lib/contact-email';
import { site } from '../../data/site';

// One of a small set of server-rendered routes (design ADR A1 keeps the rest
// static; `admin.astro` is the other). `prerender = false` opts only this
// file out, so the Vercel adapter emits it as a serverless function while
// every other page stays a prerendered static HTML file — verified in the
// build output, see apply-progress.
export const prerender = false;

const NOTIFY_EMAIL = site.email;
const ADMIN_LEADS_URL = 'https://juanpablo.info/admin#leads';
const SITE_URL = 'https://juanpablo.info';

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

// Filenames land in the Blob pathname and, from there, in the owner
// notification's email body and attachment name — never in the subject
// (which is built solely from name/locale/message preview) — so collapse
// anything outside a conservative safe set so a hostile filename can't
// inject path segments or odd bytes into storage or the email.
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
      const safeFilename = sanitizeFilename(file.name);
      const pathname = `contact-uploads/${Date.now()}-${index}-${safeFilename}`;
      const blob = await put(pathname, buffer, {
        access: 'private',
        contentType: file.type || undefined,
      });
      uploaded.push({
        url: blob.url,
        filename: safeFilename,
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
    return json({ ok: false, error: result.errors.map((e) => e.message).join('; ') }, 400);
  }

  const { name, email, message, locale, honeypot } = result.data;

  // Read per-request (not at module top-level): the domain must be verified
  // in Resend before a custom `contacto@juanpablo.info`-style address can
  // send to third parties (see isVerifiedSender below). Until then this
  // falls back to Resend's sandbox sender, which only delivers to the Resend
  // account owner — fine for the owner notification, but the sender
  // acknowledgement to the submitter is skipped in that case.
  const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'Portafolio <onboarding@resend.dev>';

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

  // Same reasoning as `sql` above, plus: one client is reused for both the
  // owner notification and the sender acknowledgement below instead of
  // constructing a new Resend instance per email.
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

  // Blob store (private access) is populated before the DB write so the
  // stored `attachment_urls` reflects exactly what actually made it to
  // storage — a file that fails to upload is silently dropped (see
  // uploadAttachments), never referenced by a URL that doesn't exist.
  const uploaded = await uploadAttachments(files);
  const attachmentUrls = uploaded.map((u) => u.url);

  let dbOk = false;
  let leadId: number | undefined;
  try {
    const [inserted] = await sql`
      INSERT INTO contact_submissions (name, email, message, locale, attachment_urls)
      VALUES (${name}, ${email}, ${message}, ${locale}, ${attachmentUrls})
      RETURNING id
    `;
    // Guard the shape, not just presence: `inserted` being truthy doesn't
    // guarantee `id` is a real number — without this, a malformed RETURNING
    // row would still flip `dbOk` true (the row genuinely was inserted) while
    // downstream `buildRefCode` silently produces "REF-undefined". Throwing
    // here instead keeps insert-succeeded-but-malformed distinct from a
    // failed insert in the log below, and — deliberately — still fails the
    // request as if the insert itself failed, since a lead nobody can
    // reference by REF code is not usably "stored" from the owner's side.
    if (typeof inserted?.id !== 'number') {
      throw new Error(`INSERT returned no usable id (got ${JSON.stringify(inserted)})`);
    }
    leadId = inserted.id;
    dbOk = true;
  } catch (error) {
    console.error('[contact] DB insert failed:', error);
  }

  // Deliberately NOT gated on `dbOk`: even if the insert above failed, the
  // owner notification below still fires. Without this, a DB outage would
  // mean the lead is lost from BOTH the database and the owner's inbox —
  // total silence. Sending the notification regardless gives the owner a
  // chance to follow up manually while the DB issue gets fixed.
  let emailOk = false;
  if (resend) {
    try {
      const notification = buildOwnerNotification({
        name,
        email,
        message,
        locale,
        attachments: uploaded.map((u) => ({ filename: u.filename })),
        adminUrl: ADMIN_LEADS_URL,
      });
      // The Blob store is private (deliberate — these are unsolicited
      // uploads from strangers), so a bare URL wouldn't be openable from the
      // email without the read token anyway. Attach the actual file content
      // (already buffered above for the upload) instead of just linking.
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: NOTIFY_EMAIL,
        replyTo: email,
        subject: notification.subject,
        text: notification.text,
        html: notification.html,
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

  // Sender acknowledgement to the submitter: best-effort, never affects the
  // response the client sees. Only attempted when the lead is actually
  // stored AND a delivered owner notification confirms someone has seen it —
  // (1) `dbOk`: without a stored lead, acknowledging receipt to the
  // submitter while the DB write silently failed would be a lie; (2)
  // `emailOk`: a failed owner notification means nobody has seen this lead
  // yet; and (3) FROM_EMAIL is a real verified sender: Resend's sandbox
  // sender can only deliver to the account owner, so sending to an arbitrary
  // submitter from it would just fail.
  if (dbOk && emailOk && isVerifiedSender(FROM_EMAIL) && resend) {
    try {
      // Non-null assertion is safe here: this call only happens inside the
      // `if (dbOk && ...)` gate above, and `dbOk` is only ever set `true`
      // after `leadId` was assigned from the INSERT's returned row.
      const ack = buildSenderAcknowledgement({ name, locale, siteUrl: SITE_URL, leadId: leadId!, receivedAt: new Date() });
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        replyTo: NOTIFY_EMAIL,
        subject: ack.subject,
        text: ack.text,
        html: ack.html,
      });
      if (error) {
        console.error('[contact] Acknowledgement send failed:', error);
      }
    } catch (error) {
      console.error('[contact] Acknowledgement send failed:', error);
    }
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
