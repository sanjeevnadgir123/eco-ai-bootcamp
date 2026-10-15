import nodemailer from 'nodemailer';
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


async function testSmtp() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  console.log("Checking SMTP configuration variables...");
  console.log("SMTP_HOST present:", Boolean(host));
  console.log("SMTP_PORT:", port);
  console.log("SMTP_USER present:", Boolean(user));
  console.log("SMTP_PASS present:", Boolean(pass));

  if (!user || !pass) {
    console.error("FAIL: SMTP_USER or SMTP_PASS is missing in .env");
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user: user.trim(),
      pass: pass.trim().replace(/\s+/g, ''), // Strip whitespace from 16-character App Passwords (e.g., 'abcd efgh ijkl mnop')
    },
  });

  try {
    console.log("Verifying connection to mail server with transporter.verify()...");
    await transporter.verify();
    console.log("SUCCESS: SMTP server connection and authentication verified!");
  } catch (err) {
    console.error("FAIL: SMTP verification failed.");
    console.error("Error Code:", err.code);
    console.error("Error Message:", err.message);
    process.exit(1);
  }
}

testSmtp();
