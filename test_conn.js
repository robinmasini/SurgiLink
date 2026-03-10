
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function listTables() {
    const { data, error } = await supabase
        .from('patients')
        .select('*')
        .limit(1);

    // We can't easily list all tables via anon key without RPC or similar,
    // but we can try common ones or check the migration files.
    console.log('Checked patients table as connection test.');
}

listTables();
