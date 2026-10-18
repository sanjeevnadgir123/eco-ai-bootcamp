import { PaymentStatus } from '../types';

export interface NeonHealthStatus {
  status: string;
  database: string;
  postgresVersion?: string;
  registrationsCount: number;
  eligibleStudentsCount: number;
  timestamp?: string;
}


const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export const neonService = {
  /**
   * Check connection to Neon Serverless PostgreSQL
   */
  async checkHealth(): Promise<NeonHealthStatus | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/health`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  /**
   * Verify attendance eligibility and duplicate registration via Neon
   */
  async checkEligibility(email: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/eligibility?email=${encodeURIComponent(email)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  /**
   * Check if a transaction UTR is already in Neon
   */
  async checkDuplicateUtr(utr: string): Promise<boolean | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/check-utr?utr=${encodeURIComponent(utr)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return Boolean(data.isDuplicate);
    } catch {
      return null;
    }
  },

  /**
   * Fetch all registrations from Neon
   */
  async getAllRegistrations() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/registrations`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.registrations || [];
    } catch {
      return null;
    }
  },

  /**
   * Submit student registration directly into Neon
   */
  async submitRegistration(payload: {
    fullName: string;
    email: string;
    phone: string;
    usn?: string;
    semester?: string;
    isEligible?: boolean;
    feeAmount?: number;
    utrNumber: string;
    verificationToken?: string;
  }) {
    const res = await fetch(`${API_BASE_URL}/api/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });


    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to submit registration to Neon database');
    }
    return data.registration;
  },

  /**
   * Update registration status (Approve / Reject) in Neon
   */
  async updateRegistrationStatus(
    registrationId: string,
    paymentStatus: PaymentStatus,
    rejectionReason?: string
  ) {
    const res = await fetch(`${API_BASE_URL}/api/registrations/${registrationId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus, rejectionReason }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update status in Neon database');
    }
    return data.registration;
  },

  /**
   * Update student details (USN, Semester, Name, Phone) in Neon
   */
  async updateRegistrationDetails(
    registrationId: string,
    details: {
      usn?: string;
      semester?: string;
      fullName?: string;
      phone?: string;
    }
  ) {
    const res = await fetch(`${API_BASE_URL}/api/registrations/${registrationId}/details`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update registration details in Neon database');
    }
    return data.registration;
  },
};

