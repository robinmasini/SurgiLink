import dotenv from 'dotenv';
dotenv.config();

async function sendTest() {
    const response = await fetch('https://rest.nexmo.com/sms/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            api_key: process.env.VITE_VONAGE_API_KEY,
            api_secret: process.env.VITE_VONAGE_API_SECRET,
            to: '33603096001',
            from: 'SurgiLink',
            text: 'Ceci est un test technique sans aucun lien pour verifier le filtre anti-spam des operateurs francais.',
            type: 'unicode'
        })
    });
    const data = await response.json();
    console.log(data);
}
sendTest();
