-- Add clinic information fields to patients table
ALTER TABLE public.patients 
  ADD COLUMN IF NOT EXISTS clinic_name TEXT,
  ADD COLUMN IF NOT EXISTS clinic_image_url TEXT,
  ADD COLUMN IF NOT EXISTS appointment_datetime TIMESTAMPTZ;
