
-- Fix RLS for reminder_queue and sms_logs to use patient ownership instead of direct user_id column
-- This is more robust for internal system actions

-- 1. Reminder Queue
DROP POLICY IF EXISTS "Users can view their own reminders" ON public.reminder_queue;
DROP POLICY IF EXISTS "Users can insert reminders" ON public.reminder_queue;
DROP POLICY IF EXISTS "Users can update their own reminders" ON public.reminder_queue;

CREATE POLICY "Staff can manage reminders for their patients" ON public.reminder_queue
FOR ALL TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.patients WHERE patients.id = reminder_queue.patient_id AND patients.user_id = auth.uid())
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.patients WHERE patients.id = reminder_queue.patient_id AND patients.user_id = auth.uid())
);

-- 2. SMS Logs
DROP POLICY IF EXISTS "Users can view their own sms logs" ON public.sms_logs;
DROP POLICY IF EXISTS "Users can insert sms logs" ON public.sms_logs;
DROP POLICY IF EXISTS "Users can update their own sms logs" ON public.sms_logs;

CREATE POLICY "Staff can manage sms logs for their patients" ON public.sms_logs
FOR ALL TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.patients WHERE patients.id = sms_logs.patient_id AND patients.user_id = auth.uid())
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.patients WHERE patients.id = sms_logs.patient_id AND patients.user_id = auth.uid())
);
