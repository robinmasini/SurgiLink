-- Refined Fix: Use IN instead of EXISTS for pathway_responses RLS
-- This is sometimes more compatible with how Supabase handles anon subqueries.

-- 1. Drop the problematic policy
DROP POLICY IF EXISTS "Portal: Patients can manage responses via token" ON public.pathway_responses;

-- 2. Create the refined policy
CREATE POLICY "Portal: Patients can manage responses via token" 
ON public.pathway_responses 
FOR ALL 
TO anon
USING (
    patient_id IN (
        SELECT patient_id 
        FROM public.patient_review_tokens 
        WHERE is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
    )
)
WITH CHECK (
    patient_id IN (
        SELECT patient_id 
        FROM public.patient_review_tokens 
        WHERE is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
    )
);

-- 3. Also ensure anon has SELECT on patient_review_tokens (already should have but let's be sure)
-- This is already covered by "Portal: Anon can verify tokens" but we'll leave it as is.

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
