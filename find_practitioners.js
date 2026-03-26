
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function findPractitioners() {
    const { data, error } = await supabase
        .from('patients')
        .select('surgeon_name')
        .not('surgeon_name', 'is', null);

    if (error) {
        console.error('Error:', error);
        return;
    }

    const uniqueSurgeons = [...new Set(data.map(d => d.surgeon_name))];
    console.log('Practitioners found in patients table:', uniqueSurgeons);
}

findPractitioners();
