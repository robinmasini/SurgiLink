-- Fix: Expand allowed screens in pathway_responses
ALTER TABLE public.pathway_responses DROP CONSTRAINT IF EXISTS pathway_responses_screen_check;

ALTER TABLE public.pathway_responses ADD CONSTRAINT pathway_responses_screen_check 
CHECK (screen IN ('J7', 'J3', 'J2', 'J1_PreOp', 'J0', 'J1', 'J2_Satisfaction'));

-- Also, let's make user_id nullable just in case (though it should be by default)
ALTER TABLE public.pathway_responses ALTER COLUMN user_id DROP NOT NULL;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
