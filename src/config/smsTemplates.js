// SMS Templates for Ambulatory Pathway
// Variables: {first_name}, {procedure_date}, {arrival_time}, {clinic_name}, {clinic_phone}, {checklist_link}, {consignes_link}, {item_name}

export const smsTemplates = {
    // Message d'accueil – Préparation de votre intervention
    welcome_accueil: {
        name: "Message d'accueil",
        message: "Bonjour {first_name}, bienvenue chez {clinic_name}. Pour votre opération du {procedure_date}, vous allez bénéficier d'un suivi personnalisé par SMS avant et après l'intervention. Préparez votre séjour ici : {checklist_link}. À bientôt !",
        variables: ['first_name', 'clinic_name', 'procedure_date', 'checklist_link']
    },
    // J-7 General Reminder
    j7_reminder: {
        name: "Questionnaire J-7",
        message: "Bonjour {first_name}, à J-7 de votre opération, merci de compléter votre questionnaire de pré-admission ici : {checklist_link}. L'équipe de {clinic_name}",
        variables: ['first_name', 'checklist_link', 'clinic_name']
    },
    // J-2 Pre-op Instructions
    j2_reminder: {
        name: "Questionnaire J-2",
        message: "Bonjour {first_name}, à J-2 de votre intervention, merci de vérifier vos consignes et de répondre à ces 3 questions rapides : {checklist_link}. {clinic_name}",
        variables: ['first_name', 'checklist_link', 'clinic_name']
    },
    // J-1 Reminders
    j1_reminder_long: {
        name: "Message J-1 Confirmation",
        message: "Bonjour {first_name}, RDV demain à {arrival_time} à {clinic_name}. Merci de confirmer votre venue en répondant au questionnaire : {checklist_link}",
        variables: ['first_name', 'arrival_time', 'clinic_name', 'checklist_link']
    },
    // Message Sortie d’Etablissement
    sortie_doc: {
        name: "Sortie d'Etablissement",
        message: "Bonjour {first_name}, vous trouverez vos documents de sortie (ordonnances, protocole) sur votre portail : {checklist_link}. Bonne récupération !",
        variables: ['first_name', 'checklist_link']
    },
    // J+1 Post-op Follow-up
    j1_postop: {
        name: "Suivi J+1 Post-op",
        message: "Bonjour {first_name}, comment se passe votre premier jour à domicile ? Merci de répondre au suivi post-opératoire : {checklist_link}",
        variables: ['first_name', 'checklist_link']
    },
    // J+4 Satisfaction
    j4_satisfaction: {
        name: "Enquête de satisfaction",
        message: "Bonjour {first_name}, votre avis nous aide à améliorer la qualité de nos soins. Merci de répondre à notre enquête de satisfaction : {checklist_link}",
        variables: ['first_name', 'checklist_link']
    },
    // J+4 e-Satis
    j4_esatis: {
        name: "Enquête e-Satis",
        message: "Bonjour {first_name}, suite à votre séjour à {clinic_name}, merci de répondre au questionnaire national e-Satis : {esatis_link}",
        variables: ['first_name', 'clinic_name', 'esatis_link']
    },
    // Generic Targeted Reminder
    generic_item_reminder: {
        name: "Generic Item Reminder",
        message: "Bonjour {first_name}, il manque une information importante : {item_name}. Complétez votre dossier : {checklist_link}. {clinic_name}",
        variables: ['first_name', 'item_name', 'checklist_link', 'clinic_name']
    }
};

/**
 * Interpolate template variables
 * @param {string} templateKey - The template key from smsTemplates
 * @param {Object} variables - Key-value pairs for variable substitution
 * @returns {string} - The interpolated message
 */
export function interpolateTemplate(templateKey, variables) {
    const template = smsTemplates[templateKey];

    if (!template) {
        throw new Error(`SMS template '${templateKey}' not found`);
    }

    let message = template.message;

    // Replace all variables in the format {variable_name}
    Object.keys(variables).forEach(key => {
        const placeholder = `{${key}}`;
        message = message.replace(new RegExp(placeholder, 'g'), variables[key] || '');
    });

    return message;
}

/**
 * Validate that all required variables are provided
 * @param {string} templateKey - The template key
 * @param {Object} variables - Provided variables
 * @returns {Object} - { valid: boolean, missing: string[] }
 */
export function validateTemplateVariables(templateKey, variables) {
    const template = smsTemplates[templateKey];

    if (!template) {
        return { valid: false, missing: ['Template not found'] };
    }

    const missing = template.variables.filter(varName => !variables[varName]);

    return {
        valid: missing.length === 0,
        missing
    };
}
