
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

// USE SERVICE KEY TO BYPASS RLS
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY); // Wait, I need service key for real debug

async function checkEntireTable() {
    const { data, error } = await supabase
        .from('sms_logs')
        .select('*');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Total logs found: ${data.length}`);
    data.forEach(log => {
        console.log(`[${log.created_at}] To: ${log.phone_number} | Status: ${log.status}`);
    });
}

checkEntireTable();
