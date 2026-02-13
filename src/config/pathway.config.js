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
                        label: "Avez-vous effectué votre consultation d'anesthésie ?",
                        why: "C'est une obligation légale de sécurité.",
                        action: "Si non effectuée, contactez-nous au plus vite.",
                        required: true,
                        risk_flag_rule: { type: "hard", condition: "no" },
                        reminder_policy: {
                            auto_reminder_delay_hours: 48,
                            max_reminders: 3,
                            sms_template_key: "j7_anesthesia_missing"
                        }
                    },
                    {
                        id: "blood_work",
                        type: "yes_no",
                        label: "Avez-vous réalisé votre bilan sanguin / cardiologique ?",
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
                        label: "Avez-vous acheté la crème dépilatoire et réalisé le test d'allergie ?",
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
                        label: "Votre accompagnant est-il bien confirmé pour votre retour à domicile ?",
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
                        label: "Avez-vous bien compris et noté les consignes de jeûne ?",
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
                        label: "Avez-vous prévu votre douche à la bétadine / savon doux le matin de l'intervention ?",
                        why: "Réduit le risque infectieux.",
                        action: "Prévoyez une douche complète avec savon doux.",
                        required: true
                    },
                    {
                        id: "no_razor",
                        type: "yes_no",
                        label: "Confirmation : pas de rasage de la zone opératoire (crème dépilatoire uniquement) ?",
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

    // J+1: Post-op Follow-up
    J1: {
        title: "Suivi Post-opératoire",
        subtitle: "J+1 - Votre état de santé",
        sections: [
            {
                id: "symptoms",
                icon: "🌡️",
                title: "Symptômes & Douleur",
                subtitle: null,
                items: [
                    {
                        id: "has_pain",
                        type: "yes_no",
                        label: "Ressentez-vous une douleur importante malgré les traitements ?",
                        why: "Évalue l'efficacité de la prise en charge.",
                        required: true,
                        conditional_fields: {
                            show_if: "yes",
                            fields: [
                                { id: "pain_level", type: "slider_0_10", label: "Niveau de douleur (0 = aucune, 10 = insupportable)" }
                            ]
                        }
                    },
                    {
                        id: "fever_infection",
                        type: "yes_no",
                        label: "Avez-vous de la fièvre (plus de 38°C) ou des frissons ?",
                        why: "Peut être un signe d'infection.",
                        required: true,
                        risk_flag_rule: { type: "hard", condition: "yes" }
                    },
                    {
                        id: "ponv_check",
                        type: "yes_no",
                        label: "Ressentez-vous des nausées ou avez-vous vomi ?",
                        why: "NVPO fréquentes après anesthésie.",
                        required: true
                    },
                    {
                        id: "urine_ok",
                        type: "yes_no",
                        label: "Avez-vous pu uriner normalement depuis votre retour ?",
                        why: "Important après une anesthésie.",
                        required: true,
                        risk_flag_rule: { type: "soft", condition: "no" }
                    }
                ]
            },
            {
                id: "safety",
                icon: "⚠️",
                title: "Sécurité & Pansement",
                subtitle: null,
                items: [
                    {
                        id: "bleeding",
                        type: "yes_no",
                        label: "Votre pansement est-il taché de sang ou se décolle-t-il ?",
                        why: "Nécessite une surveillance du site opératoire.",
                        required: true,
                        risk_flag_rule: { type: "hard", condition: "yes" }
                    },
                    {
                        id: "urgency",
                        type: "yes_no",
                        label: "Ressentez-vous une gêne respiratoire, une douleur thoracique ou une jambe gonflée ?",
                        why: "Signes d'alerte nécessitant un avis médical rapide.",
                        required: true,
                        risk_flag_rule: { type: "hard", condition: "yes" }
                    }
                ]
            },
            {
                id: "medication",
                icon: "💊",
                title: "Traitements",
                subtitle: null,
                items: [
                    {
                        id: "pain_medication",
                        type: "yes_no",
                        label: "Prenez-vous bien vos médicaments contre la douleur comme prescrit ?",
                        why: "L'observance est clé pour le confort.",
                        required: true
                    }
                ]
            }
        ]
    },

    // J+2: Satisfaction
    J2_Satisfaction: {
        title: "Satisfaction & Retour d'expérience",
        subtitle: "J+2 - Votre avis nous intéresse",
        sections: [
            {
                id: "feedback",
                icon: "💬",
                title: "Votre avis",
                subtitle: null,
                items: [
                    {
                        id: "nps",
                        type: "slider_0_10",
                        label: "Sur une échelle de 0 à 10, recommanderiez-vous notre cabinet ?",
                        required: true
                    },
                    {
                        id: "commentaire",
                        type: "text",
                        label: "Souhaitez-vous nous laisser un commentaire sur votre prise en charge ?",
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
 * @param {string} screen - J7, J2, J1 or J2_Satisfaction
 * @returns {Array} - Flat array of all items
 */
export function getScreenItems(screen) {
    const config = pathwayConfig[screen];
    if (!config) return [];

    return config.sections.flatMap(section => section.items);
}

/**
 * Get a specific item configuration
 * @param {string} screen - J7, J2, J1 or J2_Satisfaction
 * @param {string} itemId - Item ID
 * @returns {Object|null} - Item config or null
 */
export function getItemConfig(screen, itemId) {
    const items = getScreenItems(screen);
    return items.find(item => item.id === itemId) || null;
}

/**
 * Check if an item requires a reminder
 * @param {string} screen - J7, J2, J1 or J2_Satisfaction
 * @param {string} itemId - Item ID
 * @returns {boolean}
 */
export function itemHasReminderPolicy(screen, itemId) {
    const item = getItemConfig(screen, itemId);
    return item && item.reminder_policy !== undefined;
}

/**
 * Get risk flags from responses
 * @param {string} screen - J7, J2, J1 or J2_Satisfaction
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
