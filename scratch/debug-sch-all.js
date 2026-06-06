import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: queue, error } = await supabase
        .from('reminder_queue')
        .select('*')
        .eq('patient_id', 50)
        .order('created_at', { ascending: true });

    if (error) {
        console.error(error);
        return;
    }

    console.log('All queue items for patient 50:');
    console.table(queue.map(q => ({
        id: q.id,
        screen: q.screen,
        scheduled_for: q.scheduled_for,
        status: q.status,
        processed_at: q.processed_at,
        created_at: q.created_at
    })));
}

run();
