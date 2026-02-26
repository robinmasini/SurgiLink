
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllRecent() {
    console.log('--- Patients created in the last hour ---');
    const anHourAgo = new Date(Date.now() - 3600000).toISOString();

    const { data: patients, error } = await supabase
        .from('patients')
        .select('*')
        .gte('created_at', anHourAgo)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error:', error);
    } else {
        console.table(patients.map(p => ({
            id: p.id,
            name: p.name,
            date: p.date,
            created_at: p.created_at
        })));

        if (patients.length > 0) {
            const ids = patients.map(p => p.id);
            console.log('\n--- SMS Logs for these patients ---');
            const { data: logs } = await supabase
                .from('sms_logs')
                .select('*')
                .in('patient_id', ids);
            console.table(logs);

            console.log('\n--- Reminder Queue for these patients ---');
            const { data: queue } = await supabase
                .from('reminder_queue')
                .select('*')
                .in('patient_id', ids);
            console.table(queue);
        }
    }
}

checkAllRecent();
