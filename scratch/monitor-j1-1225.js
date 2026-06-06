import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Starting J-1 reminder monitor for 12:25 PM test...');
    const startTime = Date.now();
    const duration = 12 * 60 * 1000; // 12 minutes
    const interval = 5000; // 5 seconds
    
    while (Date.now() - startTime < duration) {
        const timestamp = new Date().toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris' });
        
        // Query the status of J-1 reminder
        const { data: reminder, error: reminderErr } = await supabase
            .from('reminder_queue')
            .select('status, processed_at')
            .eq('patient_id', 50)
            .eq('screen', 'J-1')
            .single();
            
        // Query if there are any new sms_logs
        const { data: smsLogs, error: smsErr } = await supabase
            .from('sms_logs')
            .select('status, error_message, created_at')
            .eq('patient_id', 50)
            .eq('screen', 'J-1')
            .order('created_at', { ascending: false })
            .limit(1);

        if (reminderErr) {
            console.log(`[${timestamp}] Error fetching reminder:`, reminderErr.message);
        } else {
            const rStatus = reminder?.status;
            const rProcessed = reminder?.processed_at;
            const logStatus = smsLogs && smsLogs.length > 0 ? smsLogs[0].status : 'none';
            const logError = smsLogs && smsLogs.length > 0 ? (smsLogs[0].error_message || 'none') : 'none';
            const logTime = smsLogs && smsLogs.length > 0 ? smsLogs[0].created_at : 'none';
            
            console.log(`[${timestamp}] Reminder status: ${rStatus} (processed_at: ${rProcessed}) | SMS log status: ${logStatus} (error: ${logError}, created_at: ${logTime})`);
            
            if (rStatus === 'sent' || rStatus === 'failed' || rStatus === 'cancelled') {
                console.log(`[${timestamp}] J-1 reminder status updated to terminal state: ${rStatus}. Exiting monitor.`);
                break;
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, interval));
    }
    console.log('Monitor finished.');
}

run();
