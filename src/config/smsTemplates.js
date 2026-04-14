// SMS Templates for Ambulatory Pathway
// Variables: {first_name}, {procedure_date}, {arrival_time}, {clinic_name}, {clinic_phone}, {checklist_link}, {consignes_link}, {item_name}

export const smsTemplates = {
    // Message d'accueil – Préparation de votre intervention
    welcome_accueil: {
        name: "Message d'accueil",
        message: "{clinic_name}: Suivez votre operation du {procedure_date} ici: {checklist_link}",
        variables: ['clinic_name', 'procedure_date', 'checklist_link']
    },
    // J-7 General Reminder
    j7_reminder: {
        name: "Questionnaire J-7",
        message: "{clinic_name}: Merci de completer votre dossier J-7 ici: {checklist_link}",
        variables: ['checklist_link', 'clinic_name']
    },
    // J-2 Pre-op Instructions
    j2_reminder: {
        name: "Questionnaire J-2",
        message: "{clinic_name}: Verifiez vos consignes J-2 ici: {checklist_link}",
        variables: ['checklist_link', 'clinic_name']
    },
    // J-1 Reminders
    j1_reminder_long: {
        name: "Message J-1 Confirmation",
        message: "{clinic_name}: RDV demain {arrival_time}. Confirmez ici: {checklist_link}",
        variables: ['arrival_time', 'clinic_name', 'checklist_link']
    },
    // J-J Day of Surgery
    jj_reminder: {
        name: "Rappel Jour-J",
        message: "{clinic_name}: Votre intervention est aujourd'hui. Suivez les consignes ici: {checklist_link}",
        variables: ['checklist_link', 'clinic_name']
    },
    // Message Sortie d’Etablissement
    sortie_doc: {
        name: "Sortie d'Etablissement",
        message: "{clinic_name}: Vos documents de sortie sont ici: {checklist_link}",
        variables: ['checklist_link', 'clinic_name']
    },
    // J+1 Post-op Follow-up
    j1_postop: {
        name: "Suivi J+1 Post-op",
        message: "{clinic_name}: Comment ca va ? Reponse au suivi J+1 ici: {checklist_link}",
        variables: ['checklist_link', 'clinic_name']
    },
    // J+4 Satisfaction
    j4_satisfaction: {
        name: "Enquête de satisfaction",
        message: "{clinic_name}: Votre avis nous aide ! Enquete ici: {checklist_link}",
        variables: ['checklist_link', 'clinic_name']
    },
    // J+4 e-Satis
    j4_esatis: {
        name: "Enquête e-Satis",
        message: "{clinic_name}: Merci de repondre a l'enquete e-Satis: {esatis_link}",
        variables: ['esatis_link', 'clinic_name']
    },
    // Generic Targeted Reminder
    generic_item_reminder: {
        name: "Generic Item Reminder",
        message: "{clinic_name}: Il manque: {item_name}. Complétez ici: {checklist_link}",
        variables: ['item_name', 'checklist_link', 'clinic_name']
    },
    // Custom Punctual Message (Message Libre)
    custom_punctual: {
        name: "Message Libre",
        message: "{clinic_name}: {manualMessage}",
        variables: ['manualMessage', 'clinic_name']
    },
    // Custom Targeted Reminder
    custom_reminder: {
        name: "Rappel Personnalisé",
        message: "{clinic_name}: {manualMessage}. Lien: {checklist_link}",
        variables: ['manualMessage', 'checklist_link', 'clinic_name']
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
