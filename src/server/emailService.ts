import nodemailer, { type Transporter } from 'nodemailer';
import fs from 'node:fs';
import path from 'node:path';

export interface SendOtpOptions {
  toEmail: string;
  code: string;
}

/**
 * Guarantee .env variables are loaded into process.env even when invoked
 * through Vite dev middleware or custom test runners.
 */
export function ensureEnvLoaded() {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return;
  }
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf-8');
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
    } catch {
      // ignore
    }
  }
}

// Initial check on module load
ensureEnvLoaded();

let cachedTransporter: Transporter | null = null;

export function getEmailTransporter(): Transporter | null {
  ensureEnvLoaded();
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER || '';
  const rawPass = process.env.SMTP_PASS || '';
  // Strip whitespace from 16-character App Passwords (e.g., 'abcd efgh ijkl mnop') for RFC compliance
  const pass = rawPass.trim().replace(/\s+/g, '');

  if (!user || !pass) {
    return null;
  }

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user: user.trim(),
        pass,
      },
    });
  }

  return cachedTransporter;
}

/**
 * Verify SMTP connectivity without sending any email
 */
export async function verifySmtpConnection(): Promise<{ success: boolean; error?: string }> {
  const transporter = getEmailTransporter();
  if (!transporter) {
    return {
      success: false,
      error: 'SMTP credentials missing (SMTP_USER or SMTP_PASS not set in environment)',
    };
  }

  try {
    await transporter.verify();
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'SMTP authentication failed',
    };
  }
}

/**
 * Send 6-digit OTP verification email via Gmail SMTP
 */
