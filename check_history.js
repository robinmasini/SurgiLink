
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkHistory() {
    const { data, error } = await supabase
        .from('medical_history')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching history:', error);
        return;
    }

    console.log('--- Medical History Columns ---');
    if (data && data.length > 0) {
        console.log(Object.keys(data[0]));
    } else {
        console.log('No history found');
    }
}

checkHistory();
