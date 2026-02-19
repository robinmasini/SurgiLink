-- Migration: Create patient_review_tokens table and setup RLS for portal access
-- Last Updated: 2026-02-19

-- 1. Create the tokens table
CREATE TABLE IF NOT EXISTS public.patient_review_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id BIGINT REFERENCES public.patients(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    last_accessed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- Enable RLS
ALTER TABLE public.patient_review_tokens ENABLE ROW LEVEL SECURITY;

-- 2. Staff Policies (Authenticated)
CREATE POLICY "Staff can manage tokens for their patients" 
ON public.patient_review_tokens 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Patient Portal Policies (Public access with token)
-- We need to allow anonymous users to view specific data if they have a valid token

-- Policy for Tokens themselves: allow anon to select/update their own token (if they know the string)
CREATE POLICY "Portal: Anon can verify tokens" 
ON public.patient_review_tokens 
FOR SELECT 
TO anon 
USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Portal: Anon can update access time" 
ON public.patient_review_tokens 
FOR UPDATE 
TO anon 
USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()))
WITH CHECK (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- Policy for Patients table: allow select if token is valid
CREATE POLICY "Portal: Patients can view own data via token" 
ON public.patients 
FOR SELECT 
TO anon
USING (
    EXISTS (
        SELECT 1 FROM public.patient_review_tokens 
        WHERE patient_review_tokens.patient_id = patients.id 
        AND patient_review_tokens.is_active = true 
        AND (patient_review_tokens.expires_at IS NULL OR patient_review_tokens.expires_at > NOW())
    )
);

-- Policy for Medical History: allow select if token is valid for the patient
CREATE POLICY "Portal: Patients can view history via token" 
ON public.medical_history 
FOR SELECT 
TO anon
USING (
    EXISTS (
        SELECT 1 FROM public.patient_review_tokens 
        WHERE patient_review_tokens.patient_id = medical_history.patient_id 
        AND patient_review_tokens.is_active = true 
        AND (patient_review_tokens.expires_at IS NULL OR patient_review_tokens.expires_at > NOW())
    )
);

-- Policy for Pathway Responses: allow select/insert/update if token is valid
CREATE POLICY "Portal: Patients can manage responses via token" 
ON public.pathway_responses 
FOR ALL 
TO anon
USING (
    EXISTS (
        SELECT 1 FROM public.patient_review_tokens 
        WHERE patient_review_tokens.patient_id = pathway_responses.patient_id 
        AND patient_review_tokens.is_active = true 
        AND (patient_review_tokens.expires_at IS NULL OR patient_review_tokens.expires_at > NOW())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.patient_review_tokens 
        WHERE patient_review_tokens.patient_id = pathway_responses.patient_id 
        AND patient_review_tokens.is_active = true 
        AND (patient_review_tokens.expires_at IS NULL OR patient_review_tokens.expires_at > NOW())
    )
);

-- Policy for Patient Documents: allow select if token is valid
CREATE POLICY "Portal: Patients can view documents via token" 
ON public.patient_documents 
FOR SELECT 
TO anon
USING (
    EXISTS (
        SELECT 1 FROM public.patient_review_tokens 
        WHERE patient_review_tokens.patient_id = patient_documents.patient_id 
        AND patient_review_tokens.is_active = true 
        AND (patient_review_tokens.expires_at IS NULL OR patient_review_tokens.expires_at > NOW())
    )
);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
