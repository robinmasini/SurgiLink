
import { sendSMS } from './src/services/vonageService.js';
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

async function testService() {
    console.log('Testing vonageService.sendSMS...');
    const result = await sendSMS(
        'j7_reminder',
        '+33603096001',
        {
            first_name: 'Robin',
            procedure_date: 'demain',
            clinic_name: 'SurgiLink',
            checklist_link: 'https://surgilink.eu'
        },
        { patientId: 15 }
    );
    console.log('Result:', result);
}

testService();
