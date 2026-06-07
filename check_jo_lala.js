import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data: p } = await supabase.from('patients').select('id, name').ilike('name', '%jo lala%').single();
  if (p) {
    const { data: r } = await supabase.from('reminder_queue').select('*').eq('patient_id', p.id);
    console.log("Reminders for", p.name, ":", r);
    const { data: s } = await supabase.from('sms_logs').select('*').eq('patient_id', p.id);
    console.log("SMS Logs:", s);
  } else {
    console.log("Patient not found");
  }
}
run();
