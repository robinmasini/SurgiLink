import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const targetDate = new Date();
    // Set to 12:15 PM local time (10:15 UTC)
    targetDate.setUTCHours(10, 15, 0, 0);

    console.log(`[1] Rescheduling J-1 to: ${targetDate.toISOString()}`);
    const { data: updateData, error: updateError } = await supabase
        .from('reminder_queue')
        .update({
            scheduled_for: targetDate.toISOString(),
            status: 'pending',
            processed_at: null
        })
        .eq('patient_id', 50)
        .eq('screen', 'J-1')
        .select();

    if (updateError) {
        console.error('Update error:', updateError);
        return;
    }
    console.log('Update result:', updateData);

    // Monitor the table every 2 seconds for 1 minute
    console.log('Monitoring J-1 scheduled_for value for 60 seconds...');
    for (let i = 0; i < 30; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const { data: queryData } = await supabase
            .from('reminder_queue')
            .select('scheduled_for, status')
            .eq('patient_id', 50)
            .eq('screen', 'J-1')
            .single();
            
        console.log(`[${i*2}s] scheduled_for: ${queryData?.scheduled_for} | status: ${queryData?.status}`);
    }
}

run();
