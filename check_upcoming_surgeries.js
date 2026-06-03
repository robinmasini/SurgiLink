import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envLocal = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envLocal.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function checkSurgeries() {
    console.log('Fetching patients with future surgery dates...');
    const { data: patients, error } = await supabase
        .from('patients')
        .select('*')
        .order('date', { ascending: true });

    if (error) {
        console.error('Error fetching patients:', error);
        return;
    }

    console.log(`Total patients in system: ${patients.length}`);
    console.table(patients.map(p => ({
        id: p.id,
        name: p.name,
        phone: p.phone,
        surgery_date: p.date,
        created_at: p.created_at
    })));
}

checkSurgeries();
