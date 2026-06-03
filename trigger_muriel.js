import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { processPendingReminders } from './src/services/reminderService.js';

// Load env from .env.local
const envLocal = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envLocal.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
});

// Set App URL for API base path
process.env.VITE_APP_URL = 'https://surgilink.eu';

// Load .env variables
const env = fs.readFileSync('.env', 'utf8');
env.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function run() {
    console.log('Checking current time...');
    console.log('Local Time:', new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }));
    console.log('UTC Time:', new Date().toISOString());
    console.log('Executing processPendingReminders...');
    
    const result = await processPendingReminders(supabase);
    console.log('Result:', result);
}

run();
