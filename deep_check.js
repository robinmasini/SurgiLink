
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkAll() {
    console.log('--- Checking patient_documents ---');
    const { data: d1, count: c1 } = await supabase.from('patient_documents').select('*', { count: 'exact' });
    console.log('Count:', c1, 'Data:', d1);

    console.log('\n--- Checking medical_history for documents ---');
    const { data: h1 } = await supabase.from('medical_history').select('*');
    if (h1) {
        h1.forEach(h => {
            if (h.file_url || h.storage_path) console.log('Found history with file:', h);
        });
    }

    console.log('\n--- Checking patients for documents ---');
    const { data: p1 } = await supabase.from('patients').select('*');
    if (p1) {
        p1.forEach(p => {
            // Look for any suspicious keys
            Object.keys(p).forEach(k => {
                if (k.includes('doc') || k.includes('url') || k.includes('path')) {
                    if (p[k]) console.log(`Patient ${p.id} has ${k}: ${p[k]}`);
                }
            });
        });
    }
}

checkAll();
