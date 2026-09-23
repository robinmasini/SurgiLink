// Ambulatory Pathway Configuration
// Config-driven question system for the 5-step pathway
// Questions redistributed across the full protocol

export const pathwayConfig = {
    // Bienvenue: Configuration du portail
    // Bienvenue: Configuration du portail (J-18)
    Bienvenue: {
        title: "Questionnaire J-18 (Bienvenue)",
        subtitle: "Activation de votre suivi",
        sections: [
            {
                id: "welcome_activation",
                icon: "👋",
                title: "Commencer mon parcours",
                items: [
                    {
                        id: "blood_work",
                        type: "yes_no",
                        label: "Avez-vous réalisé le bilan sanguin (et/ou les examens) prescrit ?",
                        why: "Analyses vitales pour votre sécurité au bloc opératoire (coagulation, absence d'infection, etc.).",
                        required: true,
                        risk_flag_rule: { type: "soft", condition: "no" }
                    }
                ]
            }
        ]
    },

    // J-7: Questionnaire de Pré-admission
    J7: {
        title: "Questionnaire de Pré-admission J-7",
        subtitle: "Préparation de votre intervention",
        intro_text: "Afin de préparer au mieux votre intervention en chirurgie ambulatoire et de garantir votre sécurité, merci de répondre à ce rapide questionnaire.",
        sections: [
            {
                id: "medication_prep",
                icon: "📋",
                title: "PARTIE 1 : Préparation médicale à l'intervention",
                items: [
                    {
                        id: "anesthesia_consultation",
                        type: "yes_no",
                        label: "Avez-vous réalisé votre consultation d'anesthésie pré-opératoire ou l’avez-vous planifiée avant le J-2 ?",
                        why: "C'est une étape obligatoire au minimum 48h avant toute intervention pour évaluer votre état de santé.",
                        required: true,
                        risk_flag_rule: { type: "hard", condition: "no" }
                    }
                ]
            }
        ]
    },

    // J-1: Confirmation et Consignes (J1_PreOp)
    J1_PreOp: {
        title: "Confirmation de votre admission J-1",
        subtitle: "Vérification finale",
        sections: [
            {
                id: "fasting",
                icon: "🍽️",
                title: "1. Jeûne avant l’anesthésie",
                items: [
                    {
                        id: "fasting_understood",
                        type: "yes_no",
                        label: "Avez-vous bien compris et prévu de respecter les consignes de jeûne ?",
                        info_text: "Aliments solides et tabac : arrêt -6h. Boissons claires : arrêt -2h.",
                        required: true,
                        risk_flag_rule: { type: "hard", condition: "no" }
                    }
                ]
            },
            {
                id: "hygiene",
                icon: "🚿",
                title: "2. Hygiène et préparation de la peau",
                items: [
                    {
                        id: "shower_understood",
                        type: "yes_no",
                        label: "Avez-vous réalisé votre douche pré-opératoire (savon doux ou antiseptique) ?",
                        required: true,
                        risk_flag_rule: { type: "soft", condition: "no" }
                    }
                ]
            },
            {
                id: "confirmation",
                icon: "✅",
                title: "3. Confirmation",
                items: [
                    {
                        id: "admission_confirmed",
                        type: "yes_no",
                        label: "Avez-vous bien reçu l’heure de votre intervention ?\nSi ce n’est pas encore le cas, pas d’inquiétude : votre clinique vous la communiquera au plus tard dans l’après-midi. Si vous n’avez toujours pas reçu d’information après 16 h, contactez-nous directement au cabinet.",
                        required: false
                    }
                ]
            }
        ]
    },

    // J+1: Suivi post-op
    J1: {
        title: "Suivi post-opératoire J+1",
        subtitle: "Votre récupération",
        intro_text: "Bonjour, avant notre appel, pouvez-vous répondre à ces questions ?",
        warning_notice: "L’infirmier vous appellera dans tous les cas. En cas d’essoufflement, de douleur thoracique ou de malaise, appelez immédiatement le 15 ou le 112",
        sections: [
            {
                id: "postop_status",
                icon: "🌡️",
                title: "État de santé",
                items: [
                    {
                        id: "pain_scale",
                        type: "slider_0_10",
                        label: "1. Votre douleur est à combien sur 10 ?",
                        required: true,
                        risk_flag_rule: { type: "soft", condition: "gte_8" },
                        why: "Une douleur égale ou supérieure à 8/10 nécessite d'adapter le traitement antalgique."
                    },
                    {
                        id: "bleeding_swelling",
                        type: "yes_no",
                        label: "2. Avez-vous un saignement ou un gonflement qui augmente rapidement ?",
                        required: true,
                        risk_flag_rule: { type: "hard", condition: "yes" },
                        why: "Un saignement actif ou un hématome extensif nécessite un contrôle médical rapide."
                    },
                    {
                        id: "fever_vomiting",
                        type: "yes_no",
                        label: "3. Avez-vous de la fièvre ou des vomissements répétés ?",
                        required: true,
                        risk_flag_rule: { type: "hard", condition: "yes" },
                        why: "La fièvre et les vomissements répétés peuvent signaler une complication ou intolérance médicamenteuse."
                    },
                    {
                        id: "calf_pain_swelling",
                        type: "yes_no",
                        label: "4. Avez-vous une douleur ou un gonflement d’un mollet ?",
                        required: true,
                        risk_flag_rule: { type: "hard", condition: "yes" },
                        why: "Une douleur localisée au mollet impose d'écarter un début de phlébite."
                    },
                    {
                        id: "shortness_breath_chest_pain_fainting",
                        type: "yes_no",
                        label: "5. Avez-vous un essoufflement, une douleur dans la poitrine ou fait un malaise ?",
                        required: true,
                        risk_flag_rule: { type: "hard", condition: "yes" },
                        action: "Appelez immédiatement le 15 ou le 112 !",
                        why: "Douleur thoracique, essoufflement ou malaise constituent une urgence vitale."
                    },
                    {
                        id: "other_concerns",
                        type: "textarea",
                        label: "Une autre inquiétude ?",
                        multiline: true,
                        required: false,
                        placeholder: "Saisissez votre réponse ici..."
                    }
                ]
            }
        ]
    },

    // J+4: Satisfaction
    J4_Satisfaction: {
        title: "Enquête de satisfaction",
        subtitle: "J+4 - Votre avis",
        sections: [
            {
                id: "accueil",
                icon: "🤝",
                title: "1. L’accueil à la clinique",
                items: [
                    { id: "accueil_qualite", type: "rating", label: "Qualité de l’accueil et courtoisie de l’équipe", required: false }
                ]
            },
            {
                id: "medical",
                icon: "🩺",
                title: "2. Votre prise en charge médicale",
                items: [
                    { id: "soins_qualite", type: "rating", label: "La qualité des soins reçus", required: false },
                    { id: "medecins_ecoute", type: "rating", label: "L’écoute et la disponibilité des médecins", required: false }
                ]
            },
            {
                id: "confort",
                icon: "🛏️",
                title: "3. Votre confort pendant le séjour",
                items: [
                    { id: "confort_chambre", type: "rating", label: "Le confort de votre chambre/espace de repos", required: false },
                    { id: "confort_repas", type: "rating", label: "La qualité des repas ou collations", required: false }
                ]
            },
            {
                id: "global",
                icon: "⭐",
                title: "4. Votre avis global",
                items: [
                    {
                        id: "recommandation",
                        type: "select",
                        label: "Recommanderiez-vous la clinique à un proche ?",
                        options: ["Oui tout à fait", "Oui probablement", "Plutôt non", "Non"],
                        required: true
                    }
                ]
            },
            {
                id: "comments",
                icon: "💬",
                title: "5. Commentaire (facultatif)",
                items: [
                    { id: "verbatim", type: "text", label: "Commentaire ou suggestion pour nous améliorer", multiline: true, required: false }
                ]
            }
        ]
    },

    // E-SATIS: National Survey (Separate config to avoid collision)
    ESATIS: {
        title: "Enquête Nationale e-Satis",
        subtitle: "Votre avis sur votre séjour",
        sections: [
            {
                id: "esatis_global",
                icon: "⭐",
                title: "Satisfaction Globale",
                items: [
                    {
                        id: "global_experience",
                        type: "rating",
                        label: "Sur une échelle de 1 à 10, quel est votre niveau de satisfaction globale concernant votre séjour ?",
                        required: false
                    },
                    {
                        id: "recommend",
                        type: "yes_no",
                        label: "Recommanderiez-vous cet établissement à vos proches ?",
                        required: false
                    }
                ]
            }
        ]
    }
};

