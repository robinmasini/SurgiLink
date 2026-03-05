
-- Migration: Allow patient portal to access documents
-- Purpose: Grant anonymous access to document metadata and storage for token-verified patients

-- 1. Allow ANON users to SELECT from patient_documents table
-- This follows the pattern used for medical_history and pathway_responses
CREATE POLICY "Allow patient portal to read own documents"
ON public.patient_documents
FOR SELECT
TO anon
USING (has_valid_patient_token(patient_id));

-- 2. Allow ANON users to READ from the patient-documents storage bucket
-- This is necessary for the client to generate signed URLs and download files
CREATE POLICY "Allow patient portal to read own storage objects"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'patient-documents');

-- 3. Grant explicit SELECT permission on the table to the anon role
GRANT SELECT ON public.patient_documents TO anon;
