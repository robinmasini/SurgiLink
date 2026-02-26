
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
// Note: We are using ANON KEY which might be the issue if RLS is strict
const supabase = createClient(supabaseUrl, supabaseKey);

async function testQueue() {
    const patientId = 10;
    console.log(`Testing queueReminder for Patient ${patientId}...`);

    try {
        const payload = {
            patient_id: patientId,
            screen: 'J7',
            scheduled_for: new Date(Date.now() + 3600000).toISOString(),
            reminder_type: 'auto_time',
            template_key: 'j7_reminder',
            status: 'pending'
        };

        console.log('Payload:', payload);

        const { data, error } = await supabase
            .from('reminder_queue')
            .insert(payload)
            .select();

        if (error) {
            console.error('❌ Insertion failed:', error);
        } else {
            console.log('✅ Insertion successful!', data);
        }
    } catch (err) {
        console.error('💥 Unexpected error:', err);
    }
}

testQueue();
