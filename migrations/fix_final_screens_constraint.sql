-- Final fix for pathway screen constraints
-- Allows all current screens used in the application logic
ALTER TABLE public.pathway_responses DROP CONSTRAINT IF EXISTS pathway_responses_screen_check;

ALTER TABLE public.pathway_responses ADD CONSTRAINT pathway_responses_screen_check 
CHECK (screen IN ('J7', 'J3', 'J2', 'J1_PreOp', 'J1-PreOp', 'J0', 'J1', 'J4', 'J4_Satisfaction', 'J2_Satisfaction'));

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
