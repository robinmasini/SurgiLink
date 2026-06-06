import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Searching for patients Melvin / ADL...');
    const { data: patients, error } = await supabase
        .from('patients')
        .select('*')
        .or('name.ilike.%Melvin%,name.ilike.%ADL%');

    if (error) {
        console.error('Error fetching patients:', error);
        return;
    }

    console.log(`Found ${patients.length} patients.`);
    for (const p of patients) {
        console.log('\n=========================================');
        console.log(`Patient: ${p.name} (ID: ${p.id})`);
        console.log(`Surgery Date: ${p.date}`);
        console.log(`Status: ${p.status} | Progress: ${p.progress}%`);
        console.log(`Last Consulted: ${p.last_consulted_at}`);
        console.log('-----------------------------------------');

        const { data: responses, error: respError } = await supabase
            .from('pathway_responses')
            .select('*')
            .eq('patient_id', p.id);

        if (respError) {
            console.error('Error fetching responses:', respError);
            continue;
        }

        console.log('Responses:');
        responses.forEach(r => {
            console.log(`  - [${r.screen}] ${r.item_id}: ${JSON.stringify(r.response?.value)} (Completed at: ${r.completed_at})`);
        });
    }
}

run();
