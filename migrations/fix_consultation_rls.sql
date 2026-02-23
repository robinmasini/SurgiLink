-- Migration: Allow anon role to update last_consulted_at on patients table
-- This is scoped by the valid patient token

-- 1. Create the update policy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'patients' AND policyname = 'Portal: Patients can update consultation proof'
    ) THEN
        CREATE POLICY "Portal: Patients can update consultation proof" 
        ON public.patients 
        FOR UPDATE 
        TO anon 
        USING (has_valid_patient_token(id))
        WITH CHECK (has_valid_patient_token(id));
    END IF;
END
$$;

-- 2. Grant update permission on the patients table to anon role
GRANT UPDATE (last_consulted_at) ON public.patients TO anon;

NOTIFY pgrst, 'reload schema';
