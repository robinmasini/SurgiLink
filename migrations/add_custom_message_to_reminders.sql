-- Add custom message support to reminder_queue
ALTER TABLE public.reminder_queue ADD COLUMN IF NOT EXISTS custom_message TEXT;
ALTER TABLE public.reminder_queue ADD COLUMN IF NOT EXISTS is_manual_override BOOLEAN DEFAULT false;

-- Add J-3 and J+2 to scheduled reminders
-- (This is handled in JS code, but good to note here)
