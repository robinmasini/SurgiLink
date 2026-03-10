
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkTokens() {
    const { data, error } = await supabase
        .from('patient_review_tokens')
        .select('*');

    if (error) {
        console.error('Error fetching tokens:', error);
        return;
    }

    console.log('--- All Tokens ---');
    data.forEach(t => {
        console.log(`Token: ${t.token.substring(0, 8)}... | PatientID: ${t.patient_id} | Active: ${t.is_active}`);
    });
}

checkTokens();
