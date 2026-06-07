import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, anonKey);

async function checkMelvin() {
    const { data: patients, error: pError } = await supabase
        .from('patients')
        .select('id, name, date, phone')
        .ilike('name', '%Melvin%');

    if (pError) {
        console.error('Error fetching patient:', pError);
        return;
    }

    if (!patients || patients.length === 0) {
        console.log('Melvin not found');
        return;
    }

    console.log('Found Melvin:', patients);

    const { data: reminders, error: rError } = await supabase
        .from('reminder_queue')
        .select('*')
        .eq('patient_id', patients[0].id)
        .eq('status', 'pending')
        .order('scheduled_for', { ascending: true });

    if (rError) {
        console.error('Error fetching reminders:', rError);
        return;
    }

    console.table(reminders.map(r => ({
        screen: r.screen,
        scheduled_for: r.scheduled_for,
        status: r.status
    })));
}

checkMelvin();
