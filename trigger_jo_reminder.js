import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// 1. Load env variables immediately before any other imports
const envLocal = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envLocal.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        const val = value.trim().replace(/^["']|["']$/g, '');
        envVars[key.trim()] = val;
        process.env[key.trim()] = val;
    }
});

process.env.VITE_APP_URL = 'https://surgilink.eu';

const env = fs.readFileSync('.env', 'utf8');
env.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        const val = value.trim().replace(/^["']|["']$/g, '');
        process.env[key.trim()] = val;
    }
});

// 2. Now initialize Supabase client
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
    console.log('--- Triggering Specific Reminder for Jo LM (J-7) ---');
    console.log('Local Time:', new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }));
    console.log('UTC Time:', new Date().toISOString());

    const reminderId = '8f750dd3-814b-4d65-bd15-54ef0f059dbd';

    // 3. Fetch the specific reminder
    const { data: reminder, error: rError } = await supabase
        .from('reminder_queue')
        .select('*, patients(*)')
        .eq('id', reminderId)
        .single();

    if (rError) {
        console.error('Error fetching reminder:', rError);
        return;
    }

    if (!reminder) {
        console.error('Reminder not found');
        return;
    }

    if (reminder.status !== 'pending') {
        console.log(`Reminder is not pending (status: ${reminder.status})`);
        return;
    }

    const scheduledDate = new Date(reminder.scheduled_for);
    const currentDate = new Date();
    if (scheduledDate > currentDate) {
        console.log(`Reminder is scheduled for the future (${reminder.scheduled_for}). Not sending yet.`);
        return;
    }

    console.log(`Processing reminder ${reminder.id} for patient ${reminder.patients.name}`);

    // 4. Dynamically import vonageService so that process.env is already populated
    const { sendSMS, canSendReminder } = await import('./src/services/vonageService.js');

    // Check anti-spam
    const canSend = await canSendReminder(
        reminder.patient_id,
        reminder.item_id || reminder.screen,
        24,
        3,
        supabase
    );

    if (!canSend.canSend) {
        await supabase
            .from('reminder_queue')
            .update({
                status: 'cancelled',
                processed_at: new Date().toISOString()
            })
            .eq('id', reminder.id);

        console.log(`Reminder cancelled: ${canSend.reason}`);
        return;
    }

    // Fetch token
    const patient = reminder.patients;
    const { data: tokenData } = await supabase
        .from('patient_review_tokens')
        .select('token')
        .eq('patient_id', patient.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    const token = tokenData?.token;
    const getScreenPath = (screen) => {
        const mapping = {
            'J-7': 'j7',
            'J-2': 'j2',
            'J-1': 'j1-preop',
            'J+1': 'j1',
            'J+4': 'j4',
            'E-SATIS': 'e-satis',
            'Bienvenue': ''
        };
        return mapping[screen] || '';
    };

    const screenPath = getScreenPath(reminder.screen);
    const baseUrl = `https://surgilink.eu/patient-portal/${token || ''}`;
    const directLink = screenPath ? `${baseUrl}/${screenPath}` : baseUrl;

    const variables = {
        first_name: patient.name?.split(' ')[0] || 'Patient',
        procedure_date: patient.date || 'bientôt',
        arrival_time: patient.surgery_time || '07:30',
        clinic_name: 'SurgiLink',
        clinic_phone: '01 XX XX XX XX',
        checklist_link: directLink,
        consignes_link: directLink,
        esatis_link: directLink
    };

    const result = await sendSMS(
        reminder.template_key,
        patient.phone || '',
        variables,
        {
            patientId: reminder.patient_id,
            screen: reminder.screen,
            linkedItemId: reminder.item_id,
            manualMessage: reminder.custom_message
        },
        supabase
    );

    // Update reminder queue status
    await supabase
        .from('reminder_queue')
        .update({
            status: result.success ? 'sent' : 'failed',
            processed_at: new Date().toISOString()
        })
        .eq('id', reminder.id);

    console.log('Result:', result);
}

run();
