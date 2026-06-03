import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

const envLocal = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envLocal.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function checkJoReminders() {
    // Jo LM id is 43
    const { data: patient, error: pError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', 43)
        .single();

    if (pError) {
        console.error('Error fetching patient:', pError);
        return;
    }

    console.log('--- Patient Info ---');
    console.log(patient);

    const { data: reminders, error: rError } = await supabase
        .from('reminder_queue')
        .select('*')
        .eq('patient_id', 43)
        .order('scheduled_for', { ascending: true });

    if (rError) {
        console.error('Error fetching reminders:', rError);
        return;
    }

    console.log('\n--- Reminders Queue ---');
    console.table(reminders.map(r => ({
        id: r.id,
        screen: r.screen,
        template_key: r.template_key,
        scheduled_for: r.scheduled_for,
        status: r.status,
        custom_message: r.custom_message,
        is_manual_override: r.is_manual_override,
        processed_at: r.processed_at
    })));
}

checkJoReminders();
