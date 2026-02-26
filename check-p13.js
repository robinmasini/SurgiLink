
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check13() {
    const id = 13;
    console.log(`Checking logs and queue for Patient ${id}...`);

    const { data: logs } = await supabase
        .from('sms_logs')
        .select('*')
        .eq('patient_id', id);

    const { data: queue } = await supabase
        .from('reminder_queue')
        .select('*')
        .eq('patient_id', id);

    console.log('\n--- SMS Logs ---');
    console.table(logs);

    console.log('\n--- Reminder Queue ---');
    console.table(queue);

    const { data: tokens } = await supabase
        .from('patient_review_tokens')
        .select('*')
        .eq('patient_id', id);
    console.log('\n--- Tokens ---');
    console.table(tokens);
}

check13();
