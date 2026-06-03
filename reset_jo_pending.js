import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envLocal = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envLocal.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function reset() {
    const reminderId = '8f750dd3-814b-4d65-bd15-54ef0f059dbd';
    const { data, error } = await supabase
        .from('reminder_queue')
        .update({ status: 'pending', processed_at: null })
        .eq('id', reminderId)
        .select('*');

    if (error) {
        console.error('Error resetting:', error);
    } else {
        console.log('Successfully reset reminder back to pending:', data);
    }
}

reset();
