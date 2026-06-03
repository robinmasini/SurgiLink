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

async function scheduleJo() {
    console.log('Scheduling next step of Jo LM to 17:30 (15:30 UTC) today...');

    const reminderId = '8f750dd3-814b-4d65-bd15-54ef0f059dbd';
    // 17:30 today in UTC is 15:30
    const newTime = '2026-06-02T15:30:00.000Z'; 

    const { data, error } = await supabase
        .from('reminder_queue')
        .update({ scheduled_for: newTime, status: 'pending' })
        .eq('id', reminderId)
        .select('*, patients(name, phone)');

    if (error) {
        console.error('Error updating reminder:', error);
    } else {
        console.log('Successfully updated reminder:', JSON.stringify(data, null, 2));
    }
}

scheduleJo();
