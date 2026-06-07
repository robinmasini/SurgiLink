import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data: p } = await supabase.from('patients').select('id').ilike('name', '%Melvin%').single();
  
  if (p) {
    console.log("Updating Melvin's J-1 to 06:30 UTC");
    await supabase.from('reminder_queue')
      .update({ scheduled_for: '2026-06-08T06:30:00+00:00' })
      .eq('patient_id', p.id)
      .eq('screen', 'J-1');
  }
}
run();
