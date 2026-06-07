import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { sendSMS } from './src/services/vonageService.js';

dotenv.config({ path: '.env.local' });
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Use anonKey (service role might not be available or RLS blocks anon insert)
// But to just send SMS, we don't need to insert a patient if we mock it
const supabase = createClient(supabaseUrl, anonKey);

async function runTest() {
    console.log('--- Simulation du CRON Vercel pour le test ---');
    
    // Simulate a pending reminder payload
    const patientPhone = '+33603096001';
    
    console.log('1. Récupération du jeton (token) (Simulé)');
    const token = 'test-token-123';
    const baseUrl = `https://surgilink.eu/patient-portal/${token}`;
    const directLink = `${baseUrl}/j1-preop`;

    console.log('2. Préparation du SMS (Modèle J-1)');
    const variables = {
        first_name: 'Test',
        procedure_date: 'demain',
        arrival_time: '07:30',
        clinic_name: 'SurgiLink',
        clinic_phone: '01 44 44 44 44',
        checklist_link: directLink,
        consignes_link: directLink,
        esatis_link: directLink
    };

    console.log('3. Envoi via le service SMS...');
    try {
        const result = await sendSMS(
            'j1_reminder_long',
            patientPhone,
            variables,
            {
                patientId: 9999, // Fake ID
                screen: 'J-1',
                linkedItemId: null,
                manualMessage: null
            },
            supabase
        );
        
        console.log('Résultat:', result);
        if (result.success) {
            console.log('✅ SMS envoyé avec succès au', patientPhone);
        } else {
            console.error('❌ Échec:', result.error);
        }
    } catch (e) {
        console.error('Erreur inattendue:', e);
    }
}
runTest();
