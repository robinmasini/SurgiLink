import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
import { getScreenItems } from './src/config/pathway.config.js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function check() {
    const { data } = await supabase.from('pathway_responses').select('screen, item_id, response').eq('patient_id', 47);
    
    const aggregated = {};
    data.forEach(row => {
        const value = row.response?.value;
        const itemId = row.item_id;
        aggregated[itemId] = value;
    });
    
    console.log("Aggregated:", aggregated);
    
    const isMilestoneComplete = (milestoneId) => {
        if (milestoneId === 'Bienvenue') return true;
        const items = getScreenItems(milestoneId);
        const required = items.filter(i => i.required !== false && i.type !== 'text' && i.type !== 'verbatim');
        if (required.length === 0) return true;
        return required.every(i => {
            const val = aggregated[i.id];
            console.log("Checking", i.id, "value is", val);
            return val !== undefined && val !== null && val !== '';
        });
    };
    
    console.log("Is J7 complete?", isMilestoneComplete('J7'));
}
check();
