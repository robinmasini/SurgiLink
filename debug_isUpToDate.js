import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
import { getScreenItems } from './src/config/pathway.config.js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function debug() {
    const { data: patient } = await supabase.from('patients').select('*').eq('id', 47).single();
    const { data: responsesData } = await supabase.from('pathway_responses').select('*').eq('patient_id', 47);
    
    const aggregated = {};
    responsesData.forEach(row => {
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
            if (val === undefined || val === null || val === '') {
                console.log(`[DEBUG] Missing required item '${i.id}' in milestone '${milestoneId}'`);
                return false;
            }
            return true;
        });
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const surgeryDate = patient.date ? new Date(patient.date) : null;
    if (surgeryDate) surgeryDate.setHours(0, 0, 0, 0);
    const diffDays = surgeryDate ? Math.ceil((surgeryDate - today) / (1000 * 60 * 60 * 24)) : 999;
    
    console.log(`[DEBUG] diffDays = ${diffDays}`);

    const milestones = [
        { id: 'Bienvenue', offset: 99 },
        { id: 'J7', offset: 7 },
        { id: 'J2', offset: 2 },
        { id: 'J1_PreOp', offset: 1 },
        { id: 'J1', offset: -1 },
        { id: 'J4_Satisfaction', offset: -4 },
        { id: 'ESATIS', offset: -4 }
    ];

    let isUpToDate = true;
    for (const milestone of milestones) {
        if (diffDays <= milestone.offset) {
            const complete = isMilestoneComplete(milestone.id);
            console.log(`[DEBUG] Checking ${milestone.id} (offset ${milestone.offset}). Due? YES. Complete? ${complete}`);
            if (!complete) isUpToDate = false;
        } else {
            console.log(`[DEBUG] Checking ${milestone.id} (offset ${milestone.offset}). Due? NO.`);
        }
    }
    console.log(`[DEBUG] Final isUpToDate = ${isUpToDate}`);
}
debug();
