
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function listTables() {
    // In Supabase, we can use RPC or query special tables if allowed, 
    // but easiest is to try to select from 'profiles' or 'users'
    const tables = ['profiles', 'users', 'nurses', 'practitioners', 'staff'];

    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (!error) {
            console.log(`Found table: ${table}`);
            console.log('Columns:', Object.keys(data[0] || {}));
        } else {
            console.log(`Table ${table} not found or not accessible: ${error.message}`);
        }
    }
}

listTables();
