
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIds() {
    console.log('Checking user_id for patient 10...');
    const { data: p, error } = await supabase
        .from('patients')
        .select('id, name, user_id')
        .eq('id', 10)
        .single();

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Patient 10:', p);
    }
}

checkIds();
