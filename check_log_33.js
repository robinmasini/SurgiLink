
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkPatientLog() {
    const { data, error } = await supabase
        .from('sms_logs')
        .select('*')
        .eq('patient_id', 33)
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(JSON.stringify(data, null, 2));
}

checkPatientLog();
