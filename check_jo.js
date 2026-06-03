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

async function checkJo() {
    const { data: patients, error } = await supabase
        .from('patients')
        .select('*');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Total patients:', patients.length);
    const matching = patients.filter(p => p.name && (p.name.toLowerCase().includes('jo') || p.name.toLowerCase().includes('lm')));
    console.log('Matching patients for Jo/LM:', matching.map(p => ({ id: p.id, name: p.name, phone: p.phone, progress: p.progress, status: p.status, days_until: p.days_until, appointment_datetime: p.appointment_datetime, date: p.date, user_id: p.user_id })));
}

checkJo();
