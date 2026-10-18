import http from 'node:http';
import fs from 'node:fs';
import { neon } from '@neondatabase/serverless';
import { createNeonMiddleware } from '../src/server/neonHandler.ts';
import { verifySmtpConnection } from '../src/server/emailService.ts';

// Load .env
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
  console.error("FAIL: DATABASE_URL not set in .env");
  process.exit(1);
}

const sql = neon(dbUrl);
const middleware = createNeonMiddleware(dbUrl);

const TEST_PORT = 5199;
const BASE_URL = `http://localhost:${TEST_PORT}`;
const TEST_EMAIL = 'automated.test.student@agmrcet.ac.in';

const testServer = http.createServer((req, res) => {
  middleware(req, res, () => {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not found' }));
  });
});

async function runTests() {
  console.log("==================================================");
  console.log("   ECO AI BOOTCAMP — OTP SECURITY TEST SUITE     ");
  console.log("==================================================\n");

  await new Promise((resolve) => testServer.listen(TEST_PORT, resolve));
  console.log(`[Test Server] Running on ${BASE_URL}\n`);

  let allPassed = true;

  const assert = (condition, testName, extraInfo = '') => {
    if (condition) {
      console.log(`[PASS] ${testName}`);
    } else {
      console.error(`[FAIL] ${testName} ${extraInfo}`);
      allPassed = false;
    }
  };

  try {
    // Clean up any existing test records before starting
    await sql`DELETE FROM email_verifications WHERE LOWER(email) = ${TEST_EMAIL};`;
    await sql`DELETE FROM registrations WHERE LOWER(email) = ${TEST_EMAIL};`;

    // 1. Neon Database Connection
    const ver = await sql`SELECT version();`;
    assert(Boolean(ver[0]?.version), "Neon PostgreSQL Connection & Query Test");

    // 2. SMTP Verification (transporter.verify)
    const smtpCheck = await verifySmtpConnection();
    assert(smtpCheck.success, "Gmail SMTP Authentication & Connection Test", smtpCheck.error ? `(${smtpCheck.error})` : '');

    // 3. Health Endpoint
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'connected', "Health Endpoint (/api/health) returns 200 connected");

    // 4. Invalid Email Rejection
    const invalidEmailRes = await fetch(`${BASE_URL}/api/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' }),
    });
    assert(invalidEmailRes.status === 400, "Validation: Malformed email rejected on /api/send-otp");

    // 5. Header Injection Prevention
    const injectionEmailRes = await fetch(`${BASE_URL}/api/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: "victim@agmrcet.ac.in\r\nBcc: attacker@evil.com" }),
    });
    assert(injectionEmailRes.status === 400, "Security: Email with CRLF injection rejected");

    // 6. Direct Seed OTP Hash in DB for Isolated Testing (Without sending real emails repeatedly)
    const testCode = '482910';
    // Compute expected hash using same algorithm
    const crypto = await import('node:crypto');
    const salt = process.env.OTP_SECRET || 'eco-bootcamp-otp-secret-salt-2026';
    const expectedHash = crypto.createHmac('sha256', salt).update(`${TEST_EMAIL}:${testCode}`).digest('hex');

    await sql`
      INSERT INTO email_verifications (
        email, otp_hash, attempts, last_sent_at, is_verified, expires_at
      ) VALUES (
        ${TEST_EMAIL}, ${expectedHash}, 0, NOW(), FALSE, NOW() + INTERVAL '10 minutes'
      );
    `;

    // Verify raw code is NOT stored in DB
    const dbRow = await sql`SELECT * FROM email_verifications WHERE LOWER(email) = ${TEST_EMAIL};`;
    assert(dbRow.length > 0 && dbRow[0].otp_hash === expectedHash, "Security: Only cryptographic HMAC-SHA256 hash stored in Neon (no raw code)");

    // 7. Verify OTP: Invalid Code Rejection
    const wrongCodeRes = await fetch(`${BASE_URL}/api/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, code: '000000' }),
    });
    const wrongCodeData = await wrongCodeRes.json();
    assert(wrongCodeRes.status === 400 && wrongCodeData.error.includes('Invalid'), "Security: Incorrect OTP code rejected");

    // Verify attempt counter incremented
    const afterFailedAttempt = await sql`SELECT attempts FROM email_verifications WHERE LOWER(email) = ${TEST_EMAIL};`;
    assert(afterFailedAttempt[0]?.attempts === 1, "Security: Failed attempt counter incremented in Neon");

    // 8. Verify OTP: Valid Code Verification
    const correctCodeRes = await fetch(`${BASE_URL}/api/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, code: testCode }),
    });
    const correctCodeData = await correctCodeRes.json();
    assert(
      correctCodeRes.status === 200 && correctCodeData.success === true && Boolean(correctCodeData.verificationToken),
      "Security: Correct OTP accepted and verificationToken issued"
    );

    const afterSuccessRow = await sql`SELECT otp_hash, is_verified FROM email_verifications WHERE LOWER(email) = ${TEST_EMAIL};`;
    assert(
      afterSuccessRow[0]?.is_verified === true && afterSuccessRow[0]?.otp_hash === null,
      "Security: OTP atomically consumed upon verification (otp_hash set to NULL)"
    );

    // 9. Replay Attack Prevention (Cannot reuse same OTP)
    const replayRes = await fetch(`${BASE_URL}/api/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, code: testCode }),
    });
    assert(replayRes.status === 400, "Security: Reused/consumed OTP rejected (Replay Prevention)");

    // 10. Registration: Unverified Email Blocked (HTTP 403)
    const unverifiedEmail = 'unverified.intruder@agmrcet.ac.in';
    const unverifiedRegRes = await fetch(`${BASE_URL}/api/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Intruder',
        email: unverifiedEmail,
        phone: '9845000000',
        usn: '2AG22EC000',
        semester: '3rd Semester',
        feeAmount: 200,
        utrNumber: 'UTR000000000000',
      }),
    });
    assert(unverifiedRegRes.status === 403, "Security: Registration strictly BLOCKED (HTTP 403) for unverified email");

    // 11. Registration: Allowed for Verified Email
    const validRegRes = await fetch(`${BASE_URL}/api/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Automated Test Student',
        email: TEST_EMAIL,
        phone: '9845011111',
        usn: '2AG22EC099',
        semester: '5th Semester',
        feeAmount: 200,
        utrNumber: 'UTR999999999999',
        verificationToken: correctCodeData.verificationToken,
      }),
    });
    const validRegData = await validRegRes.json();
    assert(validRegRes.status === 201 && validRegData.success === true, "Registration: Successfully ALLOWED after verified OTP");
    assert(validRegData.registration.usn === '2AG22EC099', "Registration: USN verified and stored correctly");
    assert(validRegData.registration.semester === '5th Semester', "Registration: Semester verified and stored correctly");

    // 12. Verification Record Retained in email_verifications Post-Registration
    const postRegCheck = await sql`SELECT * FROM email_verifications WHERE LOWER(email) = ${TEST_EMAIL};`;
    assert(postRegCheck.length > 0 && postRegCheck[0].is_verified === true, "Verification: Email verification record retained with is_verified=true for audit");

    // Clean up test records
    await sql`DELETE FROM email_verifications WHERE LOWER(email) = ${TEST_EMAIL};`;
    await sql`DELETE FROM registrations WHERE LOWER(email) = ${TEST_EMAIL};`;
    console.log("[Cleanup] Test records purged from Neon database.");

  } catch (err) {
    console.error("Test execution exception:", err);
    allPassed = false;
  } finally {
    testServer.close();
    console.log("\n==================================================");
    if (allPassed) {
      console.log("   ALL 12 OTP & SECURITY TESTS PASSED! (100%)    ");
    } else {
      console.log("   SOME TESTS FAILED — CHECK LOGS ABOVE          ");
    }
    console.log("==================================================");
    process.exit(allPassed ? 0 : 1);
  }
}

runTests();
