
import { processPendingReminders } from './src/services/reminderService.js';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

async function run() {
    console.log('Running processPendingReminders with ANON KEY...');
    const result = await processPendingReminders();
    console.log('Result:', result);
}

run();
