// SMS Templates for Ambulatory Pathway
// Variables: {first_name}, {procedure_date}, {arrival_time}, {clinic_name}, {clinic_phone}, {checklist_link}, {consignes_link}, {item_name}

export const smsTemplates = {
    // J-7 General Reminder
    j7_reminder: {
        name: "J-7 Checklist Reminder",
        message: "Bonjour {first_name}, complétez votre checklist J-7 avant votre opération du {procedure_date} ici : {checklist_link}. {clinic_name}",
        variables: ['first_name', 'procedure_date', 'checklist_link', 'clinic_name']
    },

    // J-7 Targeted Reminders
    j7_anesthesia_missing: {
        name: "Missing Anesthesia Consultation",
        message: "Bonjour {first_name}, il manque votre consultation d'anesthésie obligatoire avant le {procedure_date}. Contactez-nous au {clinic_phone}. {clinic_name}",
        variables: ['first_name', 'procedure_date', 'clinic_phone', 'clinic_name']
    },

    j7_bloodwork_missing: {
        name: "Missing Blood Work",
        message: "Bonjour {first_name}, si un bilan sanguin vous a été prescrit, merci de le faire avant le {procedure_date}. Questions ? {clinic_phone}. {clinic_name}",
        variables: ['first_name', 'procedure_date', 'clinic_phone', 'clinic_name']
    },

    j7_companion_missing: {
        name: "Missing Companion Confirmation",
        message: "Bonjour {first_name}, n'oubliez pas qu'un accompagnant est obligatoire pour rentrer chez vous le {procedure_date}. Contactez-nous si besoin : {clinic_phone}. {clinic_name}",
        variables: ['first_name', 'procedure_date', 'clinic_phone', 'clinic_name']
    },

    // J-2 Pre-op Instructions
    j2_reminder: {
        name: "J-2 Pre-op Instructions",
        message: "Bonjour {first_name}, J-2 avant votre intervention. Documents prêts ? Accompagnant confirmé ? Consignes de jeûne comprises ? Vérifiez tout ici : {consignes_link}. {clinic_name}",
        variables: ['first_name', 'consignes_link', 'clinic_name']
    },

    // J-1 Reminders
    j1_reminder_long: {
        name: "J-1 Detailed Reminder",
        message: "Bonjour {first_name}, c'est demain ! Arrivée à {arrival_time}. Rappel : jeûne 6h (solides) / 2h (liquides clairs). Documents + accompagnant. Questions ? {clinic_phone}. {clinic_name}",
        variables: ['first_name', 'arrival_time', 'clinic_phone', 'clinic_name']
    },

    j1_reminder_short: {
        name: "J-1 Short Reminder",
        message: "{first_name}, RDV demain {arrival_time}. Jeûne 6h/2h. Documents. Accompagnant. {clinic_name}",
        variables: ['first_name', 'arrival_time', 'clinic_name']
    },

    // J+1 Post-op Follow-up
    j1_postop: {
        name: "J+1 Post-op Call Notice",
        message: "Bonjour {first_name}, vous serez contacté(e) aujourd'hui par notre équipe pour votre suivi post-opératoire. Merci de répondre à l'appel. {clinic_name}",
        variables: ['first_name', 'clinic_name']
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
