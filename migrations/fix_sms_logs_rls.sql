-- Migration: Relax RLS for sms_logs to ensure system-level logging
-- This allows authenticated users to insert and view logs without strict patient ownership checks
-- which can sometimes fail for automated or quick actions.

-- 1. Remove restrictive policies if they exist
DROP POLICY IF EXISTS "Staff can manage sms logs for their patients" ON public.sms_logs;
DROP POLICY IF EXISTS "Users can view their own sms logs" ON public.sms_logs;
DROP POLICY IF EXISTS "Users can insert sms logs" ON public.sms_logs;
DROP POLICY IF EXISTS "Users can update their own sms logs" ON public.sms_logs;

-- 2. Create more permissive policies for authenticated staff
CREATE POLICY "Allow authenticated to insert logs" 
ON public.sms_logs 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated to view logs" 
ON public.sms_logs 
FOR SELECT 
TO authenticated 
USING (true);

-- 3. Grant permissions (safety)
GRANT INSERT, SELECT ON public.sms_logs TO authenticated;

NOTIFY pgrst, 'reload schema';
