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
        const screens = ['Bienvenue', 'J7', 'J1_PreOp', 'J1', 'J4_Satisfaction', 'ESATIS'];

        // 1. Get all responses for this patient
        const { data: responses, error: respError } = await supabase
            .from('pathway_responses')
            .select('*')
            .eq('patient_id', patientId);

        if (respError) throw respError;

        // Create a map for quick lookup
        const responseMap = {};
        (responses || []).forEach(r => {
            // Store with both original and lowercase screen name for robustness
            const key = `${r.screen}:${r.item_id}`;
            const lowerKey = `${r.screen.toLowerCase()}:${r.item_id}`;
            responseMap[key] = r.response?.value;
            responseMap[lowerKey] = r.response?.value;

            // Handle legacy screen/item IDs for backward compatibility and 100% reachability
            if (r.screen.toLowerCase() === 'j1preop' || r.screen.toLowerCase() === 'j1_preop') {
                responseMap[`J1_PreOp:${r.item_id}`] = r.response?.value;
                responseMap[`j1_preop:${r.item_id}`] = r.response?.value;
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
                const val = responseMap[`${screen}:${item.id}`] ?? responseMap[`${screen.toLowerCase()}:${item.id}`];
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
            .select('created_at, date, last_consulted_at')
            .eq('id', patientId)
            .single();

        if (patientFetchError) throw patientFetchError;

        const createdAt = new Date(patient.created_at);
        const surgeryDate = patient.date ? new Date(patient.date) : null;
        const now = new Date();
        
        // Zero out times to match PatientPortal.jsx exactly and avoid timezone edge cases
        const todayForDiff = new Date();
        todayForDiff.setHours(0, 0, 0, 0);
        const surgeryDateForDiff = patient.date ? new Date(patient.date) : null;
        if (surgeryDateForDiff) surgeryDateForDiff.setHours(0, 0, 0, 0);
        
        const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
        const daysUntilSurgery = surgeryDateForDiff ? Math.ceil((surgeryDateForDiff - todayForDiff) / (1000 * 60 * 60 * 24)) : 999;

        const j7Status = await getCompletionStatus(patientId, 'J7');
        const hasAcessedPortal = !!patient.last_consulted_at || (responses || []).length > 0;

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

        // Determine status based on milestones completion
        const milestones = [
            { id: 'Bienvenue', offset: 18 },
            { id: 'J7', offset: 7 },
            { id: 'J1_PreOp', offset: 1 },
            { id: 'J1', offset: -1 },
            { id: 'J4_Satisfaction', offset: -4 },
            { id: 'ESATIS', offset: -4 }
        ];

        let allDueMilestonesComplete = true;
        milestones.forEach(m => {
            if (daysUntilSurgery <= m.offset) {
                const mItems = getScreenItems(m.id);
                const mRequired = mItems.filter(item =>
                    item.required !== false &&
                    item.type !== 'text' &&
                    item.type !== 'verbatim'
                );
                if (mRequired.length > 0) {
                    const mIsComplete = mRequired.every(item => {
                        const val = responseMap[`${m.id}:${item.id}`] ?? responseMap[`${m.id.toLowerCase()}:${item.id}`];
                        return val !== undefined && val !== null && val !== '';
                    });
                    if (!mIsComplete) allDueMilestonesComplete = false;
                }
            }
        });

        // Determine status based on risks, progress, and timing
        let status = 'neutre';

        if (progress === 100) {
            status = 'success';
        } else if (hasHardRisk) {
            status = 'critique';
        } else if (hasSoftRisk) {
            status = 'alerte';
        } else {
            // Success if all due milestones are complete and some progress is made
            if (allDueMilestonesComplete && (progress > 0 || hasAcessedPortal)) {
                status = 'success';
            } else {
                // Timing-based Alerte/Critique using dynamic rules
                if (!hasAcessedPortal && hoursSinceCreation > rules.no_portal_access_hours) {
                    status = 'alerte';
                } else if (!j7Status.isComplete && daysUntilSurgery <= rules.j7_incomplete_days) {
                    status = 'alerte';
                }

                // Upgrade logic
                if (status === 'alerte' && daysUntilSurgery <= rules.j3_critical_upgrade) {
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
        const formattedDaysUntil = daysUntilSurgery === 999 ? '' : (daysUntilSurgery >= 0 ? `J-${daysUntilSurgery}` : `J+${Math.abs(daysUntilSurgery)}`);
        const { error: updateError } = await supabase
            .from('patients')
            .update({ progress, status, days_until: formattedDaysUntil })
            .eq('id', patientId);

        return { progress, status, daysUntil: formattedDaysUntil };
    } catch (error) {
        console.error('Error calculating global progress:', error);
        return { progress: 0, status: 'neutre', daysUntil: '' };
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
            .select('item_id, response, updated_at, screen')
            .eq('patient_id', patientId);

        if (error) throw error;

        // Filter manually to be case-insensitive and handle legacy J1PreOp / J1_PreOp
        const filteredData = data.filter(r => {
            const rowScreen = r.screen.toLowerCase();
            const targetScreen = screen.toLowerCase();
            if (rowScreen === targetScreen) return true;
            // Map legacy J1PreOp to J1_PreOp and vice-versa
            if ((rowScreen === 'j1preop' || rowScreen === 'j1_preop') && 
                (targetScreen === 'j1preop' || targetScreen === 'j1_preop')) return true;
            return false;
        });
        
        const responses = {};
        filteredData.forEach(item => {
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
    const screens = ['Bienvenue', 'J7', 'J1_PreOp', 'J1', 'J4_Satisfaction', 'ESATIS'];
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
        // Update all responses to mark as completed (case-insensitive for screen)
        const { error } = await supabase
            .from('pathway_responses')
            .update({ completed_at: new Date().toISOString() })
            .eq('patient_id', patientId)
            .ilike('screen', screen);

        if (error) throw error;

        // Recalculate progress/status after marking the screen completed
        await calculateGlobalProgress(patientId);

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

/**
 * Consolidate duplicate patient records in Supabase
 * Merges responses, tokens, and history of duplicate patients into the primary record
 */
export async function consolidateDuplicatePatients() {
    try {
        const { data: allPatients, error } = await supabase
            .from('patients')
            .select('*')
            .order('created_at', { ascending: true });

        if (error || !allPatients || allPatients.length === 0) return;

        // Group by normalized name
        const groups = {};
        allPatients.forEach(p => {
            const normName = (p.name || '').trim().toLowerCase();
            if (!normName) return;
            if (!groups[normName]) groups[normName] = [];
            groups[normName].push(p);
        });

        for (const [normName, list] of Object.entries(groups)) {
            if (list.length <= 1) continue;

            // Pick primary patient: prefer the one with a date & operation, or the latest
            const primary = list.find(p => p.date && p.operation && p.operation !== 'Non renseigné') || list[list.length - 1];
            const duplicates = list.filter(p => p.id !== primary.id);

            for (const dup of duplicates) {
                console.log(`[Consolidate] Merging duplicate patient ${dup.id} (${dup.name}) into primary patient ${primary.id}`);
                
                // 1. Move pathway_responses
                await supabase.from('pathway_responses').update({ patient_id: primary.id }).eq('patient_id', dup.id);
                
                // 2. Move intake_form_responses
                await supabase.from('intake_form_responses').update({ patient_id: primary.id }).eq('patient_id', dup.id);
                
                // 3. Move patient_review_tokens
                await supabase.from('patient_review_tokens').update({ patient_id: primary.id }).eq('patient_id', dup.id);

                // 4. Move medical_history
                await supabase.from('medical_history').update({ patient_id: primary.id }).eq('patient_id', dup.id);

                // 5. Move sms_logs
                await supabase.from('sms_logs').update({ patient_id: primary.id }).eq('patient_id', dup.id);

                // 6. Move reminder_queue
                await supabase.from('reminder_queue').update({ patient_id: primary.id }).eq('patient_id', dup.id);

                // Copy onboarding_completed_at if primary doesn't have it
                if (dup.onboarding_completed_at && !primary.onboarding_completed_at) {
                    await supabase.from('patients').update({ onboarding_completed_at: dup.onboarding_completed_at }).eq('id', primary.id);
                }

                // Delete duplicate patient record
                await supabase.from('patients').delete().eq('id', dup.id);
            }

            // Recalculate progress for primary patient
            await calculateGlobalProgress(primary.id);
        }
    } catch (e) {
        console.error('Error consolidating duplicate patients:', e);
    }
}
