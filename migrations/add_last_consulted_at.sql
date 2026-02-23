-- Migration: Add last_consulted_at to patients table
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS last_consulted_at TIMESTAMPTZ;
NOTIFY pgrst, 'reload schema';
