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

    // Check if tables already exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `;
    console.log("Existing tables:", tables.map(t => t.table_name));

    const hasRegistrations = tables.some(t => t.table_name === 'registrations');
    const hasEligibility = tables.some(t => t.table_name === 'attendance_eligibility');

    if (!hasRegistrations || !hasEligibility) {
      console.log("Tables not found. Creating schema automatically from neon_schema.sql...");
      const schemaSql = fs.readFileSync('neon_schema.sql', 'utf-8');
      
      // Execute schema statements
      // We can split by statement or execute
      // Note: with neon HTTP, multiple statements can be run or individual statements
      // Let's create the tables
      await sql`
        CREATE TABLE IF NOT EXISTS attendance_eligibility (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email TEXT UNIQUE NOT NULL,
            student_name TEXT NOT NULL,
            department TEXT NOT NULL DEFAULT 'ECE',
            semester TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `;
      console.log("Created table: attendance_eligibility");

      await sql`
        CREATE TABLE IF NOT EXISTS registrations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            registration_id TEXT UNIQUE NOT NULL,
            full_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT NOT NULL,
            is_eligible BOOLEAN NOT NULL DEFAULT FALSE,
            fee_amount INTEGER NOT NULL CHECK (fee_amount IN (100, 200)),
            utr_number TEXT UNIQUE NOT NULL,
            payment_status TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION' CHECK (payment_status IN ('PENDING_PAYMENT', 'PENDING_VERIFICATION', 'APPROVED', 'REJECTED')),
            registration_status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (registration_status IN ('DRAFT', 'SUBMITTED', 'CONFIRMED')),
            rejection_reason TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            approved_at TIMESTAMPTZ
        );
      `;
      console.log("Created table: registrations");

      await sql`CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_registrations_utr ON registrations(utr_number);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(payment_status);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_eligibility_email ON attendance_eligibility(LOWER(email));`;
      console.log("Created indexes");

      await sql`
        INSERT INTO attendance_eligibility (email, student_name, department, semester)
        VALUES 
            ('student@agmrcet.ac.in', 'Student Representative', 'ECE', '5th Sem'),
            ('eco.member@agmrcet.ac.in', 'ECO Executive Member', 'ECE', '7th Sem'),
            ('topper.ece@agmrcet.ac.in', 'Class Representative', 'ECE', '5th Sem')
        ON CONFLICT (email) DO NOTHING;
      `;
      console.log("Seeded initial attendance eligibility records");
    }

    // Clean any temporary test record
    await sql`DELETE FROM registrations WHERE email = 'test.student@agmrcet.ac.in';`;

    const regCount = await sql`SELECT count(*) FROM registrations;`;
    const eligCount = await sql`SELECT count(*) FROM attendance_eligibility;`;
    console.log(`Current stats: ${regCount[0].count} registrations, ${eligCount[0].count} eligible students in database.`);
    console.log("DATABASE SETUP COMPLETE & 100% CONNECTED!");

  } catch (err) {
    console.error("Neon connection failed:", err);
  }
}

check();
