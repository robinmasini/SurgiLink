-- TEMPORARY: Allow all anon access to pathway_responses to debug
-- DO NOT KEEP THIS IN PRODUCTION

DROP POLICY IF EXISTS "Portal: Patients can manage responses via token" ON public.pathway_responses;

CREATE POLICY "Debug: Temp allow all anon" 
ON public.pathway_responses 
FOR ALL 
TO anon 
USING (true) 
WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
