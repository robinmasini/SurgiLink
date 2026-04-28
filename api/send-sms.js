export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // On Vercel, env vars are in process.env
    const VONAGE_API_KEY = process.env.VITE_VONAGE_API_KEY;
    const VONAGE_API_SECRET = process.env.VITE_VONAGE_API_SECRET;
    const VONAGE_FROM = process.env.VITE_VONAGE_FROM || 'SurgiLink';

    if (!VONAGE_API_KEY || !VONAGE_API_SECRET) {
        return res.status(500).json({ error: 'Vonage credentials missing in server environment' });
    }

    const { to, text } = req.body;

    if (!to || !text) {
        return res.status(400).json({ error: 'Missing to or text fields' });
    }

    try {
        const response = await fetch('https://rest.nexmo.com/sms/json', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                api_key: VONAGE_API_KEY,
                api_secret: VONAGE_API_SECRET,
                to: to,
                from: VONAGE_FROM,
                text: text,
                type: 'unicode'
            })
        });

        const data = await response.json();
        return res.status(response.status).json(data);
    } catch (error) {
        console.error('Error in send-sms API route:', error);
        return res.status(500).json({ error: error.message });
    }
}
