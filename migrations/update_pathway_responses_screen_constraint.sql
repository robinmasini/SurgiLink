-- Update the CHECK constraint on pathway_responses table to allow new screens
-- First, find the name of the existing constraint (it's often automatically named something like 'pathway_responses_screen_check')
-- To be safe, we'll try to drop the standard name and then re-add it.

ALTER TABLE public.pathway_responses 
DROP CONSTRAINT IF EXISTS pathway_responses_screen_check;

-- Add the expanded constraint
ALTER TABLE public.pathway_responses 
ADD CONSTRAINT pathway_responses_screen_check 
CHECK (screen IN ('J7', 'J3', 'J2', 'J1_PreOp', 'J0', 'J1', 'J2_Satisfaction'));

-- Also verify if the RLS policies need adjustment (usually they use auth.uid() = user_id, which should be fine for new screens)
