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

async function inspectDb() {
  try {
    const ver = await sql`SELECT version();`;
    console.log("Database connection SUCCESSFUL");
    console.log("Engine:", ver[0]?.version.split(" on ")[0]);

    // Inspect columns of all public tables
    const columns = await sql`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `;

    const tables = {};
    for (const row of columns) {
      if (!tables[row.table_name]) tables[row.table_name] = [];
      tables[row.table_name].push(`${row.column_name} (${row.data_type})`);
    }

    console.log("\nExisting Tables & Columns in Neon:");
    for (const [tbl, cols] of Object.entries(tables)) {
      console.log(`- ${tbl}:`);
      for (const col of cols) {
        console.log(`    ${col}`);
      }
    }

  } catch (err) {
    console.error("FAIL: Database inspection failed:", err.message);
    process.exit(1);
  }
}

inspectDb();
