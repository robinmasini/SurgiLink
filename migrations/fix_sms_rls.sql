-- Allow anon to log SMS attempts
DROP POLICY IF EXISTS "Anon can insert logs" ON public.sms_logs;
CREATE POLICY "Anon can insert logs" 
ON public.sms_logs 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Allow anon to update reminder queue
DROP POLICY IF EXISTS "Anon can update reminders" ON public.reminder_queue;
CREATE POLICY "Anon can update reminders" 
ON public.reminder_queue 
FOR ALL 
TO anon 
USING (true)
WITH CHECK (true);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
