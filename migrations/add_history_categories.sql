-- Add category column to medical_history table to distinguish between interventions and SMS
ALTER TABLE public.medical_history 
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'intervention' 
CHECK (category IN ('intervention', 'sms'));

-- Add index for category filtering
CREATE INDEX IF NOT EXISTS idx_medical_history_category ON public.medical_history(patient_id, category);
