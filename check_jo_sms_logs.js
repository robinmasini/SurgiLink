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

async function checkSmsLogs() {
    const { data: logs, error } = await supabase
        .from('sms_logs')
        .select('*')
        .eq('patient_id', 43);

    if (error) {
        console.error('Error fetching logs:', error);
        return;
    }

    console.log('SMS Logs for Patient 43 (Jo LM):');
    console.table(logs.map(l => ({
        id: l.id,
        template_key: l.template_key,
        screen: l.screen,
        status: l.status,
        error_message: l.error_message,
        sent_at: l.sent_at,
        created_at: l.created_at
    })));
}

checkSmsLogs();
