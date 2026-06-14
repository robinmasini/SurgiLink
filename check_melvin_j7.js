import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function check() {
    const { data } = await supabase.from('pathway_responses').select('screen, item_id, response').eq('patient_id', 47);
    const j7 = data.filter(d => d.screen === 'J7');
    console.log("J7 responses:", j7.map(d => d.item_id));
}
check();
