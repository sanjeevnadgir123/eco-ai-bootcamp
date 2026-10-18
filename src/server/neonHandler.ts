import { neon } from '@neondatabase/serverless';
import type { IncomingMessage, ServerResponse } from 'node:http';
import crypto from 'node:crypto';
import { sendOtpEmail, verifySmtpConnection, sendApprovalConfirmationEmail, sendRejectionEmail } from './emailService.ts';

let isVerificationTableInitialized = false;

// Secret salt for HMAC hashing OTP codes
const OTP_SECRET = process.env.OTP_SECRET || 'eco-bootcamp-otp-secret-salt-2026';

function hashOtp(code: string, email: string): string {
  return crypto.createHmac('sha256', OTP_SECRET)
    .update(`${email.trim().toLowerCase()}:${code.trim()}`)
    .digest('hex');
}

function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length < 5 || trimmed.length > 254) return false;
  // Prevent SMTP header injection
  if (/[\r\n;,]/.test(trimmed)) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(trimmed);
}

// In-memory rate limiting structures
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const ipRateLimits = new Map<string, RateLimitRecord>();
const emailRateLimits = new Map<string, RateLimitRecord>();

function checkRateLimit(key: string, map: Map<string, RateLimitRecord>, maxAllowed: number, windowMs: number): boolean {
  const now = Date.now();
  const existing = map.get(key);
  if (!existing || now > existing.resetAt) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (existing.count >= maxAllowed) {
    return false;
  }
  existing.count++;
  return true;
}

