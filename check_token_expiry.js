
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkTokenExpiry() {
    const { data: tokens, error } = await supabase
        .from('patient_review_tokens')
        .select('token, patient_id, expires_at, is_active')
        .eq('patient_id', 29);

    if (error) {
        console.error('Error fetching tokens:', error);
        return;
    }

    console.log('--- Token Expiry for Patient 29 ---');
    tokens.forEach(t => {
        console.log(`Token: ${t.token.substring(0, 8)}... | Active: ${t.is_active} | Expires: ${t.expires_at}`);
    });
}

checkTokenExpiry();
