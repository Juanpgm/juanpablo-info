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
console.log('Table ready.');
