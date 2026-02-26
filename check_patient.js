
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkPatient() {
    const { data, error } = await supabase
        .from('patients')
        .select('*')
        .ilike('name', '%Robin%');

    if (error) {
        console.error('Error fetching patients:', error);
        return;
    }

    console.log('--- Matching Patients ---');
    data.forEach(p => {
        console.log(`ID: ${p.id} | Name: ${p.name} | Phone: ${p.phone} | Created: ${p.created_at}`);
    });
}

checkPatient();
