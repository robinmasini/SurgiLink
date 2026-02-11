-- Create patient_documents table
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

-- Enable RLS
ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;

-- Policies
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

-- Note: Storage bucket 'patient-documents' must be created manually in Supabase dashboard or via API
