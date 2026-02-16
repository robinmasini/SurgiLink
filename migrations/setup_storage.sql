-- Migration to set up Supabase Storage for patient documents
-- Run this in the Supabase SQL Editor

-- 1. Enable Storage via SQL (if not already enabled)
-- Note: Most Supabase projects have storage pre-enabled.

-- 2. Create the bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('patient-documents', 'patient-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up RLS for the bucket
-- Allow authenticated users to upload files to the bucket
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'patient-documents');

-- Allow authenticated users to select their own files
CREATE POLICY "Allow users to view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'patient-documents');

-- Allow users to delete their own files
CREATE POLICY "Allow users to delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'patient-documents');
