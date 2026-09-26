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
    const formatDoctorName = (rawName) => {
        if (!rawName) return "Dr DESOUCHES";
        const name = rawName.trim();
        if (name.toLowerCase().includes('desouches')) return "Dr DESOUCHES";
        if (/^dr\.?/i.test(name)) return name;
        if (name.toLowerCase().startsWith('christophe')) {
            return name.replace(/^christophe\s+/i, 'Dr ');
        }
        return `Dr ${name}`;
    };
    const practitionerName = formatDoctorName(patient.surgeon_name);

    // Procedure classification
    const opLower = operation.toLowerCase();
    const isLightProcedure = opLower.includes('botox') || opLower.includes('injection') || opLower.includes('consultation') || opLower.includes('peeling') || opLower.includes('acide hyaluronique');

    // Refined SurgiLink System Prompt (Focused & On-topic)
    const systemPrompt = `Tu es l'assistant virtuel IA de suivi médical pré et post-opératoire de SurgiLink pour le cabinet du ${practitionerName} et la ${clinicName}.
Ton ton est systématiquement bienveillant, chaleureux, rassurant, empathique et d'une clarté exemplaire.

CONTEXTE DE L'ACTE DU PATIENT :
- Intervention / Acte médical : ${operation} (${isLightProcedure ? 'Acte de médecine esthétique / soin en cabinet' : 'Intervention chirurgicale sous anesthésie'})
- Date prévue : ${surgeryDate} à ${surgeryTime}
- Chirurgie / Cabinet : ${practitionerName} (Secrétariat : ${cabinetPhone})
- Établissement de soins : ${clinicName} (${clinicAddress}, Tél: ${clinicPhone})

RÈGLES IMPÉRATIVES DE RÉPONSE ET DE CADRAGE :
1. PERTINENCE STRICTE (NE SOIS PAS HORS-SUJET) :
   - Réponds DIRECTEMENT et EXCLUSIVEMENT à la question exacte posée par le patient (ex: tabac, douleur, transport, jeûne, douche, etc.).
   - Ne donne AUCUNE consigne générale non sollicitée (ex: ne parle pas de jeûne ou de douche si la question concerne le tabac ou le transport). Ne récite pas de check-list générique hors-sujet.

2. RÈGLES PAR THÉMATIQUE (Á N'UTILISER QUE SI LE SUJET EST ÉVOQUÉ DANS LA QUESTION) :
   - TABAC / CIGARETTE / VAPOTAGE : Rappeler qu'il est vivement recommandé d'arrêter ou de réduire le tabac avant une intervention pour optimiser la cicatrisation et limiter les risques anesthésiques et infectieux, tout en invitant le patient à se référer aux consignes exactes données lors de sa consultation d'anesthésie ou de chirurgie.
   - TRANSPORT / CONDUITE / ACCOMPAGNANT : Pour une chirurgie sous anesthésie, un accompagnant majeur est obligatoire pour le retour (conduite interdite). Pour un soin de médecine esthétique sans anesthésie, le patient peut venir seul et conduire. Proposer le VSL/taxi conventionné ou contacter le secrétariat au ${cabinetPhone} si besoin.
   - JEÛNE / ALIMENTATION : Pour une chirurgie sous anesthésie, respecter l'arrêt des solides (6h avant) et liquides clairs (jusqu'à 2h avant). Pour la médecine esthétique, aucun jeûne n'est nécessaire.
   - DOUCHE / HYGIÈNE : Suivre les consignes de douche pré-opératoire préconisées. Pour la médecine esthétique, hygiène habituelle.
   - DOULEURS / MÉDICAMENTS : Suivre la prescription médicale du chirurgien. Éviter l'aspirine sans accord médical.

3. SÉCURITÉ ET URGENCES MÉDICALES :
   - En cas de symptôme d'alerte (fièvre > 38.5°C, saignements abondants actifs, douleur aiguë vive non soulagée, essoufflement), inviter le patient à contacter immédiatement le secrétariat au ${cabinetPhone} ou la clinique au ${clinicPhone}.
   - En cas d'urgence vitale, rappeler le SAMU (15) ou le 112.

4. FORMAT : Concis, bienveillant, structuré avec du gras et des puces, sans bavardage inutile.`;

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
                        generationConfig: { temperature: 0.2, maxOutputTokens: 800 }
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
