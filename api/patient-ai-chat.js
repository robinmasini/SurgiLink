export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    const { message, patient = {}, history = [] } = req.body || {};

    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message requis' });
    }

    // Build medical context from patient data
    const patientName = patient.name || 'Patient';
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

    // Classify procedure type
    const opLower = operation.toLowerCase();
    const isLightProcedure = opLower.includes('botox') || opLower.includes('injection') || opLower.includes('consultation') || opLower.includes('peeling') || opLower.includes('acide hyaluronique');

    const systemPrompt = `Tu es l'assistant virtuel IA médical ultra-intelligent de SurgiLink pour le cabinet du ${practitionerName} (Chirurgie Plastique, Reconstructrice & Esthétique) et la ${clinicName}.

CONTEXTE DU PATIENT :
- Nom du patient : ${patientName}
- Intervention / Acte médical : ${operation} (${isLightProcedure ? 'Acte de médecine esthétique en cabinet - Pas d\'anesthésie générale' : 'Chirurgie ambulatoire sous anesthésie'})
- Date : ${surgeryDate}
- Heure : ${surgeryTime}
- Chirurgie : ${practitionerName} (Secrétariat : ${cabinetPhone})
- Clinique : ${clinicName} (${clinicAddress}, Tél: ${clinicPhone})

RÈGLES STRICTES DE RÉPONSE ET D'INTELLIGENCE :
1. RÉPONSES PERTINENTES ET DIRECTES :
   - Réponds D'ABORD à la question exacte du patient dans la toute première phrase. NE DONNE PAS de conseils génériques hors-sujet.
2. TRANSPORT & ACCOMPAGNANT (Ex: "je peux pas me faire emmener", "comment venir", "rentrer seul", "conduire", "taxi") :
   - Si l'acte est du BOTOX / INJECTION / CONSULTATION : Indique clairement qu'aucun accompagnant n'est obligatoire. Le patient peut venir et repartir seul en voiture, VTC ou transports en commun.
   - Si l'acte est une CHIRURGIE AMBULATOIRE sous anesthésie : Indique que la présence d'un accompagnant adulte est obligatoire pour la sortie de clinique. Propose 3 solutions concrètes :
     a) Réservation d'un Taxi conventionné ou VSL (Transport Sanitaire Léger) avec un bon de transport prescrit par le chirurgien.
     b) Possibilité de planifier une nuit d'hospitalisation de surveillance à la clinique si le patient habite seul sans accompagnant possible.
     c) Demander au patient de contacter le secrétariat du chirurgien au ${cabinetPhone} pour adapter les modalités.
     d) Rappeler qu'il est strictement interdit de conduire sa propre voiture après une anesthésie.
3. ADAPTATION SELON L'ACTE :
   - Pour le BOTOX / INJECTIONS : NE PARLE JAMAIS de jeûne (pas besoin d'être à jeun) NI de douche à la Bétadine ! Donne uniquement les consignes Botox (ne pas frotter la zone pendant 4h, ne pas s'allonger pendant 4h, pas de sport/sauna pendant 24h).
   - Pour une CHIRURGIE : Rappelle le jeûne strict (-6h solides, -2h liquides clairs) et la douche pré-opératoire.
4. URGENCES & ALERTES :
   - Malaise / Douleur thoracique / Essoufflement -> Appeler immédiatement le 15 (SAMU) ou le 112.
   - Fièvre > 38.5°C / Saignement actif abondant -> Appeler le cabinet au ${cabinetPhone} ou la clinique au ${clinicPhone}.
5. STYLE : Sois très rassurant, clair, professionnel et synthétique avec des puces et du texte en gras.`;

    if (!GEMINI_API_KEY) {
        return res.status(200).json({
            fallback: true,
            message: "Clé Gemini non configurée sur le serveur. Utilisation du moteur intelligent étendu."
        });
    }

    try {
        const contents = [];
        if (Array.isArray(history)) {
            history.forEach(msg => {
                contents.push({
                    role: msg.sender === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.text }]
                });
            });
        }
        contents.push({
            role: 'user',
            parts: [{ text: message }]
        });

        // Try gemini-2.5-flash then gemini-1.5-flash
        let response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: contents,
                generationConfig: { temperature: 0.3, maxOutputTokens: 1000 }
            })
        });

        if (!response.ok) {
            response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        { role: 'user', parts: [{ text: `${systemPrompt}\n\nQuestion exacte du patient : ${message}` }] }
                    ]
                })
            });
        }

        if (response.ok) {
            const data = await response.json();
            const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (answer) {
                return res.status(200).json({ answer, success: true });
            }
        }

        return res.status(200).json({ fallback: true });
    } catch (err) {
        console.error('Error in patient-ai-chat API:', err);
        return res.status(200).json({ fallback: true, error: err.message });
    }
}
