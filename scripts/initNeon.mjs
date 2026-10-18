import { neon } from '@neondatabase/serverless';
import fs from 'node:fs';

// Safely load environment variables from .env
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

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('FAIL: DATABASE_URL environment variable is required.');
  process.exit(1);
}
const sql = neon(connectionString);

async function check() {
  console.log("Connecting to Neon database...");
  try {
    const versionResult = await sql`SELECT version();`;
    console.log("Neon Connection SUCCESSFUL!");
    console.log("Postgres version:", versionResult[0]?.version);

    // 1. Ensure migrations and columns exist
    console.log("Ensuring schema integrity (USN, Semester, Email Verifications)...");
    
    await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS usn TEXT;`;
    await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS semester TEXT;`;
    await sql`CREATE INDEX IF NOT EXISTS idx_registrations_usn ON registrations(usn);`;

    await sql`
      CREATE TABLE IF NOT EXISTS registrations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          registration_id TEXT UNIQUE NOT NULL,
          full_name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          phone TEXT NOT NULL,
          usn TEXT,
          semester TEXT,
          fee_amount INTEGER NOT NULL DEFAULT 200,
          utr_number TEXT UNIQUE NOT NULL,
          payment_status TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION' CHECK (payment_status IN ('PENDING_PAYMENT', 'PENDING_VERIFICATION', 'APPROVED', 'REJECTED')),
          registration_status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (registration_status IN ('DRAFT', 'SUBMITTED', 'CONFIRMED')),
          rejection_reason TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          approved_at TIMESTAMPTZ
      );
    `;

    // Drop standalone auxiliary tables so USN & Semester reside solely in registrations table
    await sql`DROP TABLE IF EXISTS student_usn_records CASCADE;`;
    await sql`DROP TABLE IF EXISTS student_semester_records CASCADE;`;

    await sql`
      CREATE TABLE IF NOT EXISTS email_verifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT UNIQUE NOT NULL,
          code TEXT,
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
    await sql`ALTER TABLE email_verifications ADD COLUMN IF NOT EXISTS code TEXT;`;
    await sql`ALTER TABLE email_verifications ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;`;
    await sql`ALTER TABLE email_verifications ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;`;
    await sql`ALTER TABLE email_verifications ADD COLUMN IF NOT EXISTS verification_token TEXT;`;

    await sql`CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_registrations_utr ON registrations(utr_number);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(payment_status);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_email_verif_lookup ON email_verifications(LOWER(email));`;

    const regCount = await sql`SELECT count(*) FROM registrations;`;
    const verifCount = await sql`SELECT count(*) FROM email_verifications;`;

    console.log(`Current stats: ${regCount[0].count} registrations, ${verifCount[0].count} email verification records in database.`);
    console.log("DATABASE SETUP COMPLETE & 100% CONNECTED!");

  } catch (err) {
    console.error("Neon verification failed:", err);
    process.exit(1);
  }
}

check();
