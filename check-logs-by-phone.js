
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSms() {
    const phone = '+33603096001';
    console.log(`Checking logs for ${phone}...`);

    const { data: logs, error } = await supabase
        .from('sms_logs')
        .select('*')
        .ilike('phone_number', `%${phone}%`)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error:', error);
    } else if (logs.length === 0) {
        console.log('No logs found for this number.');

        console.log('\nChecking last 5 logs overall...');
        const { data: allLogs } = await supabase
            .from('sms_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
        console.table(allLogs);
    } else {
        console.table(logs);
    }
}

checkSms();
