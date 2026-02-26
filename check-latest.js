
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLatest() {
    console.log('--- Latest Patient ---');
    const { data: patients } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (patients && patients.length > 0) {
        const p = patients[0];
        console.table([p]);

        console.log('\n--- SMS Logs for Patient ---');
        const { data: logs } = await supabase
            .from('sms_logs')
            .select('*')
            .eq('patient_id', p.id);
        console.table(logs);

        console.log('\n--- Reminder Queue for Patient ---');
        const { data: queue } = await supabase
            .from('reminder_queue')
            .select('*')
            .eq('patient_id', p.id);
        console.table(queue);

        console.log('\n--- Tokens for Patient ---');
        const { data: tokens } = await supabase
            .from('patient_review_tokens')
            .select('*')
            .eq('patient_id', p.id);
        console.table(tokens);
    } else {
        console.log('No patients found.');
    }
}

checkLatest();
