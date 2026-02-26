
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findR() {
    console.log('Searching for patients starting with R...');
    const { data: patients, error } = await supabase
        .from('patients')
        .select('*')
        .ilike('name', 'R%');

    if (error) {
        console.error('Error:', error);
    } else {
        console.table(patients.map(p => ({
            id: p.id,
            name: p.name,
            phone: p.phone,
            date: p.date,
            created_at: p.created_at
        })));
    }
}

findR();
