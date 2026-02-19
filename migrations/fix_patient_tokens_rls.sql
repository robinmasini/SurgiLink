-- Fix: Update RLS policies for patient_review_tokens to use patient ownership
-- This is more robust than checking the user_id column directly on the token table.

-- 1. Drop old policies if they exist (to avoid duplicates or conflicts)
DROP POLICY IF EXISTS "Staff can manage tokens for their patients" ON public.patient_review_tokens;

-- 2. New Staff Policy: Check if the practitioner owns the patient
CREATE POLICY "Staff can manage tokens for their patients" 
ON public.patient_review_tokens 
FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.patients 
        WHERE patients.id = patient_review_tokens.patient_id 
        AND patients.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.patients 
        WHERE patients.id = patient_review_tokens.patient_id 
        AND patients.user_id = auth.uid()
    )
);

-- Note: No changes needed for the "Portal: Anon" policies as they are based 
-- on the token string knowledge and expiration, which is correct for public access.

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
