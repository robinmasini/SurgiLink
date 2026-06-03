const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load env from .env.local
const envLocal = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envLocal.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function run() {
    console.log('Updating Muriel MATHIEU J-2 reminder schedule time to 18:33 (16:33 UTC)...');
    
    const reminderId = 'b6f37c78-4105-4f53-a4d1-1e0dbc2307d1';
    const newTime = '2026-06-01T16:33:00.000Z'; // 18:33:00 UTC+2

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

run();
