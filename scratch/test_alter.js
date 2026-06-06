import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testAlter() {
    const sql = 'ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS ipp TEXT;';
    console.log('Attempting RPC exec_sql with query:', sql);
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
        console.error('Failed to run RPC exec_sql:', error.message);
    } else {
        console.log('Success!', data);
    }
}

testAlter();
