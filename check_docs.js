
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkDocs() {
    const { data, error } = await supabase
        .from('patient_documents')
        .select('*');

    if (error) {
        console.error('Error fetching docs:', error);
        return;
    }

    console.log('--- All Documents ---');
    data.forEach(d => {
        console.log(`ID: ${d.id} | PatientID: ${d.patient_id} | Name: ${d.name} | Path: ${d.storage_path}`);
    });
}

checkDocs();
