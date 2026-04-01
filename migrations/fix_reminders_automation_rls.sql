-- Migration: Support for automated SMS processing
-- Purpose: Ensure that system-level processes (like Vercel Cron) can log SMS activity
-- even when no user is logged in (auth.uid() is null).

-- 1. Ensure user_id is nullable on sms_logs and reminder_queue
ALTER TABLE public.sms_logs ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.reminder_queue ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add comment for clarity
COMMENT ON COLUMN public.sms_logs.user_id IS 'Can be NULL for automated system-level logs';
COMMENT ON COLUMN public.reminder_queue.user_id IS 'Can be NULL for automated system-level reminders';

-- 3. Safety: Ensure RLS is still enabled but service_role can bypass (managed by Supabase)
-- We don't need to add specific 'anon' policies because the Vercel function will use service_role.

NOTIFY pgrst, 'reload schema';
