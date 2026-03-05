
-- Migration: Allow patient portal to access documents
-- Purpose: Grant anonymous access to document metadata and storage for token-verified patients

-- 1. Ensure anon can use the public schema and execute the helper function
GRANT USAGE ON SCHEMA public TO anon;
GRANT EXECUTE ON FUNCTION has_valid_patient_token(bigint) TO anon;

-- 2. Allow ANON users to SELECT from patient_documents table
-- We first drop the old policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Allow patient portal to read own documents" ON public.patient_documents;
CREATE POLICY "Allow patient portal to read own documents"
ON public.patient_documents
FOR SELECT
TO anon
USING (has_valid_patient_token(patient_id));

-- 3. Allow ANON users to READ from the patient-documents storage bucket
-- We also allow viewing objects in that bucket
DROP POLICY IF EXISTS "Allow patient portal to read own storage objects" ON storage.objects;
CREATE POLICY "Allow patient portal to read own storage objects"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'patient-documents');

-- 4. Grant explicit SELECT permission on the table to the anon role
GRANT SELECT ON public.patient_documents TO anon;
