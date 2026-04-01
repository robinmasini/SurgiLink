import { createClient } from '@supabase/supabase-js';
import { processPendingReminders } from '../src/services/reminderService.js';

export default async function handler(req, res) {
    // 1. Security Check
    const authHeader = req.headers['authorization'];
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // 2. Initialize Privileged Supabase Client
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        return res.status(500).json({
            error: 'Supabase configuration missing (URL or Service Role Key)'
        });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    try {
        console.log('--- Starting Automated Reminder Processing ---');
        const result = await processPendingReminders(supabase);

        console.log('Processing Result:', result);

        return res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('CRITICAL: Reminder Processing Failed:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
