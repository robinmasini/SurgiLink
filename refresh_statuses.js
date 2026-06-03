import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Manual env loading to process.env so that pathways service gets credentials
const envLocal = fs.readFileSync('.env.local', 'utf8');
envLocal.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
    }
});

// Dynamically import pathwayService after process.env is set
const { calculateGlobalProgress } = await import('./src/services/pathwayService.js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function refreshStatuses() {
    console.log('Starting final status refresh with official service logic...');

    const { data: patients, error: pError } = await supabase
        .from('patients')
        .select('id, name');

    if (pError) return console.error(pError);

    for (const patient of patients) {
        try {
            console.log(`Recalculating status & progress for ${patient.name} (${patient.id})...`);
            const progress = await calculateGlobalProgress(patient.id);
            console.log(`-> Progress: ${progress}%`);
        } catch (e) {
            console.error(`Error updating patient ${patient.name} (${patient.id}):`, e);
        }
    }
    console.log('Done.');
}

refreshStatuses();

