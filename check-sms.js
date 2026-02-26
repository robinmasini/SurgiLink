
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSmsStatus() {
    console.log('Listing last 5 patients...');
    const { data: recentPatients, error: rpError } = await supabase
        .from('patients')
        .select('id, name, phone, date, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (rpError) console.error('Error listing patients:', rpError);
    else console.table(recentPatients);

    const phoneLookup = '+33603096001';
    console.log(`\nSearching for phone: ${phoneLookup}...`);
    const { data: patients, error: pError } = await supabase
        .from('patients')
        .select('id, name, phone, date')
        .eq('phone', phoneLookup)
        .order('created_at', { ascending: false });

    if (pError) console.error('Error finding patient:', pError);
    if (!patients || patients.length === 0) {
        console.log(`No patient found for phone "${phoneLookup}"`);
    } else {
        console.table(patients);
        const patientId = patients[0].id;

        console.log(`\n--- Checking SMS Logs for Patient ID: ${patientId} ---`);
        const { data: logs, error: logsError } = await supabase
            .from('sms_logs')
            .select('*')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false });

        if (logsError) console.error('Error fetching logs:', logsError);
        else console.table(logs.map(l => ({
            id: l.id,
            template: l.template_key,
            status: l.status,
            error: l.error_message,
            created: l.created_at
        })));

        console.log(`\n--- Checking Reminder Queue for Patient ID: ${patientId} ---`);
        const { data: queue, error: queueError } = await supabase
            .from('reminder_queue')
            .select('*')
            .eq('patient_id', patientId)
            .order('scheduled_for', { ascending: true });

        if (queueError) console.error('Error fetching queue:', queueError);
        else console.table(queue.map(q => ({
            id: q.id,
            screen: q.screen,
            type: q.reminder_type,
            scheduled: q.scheduled_for,
            status: q.status
        })));
    }
}

checkSmsStatus();
