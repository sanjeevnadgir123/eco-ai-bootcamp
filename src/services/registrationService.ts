import { StudentRegistration, PaymentStatus, RegistrationStatus } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { neonService } from './neonService';

const REGISTRATIONS_STORAGE_KEY = 'eco_bootcamp_registrations_v2';

// Seed realistic initial registrations for the admin dashboard demo
const INITIAL_SEED_REGISTRATIONS: StudentRegistration[] = [
  {
    id: 'reg_seed_001',
    registrationId: 'ECO-AI-2026-1048',
    fullName: 'Rohan Sharma',
    email: 'rohan.ece@agmrcet.ac.in',
    phone: '9845012345',
    usn: '2AG22EC045',
    semester: '5th Semester',
    feeAmount: 200,
    utrNumber: '429184719283',
    paymentStatus: 'APPROVED',
    registrationStatus: 'CONFIRMED',
    createdAt: '2026-10-10T11:20:00Z',
    approvedAt: '2026-10-10T14:35:00Z',
  },
  {
    id: 'reg_seed_002',
    registrationId: 'ECO-AI-2026-1049',
    fullName: 'Ananya Patil',
    email: 'ananya.p@agmrcet.ac.in',
    phone: '9741823940',
    usn: '2AG23EC012',
    semester: '3rd Semester',
    feeAmount: 200,
    utrNumber: '429193859102',
    paymentStatus: 'PENDING_VERIFICATION',
    registrationStatus: 'SUBMITTED',
    createdAt: '2026-10-12T09:15:00Z',
  },
  {
    id: 'reg_seed_003',
    registrationId: 'ECO-AI-2026-1050',
    fullName: 'Karthik Hegde',
    email: 'karthik.hegde@gmail.com',
    phone: '9980123849',
    usn: '2AG21EC089',
    semester: '7th Semester',
    feeAmount: 200,
    utrNumber: '429204918274',
    paymentStatus: 'PENDING_VERIFICATION',
    registrationStatus: 'SUBMITTED',
    createdAt: '2026-10-13T16:40:00Z',
  },
  {
    id: 'reg_seed_004',
    registrationId: 'ECO-AI-2026-1051',
    fullName: 'Megha Kulkarni',
    email: 'megha.k@agmrcet.ac.in',
    phone: '9448123901',
    usn: '2AG22EC034',
    semester: '5th Semester',
    feeAmount: 200,
    utrNumber: '429100293847',
    paymentStatus: 'APPROVED',
    registrationStatus: 'CONFIRMED',
    createdAt: '2026-10-11T13:00:00Z',
    approvedAt: '2026-10-11T15:20:00Z',
  },
  {
    id: 'reg_seed_005',
    registrationId: 'ECO-AI-2026-1052',
    fullName: 'Suresh Nayak',
    email: 'suresh.nayak@yahoo.com',
    phone: '9123456780',
    usn: '2AG22CS091',
    semester: '5th Semester',
    feeAmount: 200,
    utrNumber: '429011928374',
    paymentStatus: 'REJECTED',
    registrationStatus: 'SUBMITTED',
    rejectionReason: 'Invalid transaction UTR reference provided in payment slip',
    createdAt: '2026-10-09T18:10:00Z',
  },
];

function getStoredRegistrations(): StudentRegistration[] {
  try {
    // Try current storage key or migrate from v1
    let raw = localStorage.getItem(REGISTRATIONS_STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem('eco_bootcamp_registrations_v1');
    }
    if (raw) {
      const records = JSON.parse(raw);
      if (Array.isArray(records) && records.length > 0) {
        // Safe additive migration: patch any legacy record missing USN or Semester
        let patched = false;
        const normalized = records.map((r: any) => {
          let usn = r.usn;
          let semester = r.semester;
          if (!usn || !semester) {
            const seed = INITIAL_SEED_REGISTRATIONS.find((s) => s.registrationId === r.registrationId || s.email === r.email);
            if (seed) {
              usn = usn || seed.usn;
              semester = semester || seed.semester;
              patched = true;
            }
          }
          return {
            ...r,
            usn: usn ? String(usn).trim().toUpperCase() : (r.usn || ''),
            semester: semester ? String(semester).trim() : (r.semester || ''),
          };
        });
        if (patched || !localStorage.getItem(REGISTRATIONS_STORAGE_KEY)) {
          localStorage.setItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(normalized));
        }
        return normalized;
      }
    }
  } catch (err) {
    console.error('Failed reading local registrations:', err);
  }
  localStorage.setItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(INITIAL_SEED_REGISTRATIONS));
  return INITIAL_SEED_REGISTRATIONS;
}

function saveStoredRegistrations(records: StudentRegistration[]) {
  try {
    localStorage.setItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed storing registrations:', err);
  }
}

