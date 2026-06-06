import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    // Querying triggers on patients and reminder_queue
    const { data, error } = await supabase
        .rpc('get_triggers'); // But wait, rpc might not exist. Let's try direct sql or query schema
        
    if (error) {
        console.log("RPC get_triggers failed, trying raw query on triggers...");
        // If RPC fails, let's query the information_schema or just check if we can query pg_trigger
        const { data: triggers, error: tError } = await supabase
            .from('pg_trigger') // Might be blocked by RLS if using anon key, but let's check
            .select('*');
        if (tError) {
            console.error('Error querying pg_trigger:', tError);
        } else {
            console.log('Triggers:', triggers);
        }
    } else {
        console.log('Triggers via RPC:', data);
    }
}

run();
