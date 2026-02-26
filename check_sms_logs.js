
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkLogs() {
    const { data, error } = await supabase
        .from('sms_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching logs:', error);
        return;
    }

    console.log('--- Last 10 SMS Logs ---');
    data.forEach(log => {
        console.log(`[${log.created_at}] To: ${log.phone_number} | Status: ${log.status} | Template: ${log.template_key}`);
        if (log.status === 'failed') {
            console.log(`   Error: ${log.error_message}`);
        }
    });
}

checkLogs();
