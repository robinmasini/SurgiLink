-- Migration: Allow anonymous users with valid review tokens to update specific fields in patients table
-- This enables progress, status, last_consulted_at, and onboarding_completed_at sync from the patient portal.

-- 1. Drop existing policy if it exists
DROP POLICY IF EXISTS "Portal: Patients can update own data via token" ON public.patients;

-- 2. Create the update policy
CREATE POLICY "Portal: Patients can update own data via token"
ON public.patients
FOR UPDATE
TO anon
USING (
    id IN (
        SELECT patient_id
        FROM public.patient_review_tokens
        WHERE is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
    )
)
WITH CHECK (
    id IN (
        SELECT patient_id
        FROM public.patient_review_tokens
        WHERE is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
    )
);

-- 3. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
