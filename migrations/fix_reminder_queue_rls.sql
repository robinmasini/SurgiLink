-- Fix RLS Policies for reminder_queue to allow DELETE
-- First drop existing narrow policies if any (optional, but cleaner)
-- Or just add the missing ones

CREATE POLICY "Users can delete their own reminders" ON public.reminder_queue
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Ensure ALL is also covered for simplicity if intended
-- ALTER POLICY "Users can view their own reminders" ON public.reminder_queue RENAME TO "Users can manage their own reminders";
-- DROP POLICY "Users can insert reminders" ON public.reminder_queue;
-- DROP POLICY "Users can update their own reminders" ON public.reminder_queue;
-- CREATE POLICY "Users can manage their own reminders" ON public.reminder_queue FOR ALL TO authenticated USING (auth.uid() = user_id);
