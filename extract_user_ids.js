
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function extractUserIds() {
    const { data, error } = await supabase
        .from('patients')
        .select('user_id, surgeon_name')
        .not('user_id', 'is', null);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('User IDs found in patients table:', data);
}

extractUserIds();
