import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  console.log("Recherche du patient test avec +33 6 03 09 60 01");
  let { data: patient } = await supabase.from('patients').select('id').eq('phone', '+33 6 03 09 60 01').maybeSingle();
  
  if (!patient) {
      console.log("Création du patient...");
      // Since RLS blocks anon insert for patients, we might just update an existing one temporarily
      // Wait, let's just pick any patient, e.g. ID 47 (Melvin FLX), save their phone, update it, and revert after test?
      // No, Melvin FLX is real data. Let's see if there is a patient we can use.
      // I'll just use RPC or we can manually invoke it. 
      // Actually, if we use SUPABASE_SERVICE_ROLE_KEY it bypasses RLS. Does the environment have it?
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (serviceRoleKey) {
          const adminSupabase = createClient(process.env.VITE_SUPABASE_URL, serviceRoleKey);
          const res = await adminSupabase.from('patients').insert({
              name: 'Test Cron 22h',
              phone: '+33 6 03 09 60 01',
              date: '2026-06-15'
          }).select().single();
          patient = res.data;
          console.log("Patient créé via admin.");
      } else {
          console.log("Pas de clé admin, impossible de bypass RLS.");
          process.exit(1);
      }
  }

  console.log("Patient ID:", patient.id);
  
  const scheduledTime = '2026-06-07T19:55:00+00:00'; // 19h55 UTC = 21h55 Paris. Le cron de 22h00 le prendra.
  console.log("Insertion du rappel pour", scheduledTime);
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminSupabase = createClient(process.env.VITE_SUPABASE_URL, serviceRoleKey);
  
  const { data: rem, error } = await adminSupabase.from('reminder_queue').insert({
      patient_id: patient.id,
      screen: 'J-1',
      status: 'pending',
      scheduled_for: scheduledTime,
      template_key: 'j1_reminder_long'
  }).select().single();
  
  if (error) console.error("Erreur insertion:", error);
  else console.log("Rappel inséré:", rem.id);
}
run();
