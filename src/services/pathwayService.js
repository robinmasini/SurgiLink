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

        // Trigger global progress recalculation and sync
        await calculateGlobalProgress(patientId);

        return { success: true, data };
    } catch (error) {
        console.error('Error saving pathway response:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Calculate global progress across all protocol screens and sync with patients table
 * @param {number} patientId - Patient ID
 * @returns {Promise<number>} - Global progress percentage (0-100)
 */
export async function calculateGlobalProgress(patientId) {
    try {
        const screens = ['J7', 'J2', 'J1_PreOp', 'J1', 'J4_Satisfaction'];

        // 1. Get all responses for this patient
        const { data: responses, error: respError } = await supabase
            .from('pathway_responses')
            .select('*')
            .eq('patient_id', patientId);

        if (respError) throw respError;

        // Create a map for quick lookup
        const responseMap = {};
        (responses || []).forEach(r => {
            const key = `${r.screen}:${r.item_id}`;
            responseMap[key] = r.response?.value;
        });

        // 2. Count total required items and completed items + Calculate risks
        let totalRequired = 0;
        let totalCompleted = 0;
        let hasHardRisk = false;
        let hasSoftRisk = false;

        screens.forEach(screen => {
            const items = getScreenItems(screen);
            const requiredItems = items.filter(item => item.required !== false);

            totalRequired += requiredItems.length;

            const screenResponses = {};
            items.forEach(item => {
                const val = responseMap[`${screen}:${item.id}`];
                screenResponses[item.id] = val;
                if (item.required !== false && val !== undefined && val !== null && val !== '') {
                    totalCompleted += 1;
                }
            });

            // Calculate risk flags for this screen
            const riskFlags = getRiskFlags(screen, screenResponses);
            if (riskFlags.hard && riskFlags.hard.length > 0) hasHardRisk = true;
            if (riskFlags.soft && riskFlags.soft.length > 0) hasSoftRisk = true;
        });

        // 3. Get patient data for time-based risks
        const { data: patient, error: patientFetchError } = await supabase
            .from('patients')
            .select('created_at, date')
            .eq('id', patientId)
            .single();

        if (patientFetchError) throw patientFetchError;

        const createdAt = new Date(patient.created_at);
        const surgeryDate = patient.date ? new Date(patient.date) : null;
        const now = new Date();
        const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
        const daysUntilSurgery = surgeryDate ? Math.ceil((surgeryDate - now) / (1000 * 60 * 60 * 24)) : 999;

        const hasAnyJ7 = (responses || []).some(r => r.screen === 'J7');
        const hasAnyResponse = (responses || []).length > 0;

        // Determine status based on risks, progress, and timing
        let status = 'neutre';

        if (progress === 100) {
            status = 'ready';
        } else if (hasHardRisk) {
            status = 'critique';
        } else if (hasSoftRisk) {
            status = 'alerte';
        } else {
            // Timing-based Alerte/Critique
            if (!hasAnyResponse && hoursSinceCreation > 24) {
                // Non-réponse au Bienvenue après 24h
                status = 'alerte';
            } else if (!hasAnyJ7 && daysUntilSurgery <= 7) {
                // Non-réponse au J-7 après l'échéance
                status = 'alerte';
            }

            // Upgrade to Critique if multiple deadlines are missed or very close to surgery
            if (status === 'alerte' && daysUntilSurgery <= 2) {
                status = 'critique';
            }

            // Default to incomplete or neutre
            if (status === 'neutre' && progress > 0) {
                status = 'incomplete';
            }
        }

        // 4. Update the patients table
        const { error: updateError } = await supabase
            .from('patients')
            .update({ progress, status })
            .eq('id', patientId);

        if (updateError) throw updateError;

        return progress;
    } catch (error) {
        console.error('Error calculating global progress:', error);
        return 0;
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
    const screens = ['J7', 'J2', 'J1_PreOp', 'J1', 'J4_Satisfaction'];
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
