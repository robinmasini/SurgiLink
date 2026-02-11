-- Migration: Update patients table for overhauling review
-- Add surgeon info, surgery time, and stay type

ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS surgeon_name TEXT DEFAULT 'Christophe DESOUCHES',
ADD COLUMN IF NOT EXISTS surgery_time TEXT,
ADD COLUMN IF NOT EXISTS stay_type TEXT DEFAULT 'Ambulatoire',
ADD COLUMN IF NOT EXISTS score_status TEXT DEFAULT 'SAIN';
