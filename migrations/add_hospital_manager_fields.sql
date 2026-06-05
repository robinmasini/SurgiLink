-- Migration: Add Hospital Manager fields to patients table
-- Run this in the Supabase SQL Editor

ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS ipp TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS stay_number TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS weight TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS height TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS referring_doctor TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS referring_doctor_phone TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS entry_mode TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS exit_mode TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS admission_datetime TIMESTAMPTZ;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS discharge_datetime TIMESTAMPTZ;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS room_number TEXT;
