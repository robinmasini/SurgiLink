-- Combined Migration: Create table AND set up storage
-- Run this in the Supabase SQL Editor

-- 1. Create the database table for metadata
CREATE TABLE IF NOT EXISTS public.patient_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id BIGINT REFERENCES public.patients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    size TEXT,
    type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- 2. Enable RLS on the table
ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for the table
CREATE POLICY "Users can view their own patient documents" 
ON public.patient_documents FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert patient documents" 
ON public.patient_documents FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own patient documents" 
ON public.patient_documents FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- 4. Create the storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('patient-documents', 'patient-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 5. RLS Policies for the bucket objects
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'patient-documents');

CREATE POLICY "Allow users to view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'patient-documents');

CREATE POLICY "Allow users to delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'patient-documents');
