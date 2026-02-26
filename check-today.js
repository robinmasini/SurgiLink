
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log(`Checking for ANY patient created since ${today.toISOString()}...`);

    const { data: patients, error } = await supabase
        .from('patients')
        .select('*')
        .gte('created_at', today.toISOString());

    if (error) {
        console.error('Error:', error);
    } else if (patients.length === 0) {
        console.log('Zero patients found created today.');
    } else {
        console.table(patients.map(p => ({
            id: p.id,
            name: p.name,
            phone: p.phone,
            created_at: p.created_at
        })));
    }
}

checkToday();
