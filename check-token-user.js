
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTokenUser() {
    const { data: t, error } = await supabase
        .from('patient_review_tokens')
        .select('id, patient_id, user_id')
        .eq('patient_id', 10)
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Token for Patient 10:', t);
    }
}

checkTokenUser();
