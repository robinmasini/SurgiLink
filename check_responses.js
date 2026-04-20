
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDelph() {
    console.log('Searching for Delph Chiche...');
    const { data: patients, error: pError } = await supabase
        .from('patients')
        .select('id, name, progress')
        .ilike('name', '%Delph%');

    if (pError || !patients.length) {
        console.error('Patient not found', pError);
        return;
    }

    const patient = patients[0];
    console.log('Found patient:', patient);

    const { data: responses, error: rError } = await supabase
        .from('pathway_responses')
        .select('*')
        .eq('patient_id', patient.id);

    if (rError) {
        console.error('Error loading responses', rError);
        return;
    }

    console.log('\n--- Pathway Responses ---');
    console.table(responses.map(r => ({
        screen: r.screen,
        item_id: r.item_id,
        value: r.response?.value,
        updated_at: r.updated_at
    })));
}

checkDelph();
