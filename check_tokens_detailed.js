
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkTokens() {
    const { data: tokens } = await supabase.from('patient_review_tokens').select('*').order('created_at', { ascending: false });
    const { data: patients } = await supabase.from('patients').select('id, name, created_at').order('created_at', { ascending: false });

    console.log('--- Patients ---');
    patients.forEach(p => console.log(`ID: ${p.id} | Name: ${p.name} | Created: ${p.created_at}`));

    console.log('\n--- Tokens ---');
    tokens.forEach(t => {
        const p = patients.find(p => p.id === t.patient_id);
        console.log(`Token: ${t.token} | Patient: ${p?.name} (ID: ${t.patient_id}) | Active: ${t.is_active} | Created: ${t.created_at}`);
    });
}

checkTokens();
