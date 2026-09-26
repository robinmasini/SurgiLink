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
    const operation = patient.operation || 'Intervention chirurgicale';
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

    const systemPrompt = `Tu es l'assistant médical virtuel intelligent de SurgiLink pour le cabinet du ${practitionerName} (Chirurgie Plastique, Reconstructrice et Esthétique) et la ${clinicName}.

INFORMATIONS CONCERNANT LE PATIENT EN COURS :
- Nom du patient : ${patientName}
- Intervention prévue/réalisée : ${operation}
- Date de l'intervention : ${surgeryDate}
- Heure de convocation / intervention : ${surgeryTime}
- Chirurgie : ${practitionerName} (Téléphone cabinet : ${cabinetPhone})
- Établissement de soins : ${clinicName}
  * Adresse : ${clinicAddress}
  * Téléphone clinique : ${clinicPhone}

RÈGLES D'OR ET DIRECTIVES MÉDICALES :
1. TON ET POSTURE : Sois très chaleureux, rassurant, professionnel et bienveillant. Réponds en français (ou dans la langue de l'utilisateur s'il s'exprime en anglais ou néerlandais).
2. CONSIGNES PRÉ-OPÉRATOIRES ESSENTIELLES :
   - Jeûne : Arrêt strict des aliments solides et du tabac au moins 6h avant l'anesthésie. Boissons claires (eau, thé ou café noir sans lait ni sucre) autorisées jusqu'à 2h avant.
   - Hygiène : Douche pré-opératoire obligatoire la veille au soir ET le matin même de l'intervention avec du savon antiseptique ou savon doux. Shampoing la veille. Séchage avec une serviette propre. Mettre des vêtements propres.
   - Interdictions : Pas de maquillage, pas de vernis à ongles (mains et pieds), pas de bijoux ni piercings, pas de crème corporelle le jour J.
   - Médicaments : Ne pas prendre d'aspirine ni d'anti-inflammatoires 10 jours avant l'intervention sans avis médical. Ne prendre que les traitements autorisés par l'anesthésiste avec une gorgée d'eau.
   - Documents à apporter : Pièce d'identité, Carte Vitale, dossier médical, ordonnances, et vêtements amples faciles à enfiler.
3. CONSIGNES POST-OPÉRATOIRES :
   - Douleur : Prendre scrupuleusement la prescription antalgique du chirurgien avant que la douleur s'installe.
   - Repos : Repos strict les premiers jours, pas de port de charges lourdes ni de sport pendant la période préconisée.
   - Soins de pansement : Suivre les consignes données à la sortie et garder le pansement propre et sec.
4. URGENCES ET SIGNAUX D'ALERTE :
   - Si le patient signale une douleur thoracique aiguë, des difficultés respiratoires importantes (essoufflement) ou un malaise : lui indiquer d'appeler immédiatement le 15 (SAMU) ou le 112.
   - Si le patient signale une fièvre > 38,5°C, un saignement abondant qui ne s'arrête pas après compression, ou un gonflement douloureux et unilatéral du mollet : lui dire de contacter en urgence le cabinet au ${cabinetPhone} ou la clinique au ${clinicPhone} (ou se rendre aux urgences).
5. STRUCTURE DE LA RÉPONSE :
   - Donne des réponses structurées, claires et lisibles avec des puces et des mots en gras.
   - Reste synthétique et direct sans blabla inutile.

Si tu n'as pas la réponse à une question administrative très spécifique, conseille gentiment au patient de contacter le cabinet au ${cabinetPhone}.`;

    if (!GEMINI_API_KEY) {
        return res.status(200).json({
            fallback: true,
            message: "Clé Gemini non configurée sur le serveur. Utilisation du fallback client intelligent."
        });
    }

    try {
        // Prepare Gemini API payload
        const contents = [];

        // Add history if present
        if (Array.isArray(history)) {
            history.forEach(msg => {
                contents.push({
                    role: msg.sender === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.text }]
                });
            });
        }

        // Add current user prompt
        contents.push({
            role: 'user',
            parts: [{ text: message }]
        });

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: systemPrompt }]
                },
                contents: contents,
                generationConfig: {
                    temperature: 0.4,
                    maxOutputTokens: 1000
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API Error:', response.status, errorText);
            
            // Try fallback model gemini-1.5-flash if 2.5 fail
            const fallbackResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        { role: 'user', parts: [{ text: `${systemPrompt}\n\nQuestion du patient : ${message}` }] }
                    ]
                })
            });

            if (fallbackResponse.ok) {
                const fbData = await fallbackResponse.json();
                const text = fbData.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                    return res.status(200).json({ answer: text, success: true });
                }
            }

            return res.status(200).json({ fallback: true, error: errorText });
        }

        const data = await response.json();
        const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!answer) {
            return res.status(200).json({ fallback: true });
        }

        return res.status(200).json({ answer, success: true });
    } catch (err) {
        console.error('Error in patient-ai-chat API:', err);
        return res.status(200).json({ fallback: true, error: err.message });
    }
}
