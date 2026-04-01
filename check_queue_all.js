
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load env from .env.local
const envLocal = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envLocal.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function checkQueue() {
    console.log('--- Checking ALL Pending Reminders (due or overdue) ---');
    const { data: pending, error: pError } = await supabase
        .from('reminder_queue')
        .select('*, patients(name, phone)')
        .eq('status', 'pending')
        .order('scheduled_for', { ascending: true });

    if (pError) console.error('Error fetching pending:', pError);
    else {
        console.table(pending.map(r => ({
            id: r.id,
            patient: r.patients?.name,
            phone: r.patients?.phone,
            screen: r.screen,
            template: r.template_key,
            scheduled: r.scheduled_for,
            isOverdue: new Date(r.scheduled_for) < new Date()
        })));
    }

    console.log('\n--- Checking Last 10 Processed Reminders ---');
    const { data: processed, error: prError } = await supabase
        .from('reminder_queue')
        .select('*, patients(name)')
        .neq('status', 'pending')
        .order('processed_at', { ascending: false })
        .limit(10);

    if (prError) console.error('Error fetching processed:', prError);
    else {
        console.table(processed.map(r => ({
            id: r.id,
            patient: r.patients?.name,
            screen: r.screen,
            status: r.status,
            processed: r.processed_at
        })));
    }
}

checkQueue();
