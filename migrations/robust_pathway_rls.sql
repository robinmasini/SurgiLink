-- Robust Fix: Use a more direct RLS policy for pathway_responses
-- and ensure the anon user can see the necessary token data for the subquery.

-- 1. Ensure anon can see the patient_id in tokens (needed for subquery)
DROP POLICY IF EXISTS "Portal: Anon can verify tokens" ON public.patient_review_tokens;
CREATE POLICY "Portal: Anon can verify tokens" 
ON public.patient_review_tokens 
FOR SELECT 
TO anon 
USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- 2. Refine the pathway_responses policy
DROP POLICY IF EXISTS "Portal: Patients can manage responses via token" ON public.pathway_responses;
DROP POLICY IF EXISTS "Debug: Temp allow all anon" ON public.pathway_responses;

-- We use a more explicit check
CREATE POLICY "Portal: Patients can manage responses via token" 
ON public.pathway_responses 
FOR ALL 
TO anon
USING (
    patient_id IN (
        SELECT t.patient_id 
        FROM public.patient_review_tokens t 
        WHERE t.is_active = true 
        AND (t.expires_at IS NULL OR t.expires_at > NOW())
    )
)
WITH CHECK (
    patient_id IN (
        SELECT t.patient_id 
        FROM public.patient_review_tokens t 
        WHERE t.is_active = true 
        AND (t.expires_at IS NULL OR t.expires_at > NOW())
    )
);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
