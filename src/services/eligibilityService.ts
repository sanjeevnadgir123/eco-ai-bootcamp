import { supabase, isSupabaseConfigured } from './supabaseClient';
import { neonService } from './neonService';

export interface EligibilityResult {
  isEligible: boolean;
  feeAmount: 100 | 200;
  categoryName: string;
  departmentNote?: string;
}

// Simulated backend private database for local preview/development
// (In production, this list resides solely on Neon/Supabase database)
const DEFAULT_PRIVATE_ELIGIBILITY_STORE: string[] = [
  'student@agmrcet.ac.in',
  'eco.member@agmrcet.ac.in',
  'ece.student@agmrcet.ac.in',
  'sumana.ece@agmrcet.ac.in',
  'guneet.dev@oscode.org',
  'topper.ece@agmrcet.ac.in',
  'test.eligible@agmrcet.ac.in',
];

const LOCAL_STORAGE_CUSTOM_ELIGIBLE_KEY = 'eco_private_eligibility_backend_list';

export function getBackendEligibleEmails(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CUSTOM_ELIGIBLE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return DEFAULT_PRIVATE_ELIGIBILITY_STORE;
}

export function saveBackendEligibleEmails(emails: string[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_CUSTOM_ELIGIBLE_KEY, JSON.stringify(emails));
  } catch (err) {
    console.error('Failed to save eligibility list:', err);
  }
}

export const eligibilityService = {
  /**
   * Evaluates the attendance eligibility of a verified email address.
   * Prioritizes Neon Postgres backend, then Supabase, then local preview.
   */
  async checkEligibility(
    email: string,
    simulateFailure: boolean = false
  ): Promise<EligibilityResult> {
    const normalizedEmail = email.trim().toLowerCase();

    // Simulated network roundtrip
    await new Promise((res) => setTimeout(res, 450));

    if (simulateFailure) {
      throw new Error('Eligibility validation service is temporarily unavailable. Please retry.');
    }

    // 1. Check live Neon Serverless PostgreSQL backend
    try {
      const neonResult = await neonService.checkEligibility(normalizedEmail);
      if (neonResult && typeof neonResult.isEligible === 'boolean') {
        return {
          isEligible: neonResult.isEligible,
          feeAmount: neonResult.feeAmount,
          categoryName: neonResult.categoryName,
          departmentNote: neonResult.departmentNote,
        };
      }
    } catch (err) {
      console.warn('Neon eligibility check fallback:', err);
    }

    // 2. If real Supabase client is configured, query Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('attendance_eligibility')
          .select('email, student_name')
          .eq('email', normalizedEmail)
          .maybeSingle();

        if (error) {
          throw new Error('Backend database error while verifying eligibility.');
        }

        const isEligible = Boolean(data);
        return {
          isEligible,
          feeAmount: isEligible ? 100 : 200,
          categoryName: isEligible
            ? 'Approved Attendance (ECO / ECE Special Tier)'
            : 'Standard Attendee Registration',
        };
      } catch (err) {
        console.error('Supabase eligibility check failed:', err);
        throw err;
      }
    }

    // 3. Local Preview Backend Mock Fallback
    const privateList = getBackendEligibleEmails();
    const isEligible = privateList.map((e) => e.toLowerCase()).includes(normalizedEmail);

    return {
      isEligible,
      feeAmount: isEligible ? 100 : 200,
      categoryName: isEligible
        ? 'Approved Attendance (ECO Association Eligible)'
        : 'Standard Participant Registration',
      departmentNote: isEligible
        ? 'Verified via Department Attendance Records: ₹100 applicable.'
        : 'Standard Student Tier: ₹200 applicable.',
    };
  },
};

