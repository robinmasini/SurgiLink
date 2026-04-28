// SMS Templates for Ambulatory Pathway
// Variables: {first_name}, {procedure_date}, {arrival_time}, {clinic_name}, {clinic_phone}, {checklist_link}, {consignes_link}, {item_name}

export const smsTemplates = {
    // Message d'accueil – Préparation de votre intervention
    welcome_accueil: {
        name: "Message d'accueil",
        message: "Suivez votre operation du {procedure_date} ici: {checklist_link}",
        variables: ['procedure_date', 'checklist_link']
    },

    // J-7 General Reminder
    j7_reminder: {
        name: "Questionnaire J-7",
        message: "Merci de completer votre dossier J-7 ici: {checklist_link}",
        variables: ['checklist_link']
    },

    // J-2 Pre-op Instructions
    j2_reminder: {
        name: "Questionnaire J-2",
        message: "Verifiez vos consignes J-2 ici: {checklist_link}",
        variables: ['checklist_link']
    },

    // J-1 Reminders
    j1_reminder_long: {
        name: "Message J-1 Confirmation",
        message: "RDV demain {arrival_time}. Confirmez ici: {checklist_link}",
        variables: ['arrival_time', 'checklist_link']
    },

    // J-J Day of Surgery
    jj_reminder: {
        name: "Rappel Jour-J",
        message: "Votre intervention est aujourd'hui. Suivez les consignes ici: {checklist_link}",
        variables: ['checklist_link']
    },

    // Message Sortie d’Etablissement
    sortie_doc: {
        name: "Sortie d'Etablissement",
        message: "Vos documents de sortie sont ici: {checklist_link}",
        variables: ['checklist_link']
    },

    // J+1 Post-op Follow-up
    j1_postop: {
        name: "Suivi J+1 Post-op",
        message: "Comment ca va ? Reponse au suivi J+1 ici: {checklist_link}",
        variables: ['checklist_link']
    },

    // J+4 Satisfaction
    j4_satisfaction: {
        name: "Enquête de satisfaction",
        message: "Votre avis nous aide ! Enquete ici: {checklist_link}",
        variables: ['checklist_link']
    },

    // J+4 e-Satis
    j4_esatis: {
        name: "Enquête e-Satis",
        message: "Merci de repondre a l'enquete e-Satis: {esatis_link}",
        variables: ['esatis_link']
    },

    // Generic Targeted Reminder
    generic_item_reminder: {
        name: "Generic Item Reminder",
        message: "Il manque: {item_name}. Complétez ici: {checklist_link}",
        variables: ['item_name', 'checklist_link']
    },

    // Custom Punctual Message (Message Libre)
    custom_punctual: {
        name: "Message Libre",
        message: "{manualMessage}",
        variables: ['manualMessage']
    },

    // Custom Targeted Reminder
    custom_reminder: {
        name: "Rappel Personnalisé",
        message: "{manualMessage}. Lien: {checklist_link}",
        variables: ['manualMessage', 'checklist_link']
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

    // Append a space and newline to prevent Vonage's trial suffix from gluing to URLs
    return message + " \n";
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
