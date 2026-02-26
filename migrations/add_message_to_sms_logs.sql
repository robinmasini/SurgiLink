-- Migration: Add message column and fix RLS for sms_logs
ALTER TABLE public.sms_logs ADD COLUMN IF NOT EXISTS message TEXT;

-- Relax RLS for staff to see all logs of their patients
DROP POLICY IF EXISTS "Users can view their own sms logs" ON public.sms_logs;
CREATE POLICY "Staff can view logs of their patients" ON public.sms_logs
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.patients p
        WHERE p.id = sms_logs.patient_id
        AND p.user_id = auth.uid()
    )
);

-- Portal access for anon users
DROP POLICY IF EXISTS "Portal: Patients can view logs via token" ON public.sms_logs;
CREATE POLICY "Portal: Patients can view logs via token" ON public.sms_logs
FOR SELECT TO anon
USING (
    EXISTS (
        SELECT 1 FROM public.patient_review_tokens t
        WHERE t.patient_id = sms_logs.patient_id
        AND t.is_active = true
        AND (t.expires_at IS NULL OR t.expires_at > NOW())
    )
);

-- Allow system-level inserts (relaxed user_id check)
DROP POLICY IF EXISTS "Users can insert sms logs" ON public.sms_logs;
CREATE POLICY "Allow authenticated or system to insert logs" ON public.sms_logs
FOR INSERT TO authenticated
WITH CHECK (true);
