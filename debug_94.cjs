
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Mocking pathwayConfig and getScreenItems based on the real files
const pathwayConfig = {
    Bienvenue: { sections: [{ items: [{ id: "welcome_ok", required: true, type: "checkbox" }] }] },
    J7: { sections: [{ items: [
        { id: "anesthesia_consultation", required: true, type: "yes_no" },
        { id: "recent_symptoms", required: true, type: "yes_no" },
        { id: "blood_work", required: true, type: "yes_no" },
        { id: "companion_confirmed", required: true, type: "yes_no" },
        { id: "night_companion", required: true, type: "yes_no" },
        { id: "distance_urgency", required: true, type: "yes_no" }
    ] }] },
    J2: { sections: [{ items: [
        { id: "fasting_understood", required: true, type: "yes_no" },
        { id: "shower_understood", required: true, type: "yes_no" },
        { id: "recent_health_check", required: true, type: "yes_no" }
    ] }] },
    J1_PreOp: { sections: [{ items: [{ id: "admission_confirmed", required: true, type: "yes_no" }] }] },
    J1: { sections: [{ items: [
        { id: "pain_level", required: true, type: "rating" },
        { id: "general_state", required: true, type: "rating_state" },
        { id: "nausea_check", required: true, type: "yes_no" },
        { id: "site_check", required: true, type: "yes_no" },
        { id: "worry_check", required: true, type: "yes_no" },
        { id: "treatment_followup", required: true, type: "yes_no" }
    ] }] },
    J4_Satisfaction: { sections: [{ items: [{ id: "recommandation", required: true, type: "yes_no" }] }] },
    ESATIS: { sections: [{ items: [
        { id: "global_experience", required: false },
        { id: "recommend", required: false }
    ] }] }
};

function getScreenItems(screen) {
    const config = pathwayConfig[screen];
    if (!config) return [];
    return config.sections.flatMap(s => s.items);
}

async function debug94() {
    console.log('Searching for Delph Chiche...');
    const { data: patients } = await supabase.from('patients').select('id, name, progress').ilike('name', '%Delph%');
    if (!patients || !patients.length) return console.log('Patient not found');
    const p = patients[0];
    console.log('Patient:', p.name, 'ID:', p.id, 'Current Progress:', p.progress);

    const { data: responses } = await supabase.from('pathway_responses').select('*').eq('patient_id', p.id);
    
    // Build map using the SAME logic as calculateGlobalProgress
    const responseMap = {};
    (responses || []).forEach(r => {
        const key = `${r.screen}:${r.item_id}`;
        const lowerKey = `${r.screen.toLowerCase()}:${r.item_id}`;
        responseMap[key] = r.response?.value;
        responseMap[lowerKey] = r.response?.value;
        
        if (r.screen.toLowerCase() === 'j1preop' || r.screen.toLowerCase() === 'j1_preop') {
            responseMap[`J1_PreOp:${r.item_id}`] = r.response?.value;
            responseMap[`j1_preop:${r.item_id}`] = r.response?.value;
        }
    });

    let totalRequired = 0;
    let totalCompleted = 0;
    const screens = ['Bienvenue', 'J7', 'J2', 'J1_PreOp', 'J1', 'J4_Satisfaction', 'ESATIS'];

    console.log('\n--- Final Progress Analysis ---');
    screens.forEach(screen => {
        const items = getScreenItems(screen);
        const required = items.filter(i => i.required !== false && i.type !== 'text' && i.type !== 'verbatim');
        
        required.forEach(item => {
            totalRequired++;
            const val = responseMap[`${screen}:${item.id}`];
            const isDone = val !== undefined && val !== null && val !== '';
            if (isDone) totalCompleted++;
            
            console.log(`${screen.padEnd(15)} | ${item.id.padEnd(25)} | ${isDone ? 'OK' : 'MISSING'} | Val: ${val}`);
        });
    });

    const finalPerc = Math.round((totalCompleted / totalRequired) * 100);
    console.log(`\nTotal Required: ${totalRequired}`);
    console.log(`Total Completed: ${totalCompleted}`);
    console.log(`Final Calculated Percentage: ${finalPerc}%`);
}

debug94();
