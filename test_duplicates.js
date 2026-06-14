import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function check() {
    const { data } = await supabase.from('pathway_responses').select('*').eq('patient_id', 47);
    console.log(`Total rows: ${data.length}`);
    const items = data.map(d => d.item_id);
    const unique = new Set(items);
    console.log(`Unique items: ${unique.size}`);
}
check();
