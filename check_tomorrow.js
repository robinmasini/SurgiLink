import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envLocal = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envLocal.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function checkTomorrow() {
    const tomorrowStart = new Date('2026-06-03T00:00:00.000Z');
    const tomorrowEnd = new Date('2026-06-03T23:59:59.000Z');

    console.log(`Checking reminders scheduled for tomorrow (${tomorrowStart.toISOString()} to ${tomorrowEnd.toISOString()})...`);

    const { data: reminders, error } = await supabase
        .from('reminder_queue')
        .select('*, patients(name, phone)')
        .gte('scheduled_for', tomorrowStart.toISOString())
        .lte('scheduled_for', tomorrowEnd.toISOString());

    if (error) {
        console.error('Error fetching reminders:', error);
        return;
    }

    console.log(`Found ${reminders.length} reminders for tomorrow:`);
    console.table(reminders.map(r => ({
        id: r.id,
        patient: r.patients?.name,
        phone: r.patients?.phone,
        screen: r.screen,
        template: r.template_key,
        scheduled: r.scheduled_for,
        status: r.status
    })));
}

checkTomorrow();
