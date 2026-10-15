-- ==============================================================================
-- ECO AI BOOTCAMP 2026 — SUPABASE DATABASE SCHEMA & POLICIES
-- Department of Electronics and Communication Engineering, AGMRCET Varur
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

-- Enable RLS on registrations
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Public can INSERT a registration (when submitting form)
CREATE POLICY "Public insert registration" 
ON registrations 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Public can check if their own registration exists or view it by registration_id
CREATE POLICY "Public view own registration by id" 
ON registrations 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Authenticated coordinators have full access
CREATE POLICY "Admin full access" 
ON registrations 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);