/**
 * Get all items from a screen configuration
 * @param {string} screen - J7, J2, J1_PreOp, J1 or J4_Satisfaction
 * @returns {Array} - Flat array of all items
 */
export function getScreenItems(screen) {
    const config = pathwayConfig[screen];
    if (!config) return [];

    return config.sections.flatMap(section => section.items);
}

/**
 * Get a specific item configuration
 * @param {string} screen - J7, J2, J1_PreOp, J1 or J4_Satisfaction
 * @param {string} itemId - Item ID
 * @returns {Object|null} - Item config or null
 */
export function getItemConfig(screen, itemId) {
    const items = getScreenItems(screen);
    return items.find(item => item.id === itemId) || null;
}

/**
 * Check if an item requires a reminder
 * @param {string} screen - Screen key
 * @param {string} itemId - Item ID
 * @returns {boolean}
 */
export function itemHasReminderPolicy(screen, itemId) {
    const item = getItemConfig(screen, itemId);
    return item && item.reminder_policy !== undefined;
}

/**
 * Get risk flags from responses
 * @param {string} screen - Screen key
 * @param {Object} responses - { itemId: value }
 * @returns {Object} - { soft: [], hard: [] }
 */
export function getRiskFlags(screen, responses) {
    const items = getScreenItems(screen);
    const flags = { soft: [], hard: [] };

    items.forEach(item => {
        if (!item.risk_flag_rule) return;

        const rawVal = responses[item.id];
        const response = (typeof rawVal === 'object' && rawVal !== null && 'main' in rawVal)
            ? rawVal.main
            : rawVal;
        const rule = item.risk_flag_rule;

        let flagged = false;

        // Check condition
        if (rule.condition === 'yes' && (response === true || response === 'Oui' || response === 'oui')) flagged = true;
        if (rule.condition === 'no' && (response === false || response === 'Non' || response === 'non')) flagged = true;
        if (rule.condition === 'gte_8') {
            const num = Number(response);
            if (!isNaN(num) && num >= 8) flagged = true;
        }

        if (flagged) {
            if (rule.type === 'hard') {
                flags.hard.push({ itemId: item.id, label: item.label });
            } else {
                flags.soft.push({ itemId: item.id, label: item.label });
            }
        }
    });

    return flags;
}
