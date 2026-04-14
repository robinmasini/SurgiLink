import 'dotenv/config';
import { processPendingReminders } from './src/services/reminderService.js';

// If you need .env.local specifically, you might need to handle it differently 
// since 'import' is hoisted. 
// A better way for local dev is to use node -r dotenv/config


async function run() {
    console.log('Running processPendingReminders with ANON KEY...');
    const result = await processPendingReminders();
    console.log('Result:', result);
}

run();
