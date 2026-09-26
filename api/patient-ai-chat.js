export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    const { message, patient = {}, history = [] } = req.body || {};

    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message requis' });
    }

    // Helper: Strict Anonymization Engine for Patient Privacy
    function anonymize(text, patientObj = {}) {
        if (!text || typeof text !== 'string') return '';
        let clean = text;

        // 1. Remove Email addresses
        clean = clean.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email anonymisé]');

        // 2. Remove Phone numbers (French & International formats)
        clean = clean.replace(/(?:(?:\+|00)33|0)[1-9](?:[\s.-]*\d{2}){4}/g, '[téléphone anonymisé]');

        // 3. Remove Social Security Numbers (NIR - 13/15 digits)
        clean = clean.replace(/\b[12]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{3}\s?(\d{2})?\b/g, '[sécurité sociale anonymisée]');

        // 4. Remove Birth dates (DD/MM/YYYY, DD-MM-YYYY)
        clean = clean.replace(/\b(0[1-9]|[12]\d|3[01])[\/\.-](0[1-9]|1[0-2])[\/\.-](19|20)\d{2}\b/g, '[date de naissance anonymisée]');

        // 5. Remove Direct Patient Name Tokens
        const patientName = patientObj.name || '';
        if (patientName && patientName.trim() !== 'Patient') {
            const fullRegex = new RegExp(`\\b${patientName.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi');
            clean = clean.replace(fullRegex, '[Patient]');

            const nameTokens = patientName.split(/[\s-]+/).filter(t => t.length > 2);
            nameTokens.forEach(token => {
                const tokenRegex = new RegExp(`\\b${token.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi');
                clean = clean.replace(tokenRegex, '[Patient]');
            });
        }

        return clean;
    }

    // Medical context setup (non-identifying)
    const operation = patient.operation || 'Intervention';
    const surgeryDate = patient.date || 'Non précisée';
    const surgeryTime = patient.surgery_time || 'Non communiquée';
    const clinicName = patient.clinic_name || 'Clinique de Vitrolles';

    const isPhenicia = clinicName.includes('Phenicia') || clinicName.includes('Phénicia');
    const clinicAddress = isPhenicia
        ? "29 Rue Louis Astruc, 13005 Marseille"
        : "La Tuilière II, Rue Bel air, 13127 Vitrolles";
    const clinicPhone = isPhenicia ? "04 91 92 12 92" : "04 91 15 90 19";
    const cabinetPhone = patient.practitioner_phone || "04 91 15 90 19";
    const practitionerName = patient.surgeon_name || "Dr Christophe DESOUCHES";

    // Procedure classification
    const opLower = operation.toLowerCase();
    const isLightProcedure = opLower.includes('botox') || opLower.includes('injection') || opLower.includes('consultation') || opLower.includes('peeling') || opLower.includes('acide hyaluronique');

    // Adapted SurgiLink System Prompt
    const systemPrompt = `Tu es l'assistant virtuel IA de suivi médical pré et post-opératoire de SurgiLink pour le cabinet du ${practitionerName} et la ${clinicName}.
Ton ton est systématiquement bienveillant, chaleureux, rassurant, emphatique et d'une clarté exemplaire.

CONTEXTE MÉDICAL DE L'ACTE (ANONYMISÉ) :
- Acte / Intervention : ${operation} (${isLightProcedure ? 'Acte de médecine esthétique / soin en cabinet (sans anesthésie)' : 'Intervention chirurgicale sous anesthésie'})
- Date prévue : ${surgeryDate}
- Horaire de convocation : ${surgeryTime}
- Chirurgie / Cabinet : ${practitionerName} (Secrétariat : ${cabinetPhone})
- Établissement de soins : ${clinicName} (${clinicAddress}, Tél: ${clinicPhone})

DIRECTIVES IMPÉRATIVES DE RÉPONSE ET DE SÉCURITÉ :
1. TON & BIENVEILLANCE : Réponds avec empathie, pédagogie et douceur pour rassurer le patient et apaiser toute anxiété pré ou post-opératoire.
2. ANONYMISATON & RÈGLES RGPD : Ne mentionne jamais de nom de famille ou de données personnelles directement identifiantes. Adresse-toi toujours au patient avec politesse ("Bonjour", "Cher(e) patient(e)").
3. ADAPTATION PRÉCISE À L'ACTE (${operation}) :
   - Pour les actes de MÉDECINE ESTHÉTIQUE (Botox, Acide Hyaluronique, Injections, Peeling) : Aucun jeûne nécessaire, aucune douche antiseptique spéciale requise. Pas d'obligation d'accompagnant (la conduite automobile est autorisée immédiatement). Recommander de ne pas frotter/masser les zones injectées pendant 4h, ne pas s'allonger penché pendant 4h, et éviter le sport intense/sauna/hammam pendant 24h.
   - Pour les CHIRURGIES SOUS ANESTHÉSIE : Jeûne strict (arrêt des aliments solides et tabac au moins 6h avant, boissons claires acceptées jusqu'à 2h avant). Douche pré-opératoire avec savon antiseptique la veille et le matin. Présence d'un accompagnant majeur obligatoire pour la sortie de la clinique (conduite strictly interdite le jour même).
4. PROTOCOLE D'URGENCES ET DE SÉCURITÉ MÉDICALE :
   - Rappelle systématiquement qu'en cas de symptôme d'alerte (fièvre > 38.5°C, saignements actifs abondants, douleur aiguë vive non soulagée par le traitement ordonné, hématome soudain, mollet douloureux/rouge/gonflé, ou essoufflement/douleur thoracique), le patient doit contacter SANS ATTENDRE le secrétariat médical du ${practitionerName} au ${cabinetPhone} ou la clinique au ${clinicPhone}.
   - En cas d'urgence vitale (malaise, détresse respiratoire), rappeler d'appeler immédiatement le SAMU (15) ou le 112.
   - Précise toujours que tes réponses sont données à titre d'information d'accompagnement et ne remplacent pas une consultation ou un diagnostic médical direct.
5. FORMAT : Structuré, très lisible sur mobile, avec des titres en gras et des puces claires.`;

    if (!GEMINI_API_KEY) {
        return res.status(200).json({
            fallback: true,
            message: "Clé Gemini non configurée sur le serveur. Utilisation du moteur local."
        });
    }

    try {
        // Anonymize user message and history before sending to Gemini API
        const cleanMessage = anonymize(message, patient);

        const contents = [];
        if (Array.isArray(history)) {
            history.forEach(msg => {
                if (msg && msg.text) {
                    contents.push({
                        role: msg.sender === 'user' ? 'user' : 'model',
                        parts: [{ text: anonymize(msg.text, patient) }]
                    });
                }
            });
        }

        contents.push({
            role: 'user',
            parts: [{ text: cleanMessage }]
        });

        // List of Flash models to try in sequence
        const models = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-flash-latest'];

        for (const model of models) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        systemInstruction: { parts: [{ text: systemPrompt }] },
                        contents: contents,
                        generationConfig: { temperature: 0.3, maxOutputTokens: 1000 }
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (answer) {
                        return res.status(200).json({ answer, success: true, modelUsed: model });
                    }
                }
            } catch (modelErr) {
                console.warn(`Model ${model} failed, trying next fallback:`, modelErr.message);
            }
        }

        return res.status(200).json({ fallback: true });
    } catch (err) {
        console.error('Error in patient-ai-chat API:', err);
        return res.status(200).json({ fallback: true, error: err.message });
    }
}
