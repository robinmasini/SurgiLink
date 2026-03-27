-- Add practitioner_id to profiles for nurse-practitioner affiliation
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS practitioner_id UUID REFERENCES public.profiles(id);

-- Rename "Infirmier Cabinet" to "Infirmier Christophe Desouches" if it exists
UPDATE public.profiles 
SET full_name = 'Infirmier Christophe Desouches' 
WHERE full_name = 'Infirmier Cabinet';

-- Affiliate the nurse to the practitioner
-- This assumes both profiles exist in the table. 
-- In a real scenario, we'd use their specific UUIDs.
DO $$
DECLARE
    practitioner_id_val UUID;
BEGIN
    SELECT id INTO practitioner_id_val FROM public.profiles WHERE full_name = 'Dr. Christophe DESOUCHES' LIMIT 1;
    
    IF practitioner_id_val IS NOT NULL THEN
        UPDATE public.profiles 
        SET practitioner_id = practitioner_id_val 
        WHERE full_name = 'Infirmier Christophe Desouches';
    END IF;
END $$;
