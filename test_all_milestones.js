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
    
    const isMilestoneComplete = (milestoneId) => {
        const items = getScreenItems(milestoneId);
        const required = items.filter(i => i.required !== false && i.type !== 'text' && i.type !== 'verbatim');
        if (required.length === 0) return true;
        return required.every(i => {
            const val = aggregated[i.id];
            return val !== undefined && val !== null && val !== '';
        });
    };
    
    ['Bienvenue', 'J7', 'J2', 'J1_PreOp', 'J1', 'J4_Satisfaction', 'ESATIS'].forEach(m => {
        console.log(`Is ${m} complete?`, isMilestoneComplete(m));
    });
}
check();
