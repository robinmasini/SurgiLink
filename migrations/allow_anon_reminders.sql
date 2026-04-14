-- Allow anon to see the reminder queue for processing
DROP POLICY IF EXISTS "Anon can manage pending reminders" ON public.reminder_queue;
CREATE POLICY "Anon can manage pending reminders" 
ON public.reminder_queue 
FOR ALL 
TO anon 
USING (status = 'pending')
WITH CHECK (status IN ('pending', 'sent', 'failed'));

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