export function createNeonMiddleware(databaseUrl: string) {
  if (!databaseUrl) {
    console.warn('[Neon Backend] WARNING: DATABASE_URL is not set.');
  }

  const sql = databaseUrl ? neon(databaseUrl) : null;

  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    
    // Only handle /api/* routes
    if (!url.pathname.startsWith('/api/')) {
      return next();
    }

    // Set JSON and CORS headers
    const reqOrigin = req.headers.origin as string;
    const allowedOriginsEnv = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.trim() : '*';
    if (allowedOriginsEnv === '*') {
      res.setHeader('Access-Control-Allow-Origin', '*');
    } else {
      const allowedList = allowedOriginsEnv.split(',').map((o) => o.trim());
      if (reqOrigin && allowedList.includes(reqOrigin)) {
        res.setHeader('Access-Control-Allow-Origin', reqOrigin);
      } else {
        res.setHeader('Access-Control-Allow-Origin', allowedList[0] || '*');
      }
    }
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      return res.end();
    }

    if (!sql) {
      res.statusCode = 503;
      return res.end(JSON.stringify({ 
        error: 'Database not configured. DATABASE_URL is required.' 
      }));
    }

    const sendJson = (statusCode: number, data: any) => {
      res.statusCode = statusCode;
      res.end(JSON.stringify(data));
    };

    // Helper to safely parse JSON body with payload size limit (max 100KB)
    const parseBody = async (): Promise<any> => {
      return new Promise((resolve, reject) => {
        let body = '';
        let size = 0;
        req.on('data', (chunk: any) => {
          size += chunk.length;
          if (size > 102400) {
            reject(new Error('Request payload too large'));
            return;
          }
          body += chunk;
        });
        req.on('end', () => {
          try {
            resolve(body ? JSON.parse(body) : {});
          } catch (e) {
            reject(new Error('Invalid JSON format'));
          }
        });
        req.on('error', reject);
      });
    };

    try {
      // Ensure email_verifications table exists in Neon
      if (sql && !isVerificationTableInitialized) {
        try {
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
          await sql`CREATE INDEX IF NOT EXISTS idx_email_verif_lookup ON email_verifications(LOWER(email));`;
          try {
            await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS usn TEXT;`;
            await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS semester TEXT;`;
            await sql`CREATE INDEX IF NOT EXISTS idx_registrations_usn ON registrations(usn);`;
            await sql`
              CREATE TABLE IF NOT EXISTS student_usn_records (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                registration_id TEXT,
                email TEXT NOT NULL,
                usn TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
              );
            `;
            await sql`
              CREATE TABLE IF NOT EXISTS student_semester_records (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                registration_id TEXT,
                email TEXT NOT NULL,
                semester TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
              );
            `;
          } catch (migErr) {
            console.warn('[Neon] Registration columns migration notice:', migErr);
          }
          isVerificationTableInitialized = true;
        } catch (e) {
          console.warn('[Neon] Table initialization notice:', e);
        }
      }

      // 1. Health check & verification route
      if (url.pathname === '/api/health' && req.method === 'GET') {
        const ver = await sql`SELECT version();`;
        const regCount = await sql`SELECT count(*) FROM registrations;`;
        return sendJson(200, {
          status: 'connected',
          database: 'Neon Serverless PostgreSQL',
          postgresVersion: ver[0]?.version,
          registrationsCount: Number(regCount[0]?.count || 0),
          timestamp: new Date().toISOString()
        });
      }

      // 2. SMTP Verification (dev diagnostic endpoint)
      if (url.pathname === '/api/smtp-verify' && req.method === 'GET') {
        const result = await verifySmtpConnection();
        return sendJson(result.success ? 200 : 503, {
          smtp: result.success ? 'connected' : 'failed',
          message: result.success ? 'SMTP transporter verified and ready' : result.error,
        });
      }

      // 3. Send 6-digit OTP Email
      if (url.pathname === '/api/send-otp' && req.method === 'POST') {
        const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
        
        // IP Rate Limit: max 15 OTP requests per 10 minutes
        if (!checkRateLimit(clientIp, ipRateLimits, 15, 10 * 60 * 1000)) {
          return sendJson(429, { error: 'Too many requests from this network. Please try again in 10 minutes.' });
        }

        const body = await parseBody();
        const rawEmail = (body.email || '').trim();
        if (!isValidEmail(rawEmail)) {
          return sendJson(400, { error: 'A valid email address is required.' });
        }
        const normalizedEmail = rawEmail.toLowerCase();

        // Email Rate Limit: max 5 OTP requests per 10 minutes
        if (!checkRateLimit(normalizedEmail, emailRateLimits, 5, 10 * 60 * 1000)) {
          return sendJson(429, { error: 'Too many OTP requests for this email. Please wait 10 minutes before requesting again.' });
        }

        // Database Resend Cooldown Check: 30 seconds
        const existingRecord = await sql`
          SELECT last_sent_at 
          FROM email_verifications 
          WHERE LOWER(email) = ${normalizedEmail}
          LIMIT 1;
        `;
        if (existingRecord.length > 0 && existingRecord[0].last_sent_at) {
          const lastSent = new Date(existingRecord[0].last_sent_at).getTime();
          const elapsedSec = Math.floor((Date.now() - lastSent) / 1000);
          if (elapsedSec < 30) {
            const waitTime = 30 - elapsedSec;
            return sendJson(429, { 
              error: `Please wait ${waitTime}s before requesting another verification code.` 
            });
          }
        }

        // Generate cryptographically secure 6-digit OTP
        const code = crypto.randomInt(100000, 1000000).toString();
        const otpHash = hashOtp(code, normalizedEmail);

        // Send email via Nodemailer FIRST
        const emailResult = await sendOtpEmail({ toEmail: normalizedEmail, code });
        if (!emailResult.success) {
          console.error('[Send OTP] Email delivery failed:', emailResult.error);
          return sendJson(500, { 
            error: emailResult.error 
              ? `Failed to deliver verification email: ${emailResult.error}` 
              : 'Failed to deliver verification email. Please verify your email address or check server SMTP configuration.' 
          });
        }

        // Store hashed OTP in Neon with 10-minute expiry (never storing raw code)
        await sql`
          INSERT INTO email_verifications (
            email,
            otp_hash,
            attempts,
            last_sent_at,
            is_verified,
            verified_at,
            verification_token,
            expires_at,
            created_at
          )
          VALUES (
            ${normalizedEmail},
            ${otpHash},
            0,
            NOW(),
            FALSE,
            NULL,
            NULL,
            NOW() + INTERVAL '10 minutes',
            NOW()
          )
          ON CONFLICT (email) DO UPDATE 
          SET 
            otp_hash = ${otpHash},
            attempts = 0,
            last_sent_at = NOW(),
            is_verified = FALSE,
            verified_at = NULL,
            verification_token = NULL,
            expires_at = NOW() + INTERVAL '10 minutes';
        `;

        // Never expose the OTP code in response body or headers
        return sendJson(200, {
          success: true,
          message: `Verification code sent to ${normalizedEmail}. Please check your inbox.`
        });
      }

      // 4. Verify 6-digit OTP
      if (url.pathname === '/api/verify-otp' && req.method === 'POST') {
        const body = await parseBody();
        const rawEmail = (body.email || '').trim();
        const inputCode = String(body.code || '').trim();

        if (!isValidEmail(rawEmail)) {
          return sendJson(400, { error: 'A valid email address is required.' });
        }
        if (!/^\d{6}$/.test(inputCode)) {
          return sendJson(400, { error: 'Verification code must be exactly 6 digits.' });
        }

        const normalizedEmail = rawEmail.toLowerCase();
        const matches = await sql`
          SELECT id, otp_hash, attempts, expires_at, is_verified 
          FROM email_verifications 
          WHERE LOWER(email) = ${normalizedEmail}
          LIMIT 1;
        `;

        if (matches.length === 0 || !matches[0].otp_hash) {
          return sendJson(400, { error: 'No active verification code found for this email. Please request a new code.' });
        }

        const record = matches[0];

        // Max 5 verification attempts to prevent brute-forcing
        if (record.attempts >= 5) {
          return sendJson(429, { 
            error: 'Maximum verification attempts exceeded. Please request a new verification code.' 
          });
        }

        // Expiration Check (10 minutes)
        const now = new Date();
        const expiresAt = new Date(record.expires_at);
        if (now > expiresAt) {
          return sendJson(400, { error: 'This verification code has expired. Please request a new code.' });
        }

        // Timing-safe constant-time hash comparison
        const expectedHash = hashOtp(inputCode, normalizedEmail);
        const hashMatches = crypto.timingSafeEqual(
          Buffer.from(record.otp_hash, 'hex'),
          Buffer.from(expectedHash, 'hex')
        );

        if (!hashMatches) {
          const newAttempts = record.attempts + 1;
          await sql`
            UPDATE email_verifications 
            SET attempts = ${newAttempts} 
            WHERE LOWER(email) = ${normalizedEmail};
          `;
          const remainingAttempts = Math.max(0, 5 - newAttempts);
          return sendJson(400, { 
            error: remainingAttempts > 0 
              ? `Invalid verification code. ${remainingAttempts} attempts remaining.` 
              : 'Invalid code. Maximum attempts exceeded. Please request a new code.' 
          });
        }

        // Verification Succeeded: Atomically consume the OTP and record verified status
        const verificationToken = crypto.randomBytes(32).toString('hex');
        await sql`
          UPDATE email_verifications
          SET 
            otp_hash = NULL,
            is_verified = TRUE,
            verified_at = NOW(),
            verification_token = ${verificationToken},
            attempts = 0
          WHERE LOWER(email) = ${normalizedEmail};
        `;

        return sendJson(200, {
          success: true,
          message: 'Email address verified successfully!',
          verificationToken
        });
      }

      // 5. Duplicate email check
      if (url.pathname === '/api/eligibility' && req.method === 'GET') {
        const rawEmail = (url.searchParams.get('email') || '').trim();
        if (!isValidEmail(rawEmail)) {
          return sendJson(400, { error: 'A valid email parameter is required' });
        }
        const normalizedEmail = rawEmail.toLowerCase();

        // Check if already registered
        const existingReg = await sql`
          SELECT id, registration_id, payment_status, utr_number 
          FROM registrations 
          WHERE LOWER(email) = ${normalizedEmail}
          LIMIT 1;
        `;
        const alreadyRegistered = existingReg.length > 0;

        return sendJson(200, {
          email: normalizedEmail,
          alreadyRegistered,
          existingRegistration: existingReg[0] || null,
          feeAmount: 200,
          categoryName: 'ECO AI Bootcamp Participant',
        });
      }

      // 6. Check duplicate UTR
      if (url.pathname === '/api/check-utr' && req.method === 'GET') {
        const utr = (url.searchParams.get('utr') || '').trim().toUpperCase();
        if (!utr || utr.length < 6) {
          return sendJson(400, { error: 'Valid UTR parameter is required' });
        }
        const existing = await sql`
          SELECT id FROM registrations 
          WHERE UPPER(utr_number) = ${utr}
          LIMIT 1;
        `;
        return sendJson(200, { isDuplicate: existing.length > 0 });
      }

      // 7. Get all registrations (for Admin Dashboard)
      if (url.pathname === '/api/registrations' && req.method === 'GET') {
        const rows = await sql`
          SELECT 
            id,
            registration_id AS "registrationId",
            full_name AS "fullName",
            email,
            phone,
            usn,
            semester,
            fee_amount AS "feeAmount",
            utr_number AS "utrNumber",
            payment_status AS "paymentStatus",
            registration_status AS "registrationStatus",
            rejection_reason AS "rejectionReason",
            created_at AS "createdAt",
            updated_at AS "updatedAt",
            approved_at AS "approvedAt"
          FROM registrations 
          ORDER BY created_at DESC;
        `;
        return sendJson(200, { registrations: rows });
      }

      // 8. Submit new registration (Enforces server-side email verification)
      if (url.pathname === '/api/registrations' && req.method === 'POST') {
        const body = await parseBody();
        const { fullName, email, phone, utrNumber, verificationToken } = body;

        // Robust extraction of USN and Semester supporting various casings/aliases
        const rawUsn = body.usn ?? body.USN ?? body.studentUsn ?? body.usnNumber ?? body.usn_number;
        const rawSemester = body.semester ?? body.Semester ?? body.sem ?? body.studentSemester ?? body.student_semester;

        const normalizedUsn = rawUsn ? String(rawUsn).trim().toUpperCase() : '';
        const normalizedSemester = rawSemester ? String(rawSemester).trim() : '';

        if (!fullName || !email || !phone || !utrNumber) {
          return sendJson(400, { error: 'Missing required registration fields' });
        }

        if (!normalizedUsn) {
          return sendJson(400, { error: 'Student USN is required for registration.' });
        }

        if (!normalizedSemester) {
          return sendJson(400, { error: 'Student Semester is required for registration.' });
        }

        const rawEmail = String(email).trim();
        if (!isValidEmail(rawEmail)) {
          return sendJson(400, { error: 'A valid email address is required.' });
        }
        const normalizedEmail = rawEmail.toLowerCase();
        const normalizedUtr = String(utrNumber).trim().toUpperCase();

        // Security Requirement: Strictly verify that the email was verified on the backend
        const verifRecord = await sql`
          SELECT id, is_verified, verified_at, verification_token 
          FROM email_verifications 
          WHERE LOWER(email) = ${normalizedEmail}
            AND is_verified = TRUE
            AND verified_at >= NOW() - INTERVAL '2 hours'
          LIMIT 1;
        `;

        if (verifRecord.length === 0) {
          return sendJson(403, { 
            error: 'Email verification required. Please verify your email with the 6-digit OTP code before submitting registration.' 
          });
        }

        // If client provided verificationToken, confirm it matches
        if (verificationToken && verifRecord[0].verification_token && verifRecord[0].verification_token !== verificationToken) {
          return sendJson(403, { 
            error: 'Invalid or superseded verification token. Please re-verify your email.' 
          });
        }

        // Check duplicate email
        const dupEmail = await sql`
          SELECT id FROM registrations WHERE LOWER(email) = ${normalizedEmail} LIMIT 1;
        `;
        if (dupEmail.length > 0) {
          return sendJson(409, { error: `A registration with email ${normalizedEmail} already exists.` });
        }

        // Check duplicate UTR
        const dupUtr = await sql`
          SELECT id FROM registrations WHERE UPPER(utr_number) = ${normalizedUtr} LIMIT 1;
        `;
        if (dupUtr.length > 0) {
          return sendJson(409, { error: `Transaction UTR reference ${normalizedUtr} has already been registered.` });
        }

        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const registrationId = `ECO-AI-2026-${randomSuffix}`;

        const inserted = await sql`
          INSERT INTO registrations (
            registration_id,
            full_name,
            email,
            phone,
            usn,
            semester,
            fee_amount,
            utr_number,
            payment_status,
            registration_status
          ) VALUES (
            ${registrationId},
            ${String(fullName).trim()},
            ${normalizedEmail},
            ${String(phone).trim()},
            ${normalizedUsn},
            ${normalizedSemester},
            200,
            ${normalizedUtr},
            'PENDING_VERIFICATION',
            'SUBMITTED'
          )
          RETURNING 
            id,
            registration_id AS "registrationId",
            full_name AS "fullName",
            email,
            phone,
            usn,
            semester,
            fee_amount AS "feeAmount",
            utr_number AS "utrNumber",
            payment_status AS "paymentStatus",
            registration_status AS "registrationStatus",
            created_at AS "createdAt";
        `;

        // Sync to auxiliary tables if present
        try {
          await sql`
            INSERT INTO student_usn_records (registration_id, email, usn)
            VALUES (${registrationId}, ${normalizedEmail}, ${normalizedUsn});
          `;
        } catch {
          // ignore
        }
        try {
          await sql`
            INSERT INTO student_semester_records (registration_id, email, semester)
            VALUES (${registrationId}, ${normalizedEmail}, ${normalizedSemester});
          `;
        } catch {
          // ignore
        }

        // Consume the verification session after successful registration
        await sql`DELETE FROM email_verifications WHERE LOWER(email) = ${normalizedEmail};`;

        return sendJson(201, { 
          success: true, 
          registration: inserted[0] 
        });
      }

      // 8b. Update student details (USN, Semester, Name, Phone) by Administrator
      const detailsMatch = url.pathname.match(/^\/api\/registrations\/([^/]+)\/details$/);
      if (detailsMatch && req.method === 'PATCH') {
        const registrationId = detailsMatch[1];
        const body = await parseBody();
        const rawUsn = body.usn ?? body.USN;
        const rawSemester = body.semester ?? body.Semester ?? body.sem;
        const fullName = body.fullName ? String(body.fullName).trim() : null;
        const phone = body.phone ? String(body.phone).trim() : null;
        const usn = rawUsn ? String(rawUsn).trim().toUpperCase() : null;
        const semester = rawSemester ? String(rawSemester).trim() : null;

        const updated = await sql`
          UPDATE registrations 
          SET 
            usn = COALESCE(${usn}, usn),
            semester = COALESCE(${semester}, semester),
            full_name = COALESCE(${fullName}, full_name),
            phone = COALESCE(${phone}, phone),
            updated_at = NOW()
          WHERE registration_id = ${registrationId} OR id::text = ${registrationId}
          RETURNING 
            id,
            registration_id AS "registrationId",
            full_name AS "fullName",
            email,
            phone,
            usn,
            semester,
            fee_amount AS "feeAmount",
            utr_number AS "utrNumber",
            payment_status AS "paymentStatus",
            registration_status AS "registrationStatus",
            rejection_reason AS "rejectionReason",
            created_at AS "createdAt",
            updated_at AS "updatedAt",
            approved_at AS "approvedAt";
        `;

        if (updated.length === 0) {
          return sendJson(404, { error: 'Registration record not found' });
        }

        // Also sync to standalone tables if they exist
        try {
          if (usn && updated[0].email) {
            await sql`
              INSERT INTO student_usn_records (registration_id, email, usn)
              VALUES (${updated[0].registrationId}, ${updated[0].email}, ${usn});
            `;
          }
          if (semester && updated[0].email) {
            await sql`
              INSERT INTO student_semester_records (registration_id, email, semester)
              VALUES (${updated[0].registrationId}, ${updated[0].email}, ${semester});
            `;
          }
        } catch {
          // ignore
        }

        return sendJson(200, { success: true, registration: updated[0] });
      }

      // 9. Update payment status (Approve / Reject)
      const patchMatch = url.pathname.match(/^\/api\/registrations\/([^/]+)\/status$/);
      if (patchMatch && req.method === 'PATCH') {
        const registrationId = patchMatch[1];
        const body = await parseBody();
        const { paymentStatus, rejectionReason } = body;

        if (!['APPROVED', 'REJECTED', 'PENDING_VERIFICATION'].includes(paymentStatus)) {
          return sendJson(400, { error: 'Invalid payment status' });
        }

        const isApproved = paymentStatus === 'APPROVED';
        const isRejected = paymentStatus === 'REJECTED';
        const updated = await sql`
          UPDATE registrations
          SET 
            payment_status = ${paymentStatus},
            registration_status = ${isApproved ? 'CONFIRMED' : 'SUBMITTED'},
            rejection_reason = ${isApproved ? null : (rejectionReason || null)},
            approved_at = ${isApproved ? new Date().toISOString() : null},
            updated_at = NOW()
          WHERE registration_id = ${registrationId} OR id::text = ${registrationId}
          RETURNING 
            id,
            registration_id AS "registrationId",
            full_name AS "fullName",
            email,
            payment_status AS "paymentStatus",
            registration_status AS "registrationStatus",
            rejection_reason AS "rejectionReason",
            approved_at AS "approvedAt";
        `;

        if (updated.length === 0) {
          return sendJson(404, { error: 'Registration record not found' });
        }

        const record = updated[0];

        // Send official invitation email when approved by administrator
        if (isApproved && record.email) {
          try {
            await sendApprovalConfirmationEmail({
              toEmail: record.email,
              fullName: record.fullName,
              registrationId: record.registrationId,
            });
            console.log(`[Approval Email] Sent confirmation and invitation email to ${record.email}`);
          } catch (mailErr) {
            console.error('[Approval Email] Failed to send approval email:', mailErr);
          }
        }

        // Send rejection notification email with admin message when rejected
        if (isRejected && record.email) {
          try {
            await sendRejectionEmail({
              toEmail: record.email,
              fullName: record.fullName,
              registrationId: record.registrationId,
              rejectionReason: rejectionReason || record.rejectionReason || 'Payment details could not be verified in bank statements',
            });
            console.log(`[Rejection Email] Sent rejection notice email to ${record.email}`);
          } catch (mailErr) {
            console.error('[Rejection Email] Failed to send rejection email:', mailErr);
          }
        }

        return sendJson(200, { success: true, registration: record });
      }

      // Unmatched route
      return sendJson(404, { error: `Endpoint not found: ${req.method} ${url.pathname}` });
    } catch (err: any) {
      console.error('[Neon API Error]:', err?.message || 'Internal error');
      const isDev = process.env.NODE_ENV !== 'production';
      return sendJson(500, { 
        error: 'Database operation failed', 
        ...(isDev ? { details: err?.message || 'Server error' } : {})
      });
    }
  };
}
