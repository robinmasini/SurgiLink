-- Comprehensive RLS for reminder_queue
-- This ensures staff can only manage reminders for patients they own
DROP POLICY IF EXISTS "Users can view their own reminders" ON public.reminder_queue;
DROP POLICY IF EXISTS "Users can insert reminders" ON public.reminder_queue;
DROP POLICY IF EXISTS "Users can update their own reminders" ON public.reminder_queue;
DROP POLICY IF EXISTS "Users can delete their own reminders" ON public.reminder_queue;

CREATE POLICY "Manage reminders" ON public.reminder_queue
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.patients 
            WHERE patients.id = reminder_queue.patient_id 
            AND patients.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.patients 
            WHERE patients.id = reminder_queue.patient_id 
            AND patients.user_id = auth.uid()
        )
    );
