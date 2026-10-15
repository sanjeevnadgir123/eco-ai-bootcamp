-- ==============================================================================
-- ECO AI BOOTCAMP — NEON POSTGRES DATABASE SCHEMA
-- Department of Electronics and Communication Engineering, AGMRCET Varur
-- Run this in the Neon Console: https://console.neon.tech -> SQL Editor
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- MIGRATION: Drop attendance eligibility column & table if previously created
-- ------------------------------------------------------------------------------
ALTER TABLE registrations DROP COLUMN IF EXISTS is_eligible;
DROP TABLE IF EXISTS attendance_eligibility CASCADE;
DROP FUNCTION IF EXISTS check_attendance_eligibility CASCADE;

-- ------------------------------------------------------------------------------
-- 1. Create Registrations Table (Clean schema without attendance eligibility)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    fee_amount INTEGER NOT NULL DEFAULT 200,
    utr_number TEXT UNIQUE NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION' CHECK (payment_status IN ('PENDING_PAYMENT', 'PENDING_VERIFICATION', 'APPROVED', 'REJECTED')),
    registration_status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (registration_status IN ('DRAFT', 'SUBMITTED', 'CONFIRMED')),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ
);

-- ------------------------------------------------------------------------------
-- 2. Create Email Verifications Table (Server-side OTP & Verification State)
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 3. Indexes for Fast Lookup
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_utr ON registrations(utr_number);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_email_verif_lookup ON email_verifications(LOWER(email));
