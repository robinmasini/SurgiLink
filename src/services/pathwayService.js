import { supabase } from '../lib/supabase';
import { getScreenItems, getRiskFlags } from '../config/pathway.config';

/**
 * Pathway Service
 * Manages patient pathway responses and completion tracking
 */

/**
 * Save a pathway response
 * @param {number} patientId - Patient ID
 * @param {string} screen - J7, J2, or J1
 * @param {string} itemId - Item ID
 * @param {any} response - Response value
 * @param {boolean} completed - Whether this  completes the item
 * @returns {Promise<Object>} - { success, data, error }
 */
export async function saveResponse(patientId, screen, itemId, response, completed = false) {
    try {
        const payload = {
            patient_id: patientId,
            screen,
            item_id: itemId,
            response: { value: response },
            completed_at: completed ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('pathway_responses')
            .upsert(payload, {
                onConflict: 'patient_id,screen,item_id'
            })
            .select()
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('Error saving pathway response:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all responses for a patient and screen
 * @param {number} patientId - Patient ID
 * @param {string} screen - J7, J2, or J1
 * @returns {Promise<Object>} - { itemId: value }
 */
export async function getResponses(patientId, screen) {
    try {
        const { data, error } = await supabase
            .from('pathway_responses')
            .select('*')
            .eq('patient_id', patientId)
            .eq('screen', screen);

        if (error) throw error;

        // Convert to object map
        const responses = {};
        (data || []).forEach(item => {
            responses[item.item_id] = item.response?.value;
        });

        return responses;
    } catch (error) {
        console.error('Error fetching pathway responses:', error);
        return {};
    }
}

/**
 * Get completion status for a screen
 * @param {number} patientId - Patient ID
 * @param {string} screen - J7, J2, or J1
 * @returns {Promise<Object>} - { completed, total, missing, percentage }
 */
export async function getCompletionStatus(patientId, screen) {
    const items = getScreenItems(screen);
    const requiredItems = items.filter(item => item.required !== false);
    const responses = await getResponses(patientId, screen);

    const completed = requiredItems.filter(item => {
        const response = responses[item.id];
        return response !== undefined && response !== null && response !== '';
    });

    const missing = requiredItems.filter(item => {
        const response = responses[item.id];
        return response === undefined || response === null || response === '';
    });

    return {
        completed: completed.length,
        total: requiredItems.length,
        missing: missing.map(item => ({ id: item.id, label: item.label })),
        percentage: requiredItems.length > 0 ? Math.round((completed.length / requiredItems.length) * 100) : 0,
        isComplete: completed.length === requiredItems.length
    };
}

/**
 * Get all pathway status for a patient (all screens)
 * @param {number} patientId - Patient ID
 * @returns {Promise<Object>} - { J7: {...}, J2: {...}, J1: {...} }
 */
export async function getPatientPathwayStatus(patientId) {
    const screens = ['J7', 'J2', 'J1'];
    const status = {};

    for (const screen of screens) {
        status[screen] = await getCompletionStatus(patientId, screen);
    }

    return status;
}

/**
 * Calculate risk flags for a patient screen
 * @param {number} patientId - Patient ID
 * @param {string} screen - J7, J2, or J1
 * @returns {Promise<Object>} - { soft: [], hard: [] }
 */
export async function calculateRiskFlags(patientId, screen) {
    const responses = await getResponses(patientId, screen);
    return getRiskFlags(screen, responses);
}

/**
 * Mark a screen as completed
 * @param {number} patientId - Patient ID
 * @param {string} screen - J7, J2, or J1
 * @returns {Promise<Object>} - { success, error }
 */
export async function markScreenCompleted(patientId, screen) {
    try {
        // Update all responses to mark as completed
        const { error } = await supabase
            .from('pathway_responses')
            .update({ completed_at: new Date().toISOString() })
            .eq('patient_id', patientId)
            .eq('screen', screen);

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('Error marking screen completed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get incomplete items with reminder policies
 * @param {number} patientId - Patient ID
 * @param {string} screen - J7, J2, or J1
 * @returns {Promise<Array>} - Array of incomplete items that need reminders
 */
export async function getIncompleteItemsWithReminders(patientId, screen) {
    const items = getScreenItems(screen);
    const responses = await getResponses(patientId, screen);

    const incompleteWithReminders = items
        .filter(item => {
            // Must have reminder policy
            if (!item.reminder_policy) return false;

            // Must be incomplete
            const response = responses[item.id];
            return response === undefined || response === null || response === '';
        })
        .map(item => ({
            id: item.id,
            label: item.label,
            reminderPolicy: item.reminder_policy
        }));

    return incompleteWithReminders;
}
