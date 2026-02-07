// Ambulatory Pathway Configuration
// Config-driven question system for J-7, J-2, and J+1 screens

export const pathwayConfig = {
    // J-7: Preparation Checklist
    J7: {
        title: "Checklist Préparation",
        subtitle: "J-7 avant votre intervention",
        sections: [
            {
                id: "administrative",
                icon: "📋",
                title: "Étape Administrative",
                subtitle: "Dernière ligne droite ! Vérifions ensemble que tout est prêt.",
                items: [
                    {
                        id: "anesthesia_consultation",
                        type: "yes_no",
                        label: "Consultation d'anesthésie",
                        why: "C'est une obligation légale de sécurité.",
                        action: "Si non effectuée, contactez-nous au plus vite.",
                        required: true,
                        risk_flag_rule: { type: "hard", condition: "no" },
                        reminder_policy: {
                            auto_reminder_delay_hours: 48, // Remind if not done after 48h
                            max_reminders: 3,
                            sms_template_key: "j7_anesthesia_missing"
                        }
                    },
                    {
                        id: "blood_work",
                        type: "yes_no",
                        label: "Bilan sanguin",
                        why: "Pour vérifier qu'il n'y a aucune contre-indication.",
                        action: "Si prescrit mais non effectué, faites-le rapidement.",
                        required: true,
                        risk_flag_rule: { type: "soft", condition: "no" },
                        reminder_policy: {
                            auto_reminder_delay_hours: 72,
                            max_reminders: 2,
                            sms_template_key: "j7_bloodwork_missing"
                        }
                    }
                ]
            },
            {
                id: "preparation",
                icon: "✂️",
                title: "Préparation Épilation",
                subtitle: null,
                items: [
                    {
                        id: "hair_removal_cream",
                        type: "yes_no",
                        label: "Avez-vous acheté la crème dépilatoire et fait un test d'allergie ?",
                        why: "Tester la crème à l'avance évite les réactions allergiques de dernière minute.",
                        action: "Appliquez un peu de crème sur l'avant-bras 48h avant.",
                        required: true,
                        warning_banner: {
                            type: "warning",
                            message: "L'épilation devra être faite à la crème dépilatoire la veille de l'opération. Le rasoir est interdit."
                        },
                        risk_flag_rule: { type: "soft", condition: "no" },
                        reminder_policy: {
                            auto_reminder_delay_hours: 72,
                            max_reminders: 2,
                            sms_template_key: "generic_item_reminder"
                        }
                    },
                    {
                        id: "recent_infection",
                        type: "yes_no",
                        label: "Signes infectieux récents (fièvre, plaie, infection) ?",
                        why: "Une infection peut contre-indiquer l'intervention.",
                        action: "Si oui, contactez-nous immédiatement.",
                        required: true,
                        risk_flag_rule: { type: "hard", condition: "yes" }
                    }
                ]
            },
            {
                id: "companion",
                icon: "👤",
                title: "Retour à domicile",
                subtitle: null,
                items: [
                    {
                        id: "companion_confirmed",
                        type: "yes_no",
                        label: "Accompagnant confirmé pour le retour",
                        why: "La loi interdit formellement de rentrer seul après une anesthésie.",
                        action: "Organisez-vous dès maintenant avec un proche.",
                        required: true,
                        risk_flag_rule: { type: "hard", condition: "no" },
                        alert_if_no: {
                            type: "danger",
                            header: "Sortie compromise",
                            message: "Contactez-nous vite."
                        },
                        reminder_policy: {
                            auto_reminder_delay_hours: 48,
                            max_reminders: 3,
                            sms_template_key: "j7_companion_missing"
                        }
                    }
                ]
            }
        ]
    },

    // J-2: Pre-op Instructions
    J2: {
        title: "Consignes Préopératoires",
        subtitle: "J-2 avant votre intervention",
        sections: [
            {
                id: "documents",
                icon: "📄",
                title: "Documents & Organisation",
                subtitle: "Préparez tout pour le jour J.",
                items: [
                    {
                        id: "documents_ready",
                        type: "yes_no",
                        label: "Documents prêts (pièce d'identité, carte vitale, ordonnances)",
                        why: "Obligatoire pour l'admission.",
                        action: "Préparez-les dans un sac aujourd'hui.",
                        required: true,
                        risk_flag_rule: { type: "soft", condition: "no" }
                    },
                    {
                        id: "companion_final_check",
                        type: "yes_no",
                        label: "Accompagnant confirmé (dernière vérification)",
                        why: "Indispensable pour votre sortie.",
                        action: "Reconfirmez avec la personne.",
                        required: true,
                        risk_flag_rule: { type: "hard", condition: "no" }
                    }
                ]
            },
            {
                id: "fasting",
                icon: "🍽️",
                title: "Jeûne Préopératoire",
                subtitle: null,
                items: [
                    {
                        id: "fasting_understood",
                        type: "yes_no",
                        label: "Consignes de jeûne comprises (6h solides / 2h liquides clairs)",
                        why: "Le jeûne réduit les risques anesthésiques.",
                        action: "Notez l'heure de votre dernier repas et boisson.",
                        required: true,
                        info_banner: {
                            type: "info",
                            message: "Vous pouvez boire de l'eau claire jusqu'à 2h avant l'intervention. Dernier repas léger 6h avant."
                        },
                        risk_flag_rule: { type: "soft", condition: "no" }
                    }
                ]
            },
            {
                id: "hygiene",
                icon: "🚿",
                title: "Hygiène & Préparation",
                subtitle: null,
                items: [
                    {
                        id: "shower_planned",
                        type: "yes_no",
                        label: "Douche préopératoire prévue (matin de l'intervention)",
                        why: "Réduit le risque infectieux.",
                        action: "Prévoyez une douche complète avec savon doux.",
                        required: true
                    },
                    {
                        id: "no_razor",
                        type: "yes_no",
                        label: "Confirmation : pas de rasoir, seulement crème dépilatoire si nécessaire",
                        why: "Le rasoir crée des micro-coupures favorisant les infections.",
                        action: "Utilisez uniquement une crème dépilatoire testée.",
                        required: true,
                        risk_flag_rule: { type: "soft", condition: "no" }
                    }
                ]
            },
            {
                id: "medical",
                icon: "💊",
                title: "Traitements & Santé",
                subtitle: null,
                items: [
                    {
                        id: "treatments_reviewed",
                        type: "yes_no",
                        label: "Traitements habituels revus avec l'équipe",
                        why: "Certains médicaments doivent être arrêtés ou adaptés.",
                        action: "Relisez les consignes de l'anesthésiste.",
                        required: true,
                        risk_flag_rule: { type: "soft", condition: "no" }
                    },
                    {
                        id: "recent_infection_j2",
                        type: "yes_no",
                        label: "Apparition de signes infectieux depuis J-7 ?",
                        why: "Pourrait nécessiter un report.",
                        action: "Si oui, contactez-nous immédiatement.",
                        required: true,
                        risk_flag_rule: { type: "hard", condition: "yes" }
                    }
                ]
            },
            {
                id: "understanding",
                icon: "✅",
                title: "Compréhension",
                subtitle: null,
                items: [
                    {
                        id: "day_j_instructions",
                        type: "yes_no",
                        label: "Consignes du jour J notées (heure, lieu, choses à apporter)",
                        why: "Pour éviter le stress de dernière minute.",
                        action: "Notez tout dans votre téléphone ou sur papier.",
                        required: true
                    }
                ]
            }
        ]
    },

    // J+1: Post-op Nurse Call (Staff-facing)
    J1: {
        title: "Appel Infirmier Post-op",
        subtitle: "J+1 - Suivi du patient",
        sections: [
            {
                id: "contact",
                icon: "📞",
                title: "Traçabilité Contact",
                subtitle: null,
                items: [
                    {
                        id: "contact_status",
                        type: "select",
                        label: "Résultat du contact",
                        options: [
                            { value: "contacted", label: "Contact établi" },
                            { value: "voicemail", label: "Messagerie / Message laissé" },
                            { value: "callback", label: "Rappel programmé" },
                            { value: "wrong_number", label: "Numéro erroné" }
                        ],
                        required: true
                    }
                ]
            },
            {
                id: "home_return",
                icon: "🏠",
                title: "Retour à Domicile",
                subtitle: null,
                items: [
                    {
                        id: "night_ok",
                        type: "yes_no",
                        label: "La nuit s'est-elle bien passée ?",
                        why: "Détecte les complications précoces.",
                        action: null,
                        required: true,
                        conditional_field: {
                            show_if: "no",
                            type: "text",
                            label: "Précisions",
                            placeholder: "Décrivez les problèmes rencontrés..."
                        }
                    },
                    {
                        id: "medical_consultation",
                        type: "yes_no",
                        label: "Recours au médecin ou aux urgences ?",
                        why: "Essentiel pour le suivi et la traçabilité.",
                        action: null,
                        required: true,
                        risk_flag_rule: { type: "hard", condition: "yes" },
                        conditional_fields: {
                            show_if: "yes",
                            fields: [
                                { id: "consultation_where", type: "text", label: "Où ?", placeholder: "Ex: Urgences CHU, médecin traitant..." },
                                { id: "consultation_when", type: "text", label: "Quand ?", placeholder: "Ex: Hier soir 22h" },
                                { id: "consultation_reason", type: "text", label: "Motif", placeholder: "Ex: Douleur intense, saignement..." },
                                { id: "consultation_decision", type: "text", label: "Décision médicale", placeholder: "Ex: Antalgiques prescrits, surveillance..." }
                            ]
                        }
                    }
                ]
            },
            {
                id: "pain",
                icon: "😣",
                title: "Douleur & Antalgiques",
                subtitle: null,
                items: [
                    {
                        id: "has_pain",
                        type: "yes_no",
                        label: "Le patient ressent-il de la douleur ?",
                        why: "Évalue l'efficacité de la prise en charge.",
                        action: null,
                        required: true,
                        conditional_fields: {
                            show_if: "yes",
                            fields: [
                                { id: "pain_level", type: "slider_0_10", label: "Niveau de douleur (0 = aucune, 10 = insupportable)" },
                                { id: "pain_location", type: "text", label: "Localisation", placeholder: "Ex: Au niveau de la cicatrice..." },
                                { id: "pain_type", type: "text", label: "Type de douleur", placeholder: "Ex: Lancinante, brûlure..." }
                            ]
                        }
                    },
                    {
                        id: "pain_medication",
                        type: "tri_state",
                        label: "Prise des antalgiques prescrits",
                        options: [
                            { value: "yes", label: "Oui, régulièrement" },
                            { value: "partial", label: "Partiellement" },
                            { value: "no", label: "Non" }
                        ],
                        why: "Vérifie l'observance du traitement.",
                        action: null,
                        required: true,
                        conditional_field: {
                            type: "text",
                            label: "Effet ressenti",
                            placeholder: "Soulagement, aucun effet, effets secondaires..."
                        }
                    }
                ]
            },
            {
                id: "side_effects",
                icon: "🤢",
                title: "Effets Secondaires",
                subtitle: null,
                items: [
                    {
                        id: "ponv_check",
                        type: "multi_check",
                        label: "Effets secondaires rencontrés",
                        options: [
                            { value: "none", label: "Aucun" },
                            { value: "nausea", label: "Nausées" },
                            { value: "vomiting", label: "Vomissements" },
                            { value: "dizziness", label: "Vertiges" },
                            { value: "constipation", label: "Constipation" },
                            { value: "fatigue", label: "Fatigue importante" },
                            { value: "other", label: "Autre" }
                        ],
                        why: "NVPO et autres effets sont courants mais à surveiller.",
                        action: null,
                        required: true,
                        conditional_field: {
                            show_if_contains: "other",
                            type: "text",
                            label: "Précisez",
                            placeholder: "Décrivez les autres effets..."
                        }
                    }
                ]
            },
            {
                id: "safety",
                icon: "⚠️",
                title: "Sécurité Post-opératoire",
                subtitle: "Signes d'alerte",
                items: [
                    {
                        id: "bleeding",
                        type: "yes_no",
                        label: "Saignement ou hématome anormal ?",
                        why: "Signe d'alerte majeur nécessitant une action immédiate.",
                        action: "Si oui, évaluer l'urgence et orienter.",
                        required: true,
                        risk_flag_rule: { type: "hard", condition: "yes" },
                        conditional_field: {
                            show_if: "yes",
                            type: "text",
                            label: "Description détaillée",
                            placeholder: "Localisation, importance, évolution..."
                        }
                    },
                    {
                        id: "fever_infection",
                        type: "yes_no",
                        label: "Fièvre ou signes d'infection (rougeur, chaleur, écoulement) ?",
                        why: "Infection post-opératoire = urgence médicale.",
                        action: "Si oui, orienter vers consultation rapide.",
                        required: true,
                        risk_flag_rule: { type: "hard", condition: "yes" },
                        conditional_field: {
                            show_if: "yes",
                            type: "text",
                            label: "Signes observés",
                            placeholder: "Température, aspect de la plaie..."
                        }
                    }
                ]
            },
            {
                id: "quality",
                icon: "💬",
                title: "Information & Qualité",
                subtitle: null,
                items: [
                    {
                        id: "instructions_clear",
                        type: "yes_no",
                        label: "Les consignes étaient-elles claires ?",
                        why: "Amélioration continue de notre communication.",
                        action: null,
                        required: true
                    },
                    {
                        id: "has_questions",
                        type: "yes_no",
                        label: "Le patient a-t-il des questions ?",
                        why: "Rassure et complète l'information.",
                        action: null,
                        required: true,
                        conditional_field: {
                            show_if: "yes",
                            type: "text",
                            label: "Questions posées",
                            placeholder: "Note des questions..."
                        }
                    },
                    {
                        id: "esatis_informed",
                        type: "yes_no",
                        label: "Patient informé de l'enquête e-Satis ?",
                        why: "Traçabilité réglementaire.",
                        action: null,
                        required: true
                    }
                ]
            },
            {
                id: "comments",
                icon: "📝",
                title: "Commentaires",
                subtitle: null,
                items: [
                    {
                        id: "nurse_comments",
                        type: "text",
                        label: "Commentaires de l'infirmier(ère)",
                        placeholder: "Résumé de l'appel, points importants, actions à suivre...",
                        multiline: true,
                        required: false
                    }
                ]
            }
        ]
    }
};

/**
 * Get all items from a screen configuration
 * @param {string} screen - J7, J2, or J1
 * @returns {Array} - Flat array of all items
 */
export function getScreenItems(screen) {
    const config = pathwayConfig[screen];
    if (!config) return [];

    return config.sections.flatMap(section => section.items);
}

/**
 * Get a specific item configuration
 * @param {string} screen - J7, J2, or J1
 * @param {string} itemId - Item ID
 * @returns {Object|null} - Item config or null
 */
export function getItemConfig(screen, itemId) {
    const items = getScreenItems(screen);
    return items.find(item => item.id === itemId) || null;
}

/**
 * Check if an item requires a reminder
 * @param {string} screen - J7, J2, or J1
 * @param {string} itemId - Item ID
 * @returns {boolean}
 */
export function itemHasReminderPolicy(screen, itemId) {
    const item = getItemConfig(screen, itemId);
    return item && item.reminder_policy !== undefined;
}

/**
 * Get risk flags from responses
 * @param {string} screen - J7, J2, or J1
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
