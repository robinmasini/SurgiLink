-- Cleanup legacy reminders (J-3 and J+2) from the queue
-- Run this in the Supabase SQL Editor

DELETE FROM reminder_queue 
WHERE status = 'pending' 
AND (screen = 'J-3' OR screen = 'J+2');
