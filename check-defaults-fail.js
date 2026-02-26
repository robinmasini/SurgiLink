
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDefaults() {
    console.log('Checking column defaults...');
    const { data: cols, error } = await supabase.rpc('get_column_defaults', { table_name: 'sms_logs' });

    if (error) {
        // Fallback: check via information_schema if RPC fails
        const { data: info, error: infoError } = await supabase
            .from('information_schema.columns')
            .select('column_name, column_default')
            .eq('table_name', 'sms_logs');

        if (infoError) {
            console.error('Error fetching defaults:', infoError);
        } else {
            console.table(info);
        }
    } else {
        console.table(cols);
    }
}

// Since RPC might not exist, let's just try direct select on information_schema (might need bypass RLS via service role but we don't have it)
// Actually, let's just try to check if we can insert with an explicit user_id for testing in another script
console.log('Skipping direct defaults check (likely restricted). Using test insertion instead.');
