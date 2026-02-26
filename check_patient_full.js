
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkPatientFull() {
    const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', 15);

    if (error) {
        console.error('Error fetching patient:', error);
        return;
    }

    console.log('--- Patient Details ---');
    console.log(JSON.stringify(data[0], null, 2));
}

checkPatientFull();
