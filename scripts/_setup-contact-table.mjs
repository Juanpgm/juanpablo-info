// One-off setup script: creates the contact_submissions table in Neon.
// Run once via `node scripts/_setup-contact-table.mjs`. Idempotent
// (CREATE TABLE IF NOT EXISTS), safe to re-run.
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf8');
const match = envContent.match(/^DATABASE_URL="?([^"\n]+)"?/m);
if (!match) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}
const sql = neon(match[1]);

await sql`
  CREATE TABLE IF NOT EXISTS contact_submissions (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    locale TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;

// Fast-follow: file/image attachment support (Vercel Blob-backed). Native
// Postgres array column — `attachment_urls` holds each uploaded file's Blob
// URL (private access, read back server-side via @vercel/blob's get()/put()
// result). ADD COLUMN IF NOT EXISTS keeps this idempotent on an
// already-existing table from a prior run of this script.
await sql`
  ALTER TABLE contact_submissions
  ADD COLUMN IF NOT EXISTS attachment_urls TEXT[]
`;

console.log('Table ready.');
