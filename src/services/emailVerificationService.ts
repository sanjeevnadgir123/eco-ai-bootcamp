export interface SendCodeResult {
  success: boolean;
  message: string;
  cooldownRemaining?: number;
  previewCode?: string;
  delivered?: boolean;
}

export interface VerifyCodeResult {
  success: boolean;
  message: string;
  verificationToken?: string;
}


const STORAGE_KEY = 'eco_verification_timestamps';
const COOLDOWN_SECONDS = 30;
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

function getLastSentTimestamp(email: string): number {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    return data[email.toLowerCase()] || 0;
  } catch {
    return 0;
  }
}

function saveLastSentTimestamp(email: string, ts: number) {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    data[email.toLowerCase()] = ts;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed saving verification timestamp:', err);
  }
}

export const emailVerificationService = {
  /**
   * Request a 6-digit OTP code to be sent to student's email.
   * Calls the Neon backend API which dispatches via Nodemailer and stores in Neon.
   */
  async sendVerificationCode(email: string): Promise<SendCodeResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const now = Date.now();
    const lastSent = getLastSentTimestamp(normalizedEmail);

    // Enforce 30s Cooldown
    if (now - lastSent < COOLDOWN_SECONDS * 1000) {
      const waitSec = Math.ceil((COOLDOWN_SECONDS * 1000 - (now - lastSent)) / 1000);
      return {
        success: false,
        message: `Please wait ${waitSec}s before requesting another verification code.`,
        cooldownRemaining: waitSec,
      };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          message: data.error || 'Failed to send verification code. Please try again.',
        };
      }

      saveLastSentTimestamp(normalizedEmail, now);
      return {
        success: true,
        message: data.message || `Verification code sent to ${normalizedEmail}. Please check your inbox.`,
        delivered: data.delivered,
      };
    } catch (err: any) {
      console.error('sendVerificationCode error:', err);
      return {
        success: false,
        message: 'Network error communicating with the verification server. Please retry.',
      };
    }
  },

  /**
   * Verify entered 6-digit OTP code against the Neon server backend
   */
  async verifyCode(email: string, inputCode: string): Promise<VerifyCodeResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedCode = inputCode.trim();

    if (!trimmedCode || trimmedCode.length !== 6) {
      return {
        success: false,
        message: 'Please enter a valid 6-digit verification code.',
      };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, code: trimmedCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          message: data.error || 'Invalid or expired verification code.',
        };
      }

      return {
        success: true,
        message: data.message || 'Email address verified successfully!',
        verificationToken: data.verificationToken,
      };

    } catch (err: any) {
      console.error('verifyCode error:', err);
      return {
        success: false,
        message: 'Network error validating code. Please retry.',
      };
    }
  },

  getCooldownRemaining(email: string): number {
    const normalizedEmail = email.trim().toLowerCase();
    const lastSent = getLastSentTimestamp(normalizedEmail);
    if (!lastSent) return 0;
    const diff = Date.now() - lastSent;
    const remaining = COOLDOWN_SECONDS - Math.floor(diff / 1000);
    return remaining > 0 ? remaining : 0;
  },
};
