-- Add DELETE policy for patients table if it doesn't exist
DROP POLICY IF EXISTS "Users can delete their patients" ON public.patients;

CREATE POLICY "Users can delete their patients" 
ON public.patients FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);
