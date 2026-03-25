
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkRecentLogs() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
        .from('sms_logs')
        .select('*')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${data?.length || 0} logs for today.`);
    if (data && data.length > 0) {
        console.log(JSON.stringify(data.slice(0, 3), null, 2));
    }
}

checkRecentLogs();
