import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkLogs() {
    const { data, error } = await supabase.from('sms_logs').select('phone_number, status, error_message, metadata').order('created_at', { ascending: false }).limit(2);
    console.log(JSON.stringify(data, null, 2));
}
checkLogs();
