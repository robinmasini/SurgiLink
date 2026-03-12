import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Manual env loading
const envLocal = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envLocal.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function refreshStatuses() {
    console.log('Starting final status refresh with aggressive logic...');

    const { data: patients, error: pError } = await supabase
        .from('patients')
        .select('*');

    if (pError) return console.error(pError);

    for (const patient of patients) {
        try {
            const { data: responses } = await supabase
                .from('pathway_responses')
                .select('*')
                .eq('patient_id', patient.id);

            const progress = patient.progress || 0;
            const createdAt = new Date(patient.created_at);
            const surgeryDate = patient.date ? new Date(patient.date) : null;
            const now = new Date();
            const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
            const daysUntilSurgery = surgeryDate ? Math.ceil((surgeryDate - now) / (1000 * 60 * 60 * 24)) : 999;

            const hasAnyResponse = (responses || []).length > 0;
            const isJ7Complete = (responses || []).filter(r => r.screen === 'J7' && r.completed_at).length > 0;

            let status = 'neutre';

            if (progress === 100) {
                status = 'ready';
            } else {
                // Timing logic
                if (!hasAnyResponse && hoursSinceCreation > 24) {
                    status = 'alerte';
                } else if (!isJ7Complete && daysUntilSurgery <= 7) {
                    status = 'alerte';
                } else if (progress < 50 && daysUntilSurgery <= 7) {
                    status = 'alerte';
                }

                // Upgrade logic
                if ((status === 'alerte' || progress < 80) && daysUntilSurgery <= 3) {
                    status = 'critique';
                }

                if (status === 'neutre' && progress > 0) {
                    status = 'incomplete';
                }
            }

            if (status !== patient.status) {
                console.log(`Update ${patient.name} (${patient.id}): ${patient.status} -> ${status}`);
                await supabase.from('patients').update({ status }).eq('id', patient.id);
            }
        } catch (e) { console.error(e); }
    }
    console.log('Done.');
}

refreshStatuses();