export async function sendOtpEmail({ toEmail, code }: SendOtpOptions): Promise<{ success: boolean; error?: string }> {
  // Prevent SMTP header injection
  if (!toEmail || /[\r\n]/.test(toEmail)) {
    return {
      success: false,
      error: 'Invalid recipient email address',
    };
  }

  const transporter = getEmailTransporter();
  const user = process.env.SMTP_USER || '';
  const from = process.env.SMTP_FROM || `"Geminal Studio" <${user || 'noreply@geminalstudio.com'}>`;

  // Required exact wording template
  const textContent = `welcome to ECO AI-BOOT CAMP 
Here is your 6 digit verification code 
${code}

thankyou 
regards : Geminal studio`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 36px 32px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }
    .title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; letter-spacing: -0.02em; }
    .subtitle { font-size: 15px; color: #475569; margin: 0 0 24px 0; }
    .code-box { background: #f0fdf4; border: 2px dashed #86efac; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .code { font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #15803d; }
    .footer { font-size: 14px; color: #64748b; line-height: 1.6; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 20px; }
    .regards { font-weight: 700; color: #0f172a; }
  </style>
</head>
<body>
  <div class="card">
    <div class="title">welcome to ECO AI-BOOT CAMP</div>
    <div class="subtitle">Here is your 6 digit verification code</div>
    <div class="code-box">
      <div class="code">${code}</div>
    </div>
    <div class="footer">
      <p style="margin: 0 0 4px 0;">thankyou</p>
      <p class="regards" style="margin: 0;">regards : Geminal studio</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  if (!transporter) {
    return {
      success: false,
      error: 'SMTP credentials not configured in environment',
    };
  }

  try {
    await transporter.sendMail({
      from,
      to: toEmail.trim(),
      subject: 'welcome to ECO AI-BOOT CAMP — Verification Code',
      text: textContent,
      html: htmlContent,
    });
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to deliver email via SMTP',
    };
  }
}

export interface SendApprovalEmailOptions {
  toEmail: string;
  fullName: string;
  registrationId: string;
}

/**
 * Send official bootcamp invitation & verification confirmed email
 */
export async function sendApprovalConfirmationEmail({
  toEmail,
  fullName,
  registrationId,
}: SendApprovalEmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!toEmail || /[\r\n]/.test(toEmail)) {
    return {
      success: false,
      error: 'Invalid recipient email address',
    };
  }

  const transporter = getEmailTransporter();
  const user = process.env.SMTP_USER || '';
  const from = process.env.SMTP_FROM || `"Geminal Studio" <${user || 'noreply@geminalstudio.com'}>`;

  const textContent = `welcome to ECO AI-BOOTCAMP 
verification confirmed! 
we officially invite you for ECO-BOOTCAMP 22nd october to 24 october

Registration ID: ${registrationId}
Participant Name: ${fullName}

thankyou 
regards : Geminal studio`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 36px 32px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }
    .badge { display: inline-block; background-color: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; }
    .title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0; letter-spacing: -0.02em; }
    .message { font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 20px 0; }
    .info-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px 20px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
    .info-row:last-child { margin-bottom: 0; }
    .info-label { color: #64748b; font-weight: 500; }
    .info-value { color: #0f172a; font-weight: 700; font-family: monospace; }
    .footer { font-size: 14px; color: #64748b; line-height: 1.6; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 20px; }
    .regards { font-weight: 700; color: #0f172a; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Verification Confirmed</div>
    <div class="title">welcome to ECO AI-BOOTCAMP</div>
    <div class="message">
      verification confirmed! We officially invite you for <strong>ECO-BOOTCAMP</strong> from <strong>22nd October to 24th October</strong>.
    </div>
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Participant:</span>
        <span class="info-value" style="font-family: inherit;">${fullName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Registration ID:</span>
        <span class="info-value">${registrationId}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Dates:</span>
        <span class="info-value" style="font-family: inherit;">22nd October to 24th October 2026</span>
      </div>
      <div class="info-row">
        <span class="info-label">Status:</span>
        <span class="info-value" style="color: #16a34a;">CONFIRMED & INVITED</span>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0 0 4px 0;">thankyou</p>
      <p class="regards" style="margin: 0;">regards : Geminal studio</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  if (!transporter) {
    return {
      success: false,
      error: 'SMTP credentials not configured in environment',
    };
  }

  try {
    await transporter.sendMail({
      from,
      to: toEmail.trim(),
      subject: 'welcome to ECO AI-BOOTCAMP — Verification Confirmed & Official Invitation',
      text: textContent,
      html: htmlContent,
    });
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to deliver approval invitation email',
    };
  }
}

export interface SendRejectionEmailOptions {
  toEmail: string;
  fullName: string;
  registrationId: string;
  rejectionReason: string;
}

/**
 * Send payment verification rejection notice with admin reason
 */
export async function sendRejectionEmail({
  toEmail,
  fullName,
  registrationId,
  rejectionReason,
}: SendRejectionEmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!toEmail || /[\r\n]/.test(toEmail)) {
    return {
      success: false,
      error: 'Invalid recipient email address',
    };
  }

  const transporter = getEmailTransporter();
  const user = process.env.SMTP_USER || '';
  const from = process.env.SMTP_FROM || `"Geminal Studio" <${user || 'noreply@geminalstudio.com'}>`;

  const reasonText = rejectionReason ? rejectionReason.trim() : 'Transaction reference could not be verified in official bank statements';

  const textContent = `welcome to ECO AI-BOOTCAMP 
Payment Verification Update

Hello ${fullName},
Your payment verification for ECO AI-BOOTCAMP (Registration ID: ${registrationId}) could not be approved.

Reason provided by administrator:
${reasonText}

If you believe this is an error or wish to submit a corrected reference, please contact the coordinator or re-register.

thankyou 
regards : Geminal studio`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #fee2e2; padding: 36px 32px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }
    .badge { display: inline-block; background-color: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; }
    .title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0; letter-spacing: -0.02em; }
    .message { font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 20px 0; }
    .reason-box { background: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 18px 20px; margin: 20px 0; }
    .reason-title { font-size: 12px; font-weight: 700; color: #9f1239; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
    .reason-text { font-size: 14px; color: #881337; line-height: 1.5; font-weight: 600; }
    .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
    .info-row:last-child { margin-bottom: 0; }
    .info-label { color: #64748b; font-weight: 500; }
    .info-value { color: #0f172a; font-weight: 700; font-family: monospace; }
    .footer { font-size: 14px; color: #64748b; line-height: 1.6; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 20px; }
    .regards { font-weight: 700; color: #0f172a; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Payment Verification Rejected</div>
    <div class="title">welcome to ECO AI-BOOTCAMP</div>
    <div class="message">
      Hello <strong>${fullName}</strong>,<br>
      Your payment verification for ECO AI-BOOTCAMP could not be approved.
    </div>
    
    <div class="reason-box">
      <div class="reason-title">Reason from Administrator:</div>
      <div class="reason-text">${reasonText}</div>
    </div>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Registration ID:</span>
        <span class="info-value">${registrationId}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Status:</span>
        <span class="info-value" style="color: #dc2626;">PAYMENT REJECTED</span>
      </div>
    </div>

    <p style="font-size: 13px; color: #64748b; margin: 16px 0 0 0; line-height: 1.5;">
      If you believe this is an error or wish to submit a corrected reference, please contact the coordinator or re-register.
    </p>

    <div class="footer">
      <p style="margin: 0 0 4px 0;">thankyou</p>
      <p class="regards" style="margin: 0;">regards : Geminal studio</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  if (!transporter) {
    return {
      success: false,
      error: 'SMTP credentials not configured in environment',
    };
  }

  try {
    await transporter.sendMail({
      from,
      to: toEmail.trim(),
      subject: 'welcome to ECO AI-BOOTCAMP — Payment Verification Update',
      text: textContent,
      html: htmlContent,
    });
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to deliver rejection email',
    };
  }
}


