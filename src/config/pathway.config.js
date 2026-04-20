// Ambulatory Pathway Configuration
// Config-driven question system for the 5-step pathway
// Questions redistributed across the full protocol

export const pathwayConfig = {
    // Bienvenue: Configuration du portail
    Bienvenue: {
        title: "Bienvenue sur SurgiLink",
        subtitle: "Activation de votre suivi",
        sections: [
            {
                id: "welcome_activation",
                icon: "👋",
                title: "Commencer mon parcours",
                items: [
                    {
                        id: "welcome_ok",
                        type: "yes_no",
                        label: "Avez-vous bien reçu vos codes d'accès et compris le fonctionnement de l'application ?",
                        required: false
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
                    },
                    {
                        id: "recent_symptoms",
                        type: "yes_no",
                        label: "Confirmez-vous l'absence de symptômes anormaux (fièvre, toux, rhume, infection...) ?",
                        why: "Être malade peut augmenter les risques liés à l'anesthésie.",
                        required: true,
                        risk_flag_rule: { type: "hard", condition: "no" }
                    },
                    {
                        id: "blood_work",
                        type: "yes_no",
                        label: "Avez-vous réalisé le bilan sanguin (et/ou les examens) prescrit ?",
                        why: "Analyses vitales pour votre sécurité au bloc opératoire (coagulation, absence d'infection, etc.).",
                        required: true,
                        risk_flag_rule: { type: "soft", condition: "no" }
                    }
                ]
            },
            {
                id: "security_prep",
                icon: "👤",
                title: "PARTIE 2 : Retour à domicile et Sécurité post-opératoire",
                items: [
                    {
                        id: "companion_confirmed",
                        type: "yes_no",
                        label: "Avez-vous prévu un accompagnant adulte pour votre trajet de retour ?",
                        why: "Il est strictement interdit de conduire ou de rentrer seul, même en taxi/VTC.",
                        required: true,
                        risk_flag_rule: { type: "hard", condition: "no" }
                    },
                    {
                        id: "night_companion",
                        type: "yes_no",
                        label: "Une personne adulte et valide passera-t-elle la première nuit avec vous ?",
                        why: "C'est une mesure de sécurité indispensable pour appeler les secours en cas de problème.",
                        required: true,
                        risk_flag_rule: { type: "hard", condition: "no" }
                    },
                    {
                        id: "distance_urgency",
                        type: "yes_no",
                        label: "Votre domicile se trouve-t-il à moins d'une heure (1h) d'une structure d'urgence ?",
                        why: "Vous devez pouvoir rejoindre rapidement un service médical compétent en cas de complication.",
                        required: true,
                        risk_flag_rule: { type: "soft", condition: "no" }
                    }
                ]
            }
        ]
    },

    // J-2: Consignes et Vérification
    J2: {
        title: "Questionnaire J-2 – Vérification rapide",
        subtitle: "Avant votre intervention",
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
                id: "recent_health",
                icon: "🌡️",
                title: "3. État de santé récent",
                items: [
                    {
                        id: "recent_health_check",
                        type: "yes_no",
                        label: "Depuis votre consultation, confirmez-vous que votre état de santé est stable (absence de fièvre, toux ou infection récente) ?",
                        required: true,
                        risk_flag_rule: { type: "hard", condition: "no" }
                    }
                ]
            }
        ]
    },

    // J-1: Confirmation
    J1_PreOp: {
        title: "Confirmation de votre admission",
        subtitle: "J-1 - Message Confirmation",
        sections: [
            {
                id: "confirmation",
                icon: "✅",
                title: "Confirmation",
                items: [
                    {
                        id: "admission_confirmed",
                        type: "yes_no",
                        label: "Confirmez-vous que vous avez noté l’heure de votre admission et organisé votre venue ?",
                        required: true,
                        risk_flag_rule: { type: "hard", condition: "no" }
                    }
                ]
            }
        ]
    },

    // J+1: Suivi post-op
    J1: {
        title: "Suivi post-opératoire J+1",
        subtitle: "Votre récupération",
        sections: [
            {
                id: "postop_status",
                icon: "🌡️",
                title: "État de santé",
                items: [
                    {
                        id: "pain_level",
                        type: "slider_0_10",
                        label: "Quelle est votre douleur actuellement ? (0=aucune, 10=intense)",
                        required: true
                    },
                    {
                        id: "general_state",
                        type: "scale",
                        label: "Comment est votre état général ?",
                        options: ["Très satisfaisant", "Satisfaisant", "Moyennement satisfaisant", "Inquiétant"],
                        required: true
                    },
                    {
                        id: "nausea_check",
                        type: "yes_no",
                        label: "Confirmez-vous l'absence de nausées ou vomissements importants depuis votre retour ?",
                        required: true,
                        risk_flag_rule: { type: "soft", condition: "no" }
                    },
                    {
                        id: "site_check",
                        type: "yes_no",
                        label: "Le site opératoire vous semble-t-il normal (absence de saignement, gonflement ou écoulement anormal) ?",
                        required: true,
                        risk_flag_rule: { type: "hard", condition: "no" }
                    },
                    {
                        id: "worry_check",
                        type: "yes_no",
                        label: "Confirmez-vous l'absence de tout symptôme qui vous inquiète ?",
                        required: true,
                        risk_flag_rule: { type: "hard", condition: "no" }
                    },
                    {
                        id: "treatment_followup",
                        type: "yes_no",
                        label: "Avez-vous pu prendre les traitements et suivre les consignes de sortie ?",
                        required: true,
                        risk_flag_rule: { type: "soft", condition: "no" }
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
                    { id: "accueil_qualite", type: "rating", label: "Qualité de l’accueil et courtoisie de l’équipe", required: false },
                    { id: "accueil_attente", type: "rating", label: "Délai d’attente lors de votre admission", required: false },
                    { id: "accueil_infos", type: "rating", label: "Informations reçues à votre arrivée", required: false }
                ]
            },
            {
                id: "medical",
                icon: "🩺",
                title: "2. Votre prise en charge médicale",
                items: [
                    { id: "soins_qualite", type: "rating", label: "La qualité des soins reçus", required: false },
                    { id: "medecins_ecoute", type: "rating", label: "L’écoute et la disponibilité des médecins", required: false },
                    { id: "soignant_ecoute", type: "rating", label: "L’écoute et l’accompagnement des soignants", required: false },
                    { id: "douleur_prise_en_charge", type: "rating", label: "La prise en charge de votre douleur", required: false }
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
                id: "organisation",
                icon: "📋",
                title: "4. Organisation de votre sortie",
                items: [
                    { id: "sortie_explications", type: "rating", label: "Les explications concernant la suite du traitement", required: false },
                    { id: "sortie_clarte_docs", type: "rating", label: "La clarté des documents remis", required: false }
                ]
            },
            {
                id: "global",
                icon: "⭐",
                title: "5. Votre avis global",
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
                title: "6. Commentaire (facultatif)",
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

        const response = responses[item.id];
        const rule = item.risk_flag_rule;

        let flagged = false;

        // Check condition
        if (rule.condition === 'yes' && response === true) flagged = true;
        if (rule.condition === 'no' && response === false) flagged = true;

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
