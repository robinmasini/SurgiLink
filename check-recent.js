
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecentPatients() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    console.log(`Checking patients created since ${yesterday.toISOString()}...`);

    const { data: patients, error } = await supabase
        .from('patients')
        .select('*')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error:', error);
    } else if (patients.length === 0) {
        console.log('No patients found in the last 24 hours.');

        console.log('\nChecking ALL patients (last 10)...');
        const { data: allPatients } = await supabase
            .from('patients')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
        console.table(allPatients);
    } else {
        console.table(patients);
    }
}

checkRecentPatients();
