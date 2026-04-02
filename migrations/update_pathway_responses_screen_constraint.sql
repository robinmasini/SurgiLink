-- Update the CHECK constraint on pathway_responses table to allow new screens
-- Including: Bienvenue, J7, J2, J1_PreOp, J1, J4_Satisfaction, ESATIS

ALTER TABLE public.pathway_responses 
DROP CONSTRAINT IF EXISTS pathway_responses_screen_check;

-- Add the expanded constraint with all supported screens
ALTER TABLE public.pathway_responses 
ADD CONSTRAINT pathway_responses_screen_check 
CHECK (screen IN ('Bienvenue', 'J7', 'J3', 'J2', 'J1_PreOp', 'J0', 'J1', 'J4_Satisfaction', 'ESATIS'));
