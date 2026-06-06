import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: patients, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

    if (error) {
        console.error('Error fetching patients:', error);
        return;
    }

    console.table(patients.map(p => ({
        id: p.id,
        name: p.name,
        date: p.date,
        status: p.status,
        progress: p.progress,
        created_at: p.created_at
    })));
}

run();
