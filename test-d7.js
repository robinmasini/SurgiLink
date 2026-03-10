
import dotenv from 'dotenv';
import path from 'path';

// Load both .env and .env.local
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const D7_API_TOKEN = process.env.VITE_D7_API_TOKEN;
const D7_SENDER_ID = process.env.VITE_D7_SENDER_ID || 'SurgiLink';

async function sendTestSms() {
    const to = '+33630848023';
    const message = 'Test direct depuis SurgiLink CLI avec accents : jeûne, opération, anesthésie. Si vous recevez ce message correctement sur Android, le problème est résolu.';

    console.log(`Tentative d'envoi vers ${to}...`);

    if (!D7_API_TOKEN) {
        console.error('❌ VITE_D7_API_TOKEN toujours manquant.');
        console.log('Variables d\'env disponibles:', Object.keys(process.env).filter(k => k.includes('D7') || k.includes('SUPABASE')));
        return;
    }

    try {
        const response = await fetch('https://api.d7networks.com/messages/v1/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${D7_API_TOKEN}`
            },
            body: JSON.stringify({
                messages: [
                    {
                        channel: 'sms',
                        recipients: [to],
                        content: message,
                        msg_type: 'text',
                        data_coding: 'auto'
                    }
                ],
                message_globals: {
                    originator: D7_SENDER_ID
                }
            })
        });

        const data = await response.json();
        if (response.ok) {
            console.log('✅ SMS envoyé avec succès !');
            console.log('Réponse D7:', JSON.stringify(data, null, 2));
        } else {
            console.error('❌ Échec de l\'envoi.');
            console.error('Statut:', response.status);
            console.error('Erreur D7:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('Erreur inattendue:', error);
    }
}

sendTestSms();
