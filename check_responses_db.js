import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function check() {
    const { data } = await supabase.from('pathway_responses').select('*').eq('patient_id', 47);
    console.log(data.map(d => ({ screen: d.screen, item_id: d.item_id, val: d.response?.value, updated: d.updated_at })));
}
check();
