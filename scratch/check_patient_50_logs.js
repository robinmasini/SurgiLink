import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('--- Patient 50 SMS Logs ---');
    const { data: logs, error: errorLogs } = await supabase
        .from('sms_logs')
        .select('*')
        .eq('patient_id', 50)
        .order('created_at', { ascending: false });

    if (errorLogs) {
        console.error('Error fetching logs:', errorLogs);
    } else {
        console.table(logs);
    }

    console.log('\n--- Patient 50 Reminder Queue ---');
    const { data: queue, error: errorQueue } = await supabase
        .from('reminder_queue')
        .select('*')
        .eq('patient_id', 50)
        .order('scheduled_for', { ascending: true });

    if (errorQueue) {
        console.error('Error fetching queue:', errorQueue);
    } else {
        console.table(queue);
    }
}

run();
