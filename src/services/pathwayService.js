import { supabase } from '../lib/supabase.js';
import { getScreenItems, getRiskFlags } from '../config/pathway.config.js';

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
        const screens = ['Bienvenue', 'J7', 'J2', 'J1_PreOp', 'J1', 'J4_Satisfaction', 'ESATIS'];

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

            // Handle legacy screen/item IDs for backward compatibility and 100% reachability
            if (r.screen === 'J1PreOp') {
                responseMap[`J1_PreOp:${r.item_id}`] = r.response?.value;
            }
            if (r.item_id === 'hygiene_understood') {
                responseMap[`${r.screen}:shower_understood`] = r.response?.value;
            }
            if (r.item_id === 'recommendation') {
                responseMap[`${r.screen}:recommandation`] = r.response?.value;
            }
            if (r.item_id === 'comment') {
                responseMap[`${r.screen}:verbatim`] = r.response?.value;
            }
        });

        // 2. Count total required items and completed items + Calculate risks
        let totalRequired = 0;
        let totalCompleted = 0;
        let hasHardRisk = false;
        let hasSoftRisk = false;

        screens.forEach(screen => {
            const items = getScreenItems(screen);
            const requiredItems = items.filter(item =>
                item.required !== false &&
                item.type !== 'text' &&
                item.type !== 'verbatim'
            );

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

        // 3. Calculate progress percentage
        let progress = totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : 0;
        progress = Math.min(progress, 100);

        // 4. Get patient data for time-based risks
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

        const j7Status = await getCompletionStatus(patientId, 'J7');
        const j2Status = await getCompletionStatus(patientId, 'J2');
        const hasAcessedPortal = hoursSinceCreation > 0 && (responses || []).length > 0;

        // --- DYNAMIC STATUS LOGIC ---
        // 1. Fetch rules with fallback
        let rules = {
            no_portal_access_hours: 24,
            j7_incomplete_days: 7,
            j3_critical_upgrade: 3,
            progress_critical_threshold: 80,
            progress_success_threshold: 100,
            assiduité_success_enabled: true
        };

        try {
            const { data: settingsData } = await supabase
                .from('app_settings')
                .select('value')
                .eq('key', 'status_rules')
                .maybeSingle();

            if (settingsData?.value) {
                rules = { ...rules, ...(typeof settingsData.value === 'string' ? JSON.parse(settingsData.value) : settingsData.value) };
            }
        } catch (e) {
            console.warn('Using default status rules due to fetch error:', e);
        }

        // Determine status based on risks, progress, and timing
        let status = 'neutre';

        // 1. Check for success (Green Bolt) - Assiduité or Progress Threshold
        const isUpToDate = (
            (daysUntilSurgery > rules.j7_incomplete_days) ||
            (daysUntilSurgery <= rules.j7_incomplete_days && j7Status.isComplete)
        ) && (
                (daysUntilSurgery > 2) ||
                (daysUntilSurgery <= 2 && j2Status.isComplete)
            );

        if (progress === 100) {
            status = 'success';
        } else if (hasHardRisk) {
            status = 'critique';
        } else if (hasSoftRisk) {
            status = 'alerte';
        } else {
            // Success if up to date and enabled, OR threshold reached
            if ((rules.assiduité_success_enabled && isUpToDate && progress > 0) ||
                (progress >= rules.progress_success_threshold && progress > 0)) {
                status = 'success';
            } else {
                // Timing-based Alerte/Critique using dynamic rules
                if (!hasAcessedPortal && hoursSinceCreation > rules.no_portal_access_hours) {
                    status = 'alerte';
                } else if (!j7Status.isComplete && daysUntilSurgery <= rules.j7_incomplete_days) {
                    status = 'alerte';
                } else if (progress < 50 && daysUntilSurgery <= rules.j7_incomplete_days) {
                    status = 'alerte';
                }

                // Upgrade logic
                if ((status === 'alerte' || progress < rules.progress_critical_threshold) && daysUntilSurgery <= rules.j3_critical_upgrade) {
                    status = 'critique';
                }

                // Default to incomplete or neutre
                if (status === 'neutre' && progress > 0) {
                    status = 'incomplete';
                }
            }
        }
        // --- END DYNAMIC STATUS LOGIC ---

        // 5. Update the patients table
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
    const requiredItems = items.filter(item =>
        item.required !== false &&
        item.type !== 'text' &&
        item.type !== 'verbatim'
    );
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
    const screens = ['Bienvenue', 'J7', 'J2', 'J1_PreOp', 'J1', 'J4_Satisfaction', 'ESATIS'];
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