export const registrationService = {
  /**
   * Check if email is already registered in the system (checks Neon first)
   */
  async checkDuplicateEmail(email: string): Promise<boolean> {
    const normalized = email.trim().toLowerCase();

    // Check Neon backend
    try {
      const neonData = await neonService.checkEligibility(normalized);
      if (neonData && typeof neonData.alreadyRegistered === 'boolean') {
        return neonData.alreadyRegistered;
      }
    } catch (e) {
      console.warn('Neon duplicate check fallback:', e);
    }

    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('registrations')
        .select('id')
        .eq('email', normalized)
        .maybeSingle();
      return Boolean(data);
    }

    const records = getStoredRegistrations();
    return records.some((r) => r.email.toLowerCase() === normalized);
  },

  /**
   * Check if UTR is already used in another registration
   */
  async checkDuplicateUtr(utr: string): Promise<boolean> {
    const normalized = utr.trim().toUpperCase();

    // Check Neon backend
    try {
      const isDup = await neonService.checkDuplicateUtr(normalized);
      if (typeof isDup === 'boolean') {
        return isDup;
      }
    } catch (e) {
      console.warn('Neon UTR duplicate check fallback:', e);
    }

    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('registrations')
        .select('id')
        .eq('utr_number', normalized)
        .maybeSingle();
      return Boolean(data);
    }

    const records = getStoredRegistrations();
    return records.some((r) => r.utrNumber?.toUpperCase() === normalized);
  },

  /**
   * Generate an official unique Registration ID (ECO-AI-2026-XXXX)
   */
  generateRegistrationId(): string {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `ECO-AI-2026-${randomSuffix}`;
  },

  /**
   * Create a new registration record with PENDING_VERIFICATION after UTR submission
   */
  async submitRegistration(params: {
    fullName: string;
    email: string;
    phone: string;
    usn?: string;
    semester?: string;
    isEligible?: boolean;
    feeAmount?: number;
    utrNumber: string;
    verificationToken?: string;
  }): Promise<StudentRegistration> {
    const normalizedEmail = params.email.trim().toLowerCase();
    const normalizedUtr = params.utrNumber.trim();

    // Check duplicate email
    const isDupEmail = await this.checkDuplicateEmail(normalizedEmail);
    if (isDupEmail) {
      throw new Error(`A registration already exists with email: ${normalizedEmail}`);
    }

    // Check duplicate UTR
    const isDupUtr = await this.checkDuplicateUtr(normalizedUtr);
    if (isDupUtr) {
      throw new Error(`This UTR transaction reference (${normalizedUtr}) has already been submitted.`);
    }

    // 1. Submit to Neon Serverless PostgreSQL Backend
    try {
      const savedNeon = await neonService.submitRegistration({
        fullName: params.fullName.trim(),
        email: normalizedEmail,
        phone: params.phone.trim(),
        usn: params.usn?.trim(),
        semester: params.semester?.trim(),
        feeAmount: params.feeAmount || 200,
        utrNumber: normalizedUtr,
        verificationToken: params.verificationToken,
      });

      if (savedNeon) {
        // Also update local cache
        const current = getStoredRegistrations();
        current.unshift(savedNeon);
        saveStoredRegistrations(current);
        return savedNeon;
      }
    } catch (neonErr: any) {
      // If error is duplicate or validation, throw it directly
      if (neonErr.message && !neonErr.message.includes('Failed to fetch')) {
        throw neonErr;
      }
      console.warn('Neon submit fallback:', neonErr);
    }

    const regId = this.generateRegistrationId();
    const newRecord: StudentRegistration = {
      id: `reg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      registrationId: regId,
      fullName: params.fullName.trim(),
      email: normalizedEmail,
      phone: params.phone.trim(),
      usn: params.usn?.trim(),
      semester: params.semester?.trim(),
      feeAmount: params.feeAmount || 200,
      utrNumber: normalizedUtr,
      paymentStatus: 'PENDING_VERIFICATION',
      registrationStatus: 'SUBMITTED',
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('registrations')
        .insert({
          registration_id: newRecord.registrationId,
          full_name: newRecord.fullName,
          email: newRecord.email,
          phone: newRecord.phone,
          usn: newRecord.usn,
          semester: newRecord.semester,
          is_eligible: newRecord.isEligible,
          fee_amount: newRecord.feeAmount,
          utr_number: newRecord.utrNumber,
          payment_status: newRecord.paymentStatus,
          registration_status: newRecord.registrationStatus,
        });

      if (error) {
        throw new Error(`Failed to save registration to database: ${error.message}`);
      }
      return newRecord;
    }

    // Save to local persistence
    const current = getStoredRegistrations();
    current.unshift(newRecord);
    saveStoredRegistrations(current);

    return newRecord;
  },

  /**
   * Fetch all registrations for Admin Dashboard
   */
  async getAllRegistrations(): Promise<StudentRegistration[]> {
    // 1. Try Neon Backend
    try {
      const neonRows = await neonService.getAllRegistrations();
      if (neonRows && Array.isArray(neonRows)) {
        return neonRows.map((row: any) => ({
          ...row,
          usn: row.usn ? String(row.usn).trim().toUpperCase() : '',
          semester: row.semester ? String(row.semester).trim() : '',
        }));
      }
    } catch (e) {
      console.warn('Neon fetch registrations fallback:', e);
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((row: any) => ({
          id: row.id,
          registrationId: row.registration_id,
          fullName: row.full_name,
          email: row.email,
          phone: row.phone,
          usn: row.usn ? String(row.usn).trim().toUpperCase() : '',
          semester: row.semester ? String(row.semester).trim() : '',
          isEligible: row.is_eligible,
          feeAmount: row.fee_amount,
          utrNumber: row.utr_number,
          paymentStatus: row.payment_status,
          registrationStatus: row.registration_status,
          rejectionReason: row.rejection_reason,
          createdAt: row.created_at,
          approvedAt: row.approved_at,
        }));
      }
    }

    return getStoredRegistrations();
  },

  /**
   * Update student registration details (USN, Semester, Name, Phone)
   */
  async updateRegistrationDetails(
    id: string,
    details: {
      usn?: string;
      semester?: string;
      fullName?: string;
      phone?: string;
    }
  ): Promise<StudentRegistration> {
    const trimmedUsn = details.usn ? details.usn.trim().toUpperCase() : undefined;
    const trimmedSemester = details.semester ? details.semester.trim() : undefined;
    const trimmedName = details.fullName ? details.fullName.trim() : undefined;
    const trimmedPhone = details.phone ? details.phone.trim() : undefined;

    // 1. Update Neon Backend
    try {
      const updatedNeon = await neonService.updateRegistrationDetails(id, {
        usn: trimmedUsn,
        semester: trimmedSemester,
        fullName: trimmedName,
        phone: trimmedPhone,
      });
      if (updatedNeon) {
        const current = getStoredRegistrations();
        const index = current.findIndex((r) => r.id === id || r.registrationId === id);
        if (index !== -1) {
          current[index] = { ...current[index], ...updatedNeon };
          saveStoredRegistrations(current);
        }
        return updatedNeon;
      }
    } catch (e: any) {
      console.warn('Neon update details fallback:', e);
    }

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('registrations')
        .update({
          usn: trimmedUsn,
          semester: trimmedSemester,
          full_name: trimmedName,
          phone: trimmedPhone,
        })
        .eq('id', id);
    }

    const current = getStoredRegistrations();
    const index = current.findIndex((r) => r.id === id || r.registrationId === id);
    if (index !== -1) {
      current[index] = {
        ...current[index],
        usn: trimmedUsn !== undefined ? trimmedUsn : current[index].usn,
        semester: trimmedSemester !== undefined ? trimmedSemester : current[index].semester,
        fullName: trimmedName !== undefined ? trimmedName : current[index].fullName,
        phone: trimmedPhone !== undefined ? trimmedPhone : current[index].phone,
        updatedAt: new Date().toISOString(),
      };
      saveStoredRegistrations(current);
      return current[index];
    }
    throw new Error('Registration record not found');
  },

  /**
   * Update payment status (Approve / Reject) by Administrator
   */
  async updatePaymentStatus(
    id: string,
    status: PaymentStatus,
    rejectionReason?: string
  ): Promise<void> {
    // 1. Update Neon Backend
    try {
      await neonService.updateRegistrationStatus(id, status, rejectionReason);
    } catch (e: any) {
      console.error('Neon update status error:', e);
      throw e;
    }

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('registrations')
        .update({
          payment_status: status,
          registration_status: status === 'APPROVED' ? 'CONFIRMED' : 'SUBMITTED',
          rejection_reason: rejectionReason || null,
          approved_at: status === 'APPROVED' ? new Date().toISOString() : null,
        })
        .eq('id', id);
    }

    const current = getStoredRegistrations();
    const index = current.findIndex((r) => r.id === id || r.registrationId === id);
    if (index !== -1) {
      current[index] = {
        ...current[index],
        paymentStatus: status,
        registrationStatus: status === 'APPROVED' ? 'CONFIRMED' : 'SUBMITTED',
        rejectionReason: status === 'REJECTED' ? rejectionReason : undefined,
        approvedAt: status === 'APPROVED' ? new Date().toISOString() : undefined,
        updatedAt: new Date().toISOString(),
      };
      saveStoredRegistrations(current);
    }
  },


  /**
   * Reset data back to initial demo seeds
   */
  resetToInitialSeeds(): void {
    localStorage.setItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(INITIAL_SEED_REGISTRATIONS));
  },
};
