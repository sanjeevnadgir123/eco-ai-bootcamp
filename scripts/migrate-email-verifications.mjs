import { neon } from '@neondatabase/serverless';
import fs from 'node:fs';

// Load .env manually if not already populated
if (fs.existsSync('.env')) {
  const content = fs.readFileSync('.env', 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("FAIL: DATABASE_URL is missing in .env");
  process.exit(1);
}

const sql = neon(dbUrl);

async function runMigration() {
  try {
    console.log("Applying safe additive migration to email_verifications table...");

    await sql`
      CREATE TABLE IF NOT EXISTS email_verifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        otp_hash TEXT,
        attempts INTEGER NOT NULL DEFAULT 0,
        last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        is_verified BOOLEAN NOT NULL DEFAULT FALSE,
        verified_at TIMESTAMPTZ,
        verification_token TEXT,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await sql`ALTER TABLE email_verifications ADD COLUMN IF NOT EXISTS otp_hash TEXT;`;
    await sql`ALTER TABLE email_verifications ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0;`;
    await sql`ALTER TABLE email_verifications ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;`;
    await sql`ALTER TABLE email_verifications ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;`;
    await sql`ALTER TABLE email_verifications ADD COLUMN IF NOT EXISTS verification_token TEXT;`;
    await sql`ALTER TABLE email_verifications ALTER COLUMN code DROP NOT NULL;`;


    // Index on lower(email)
    await sql`CREATE INDEX IF NOT EXISTS idx_email_verif_lookup ON email_verifications(LOWER(email));`;


    console.log("SUCCESS: Additive migration applied cleanly without data loss.");
  } catch (err) {
    console.error("FAIL: Migration error:", err.message);
    process.exit(1);
  }
}

runMigration();
