import { supabase } from '../lib/supabase.js';
import { sendSMS, canSendReminder } from './vonageService.js';
import { getIncompleteItemsWithReminders } from './pathwayService.js';

/**
 * Reminder Service
 * Manages automated and manual reminders for pathway items
 */

/**
 * Helper to set a date to a specific hour/minute in Paris time
 * Accounts for CEST (UTC+2) or CET (UTC+1)
 */
function setParisTime(date, hours, minutes = 0) {
    const d = new Date(date);

    // Helper to determine if a date is in CEST (Summer Time)
    // Last Sunday of March to Last Sunday of October
    const isCEST = (d) => {
        const year = d.getFullYear();
        // Last Sunday of March
        const march31 = new Date(year, 2, 31);
        const startCEST = new Date(year, 2, 31 - march31.getDay());
        startCEST.setHours(2, 0, 0, 0);

        // Last Sunday of October
        const oct31 = new Date(year, 9, 31);
        const endCEST = new Date(year, 9, 31 - oct31.getDay());
        endCEST.setHours(3, 0, 0, 0);

        return d >= startCEST && d < endCEST;
    };

    const offset = isCEST(d) ? 2 : 1;
    // Set UTC hours adjusted by offset
    d.setUTCHours(hours - offset, minutes, 0, 0);
    return d;
}

/**
 * Queue a reminder
 * @param {number} patientId - Patient ID
 * @param {string} screen - J7, J2, or J1
 * @param {string} itemId - Item ID (optional for screen-level reminders)
 * @param {Date} scheduledFor - When to send
 * @param {string} reminderType - auto_time, auto_state, or manual
 * @param {string} templateKey - SMS template key
 * @returns {Promise<Object>} - { success, data, error }
 */
export async function queueReminder(patientId, screen, itemId, scheduledFor, reminderType, templateKey) {
    try {
        const { data, error } = await supabase
            .from('reminder_queue')
            .insert({
                patient_id: patientId,
                screen,
                item_id: itemId,
                scheduled_for: scheduledFor.toISOString(),
                reminder_type: reminderType,
                template_key: templateKey,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error(`[PDF] Error queueing reminder for Patient ${patientId} (Screen: ${screen}, Template: ${templateKey}):`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Process pending reminders (to be called by scheduler/cron)
 * @param {Object} supabaseClient - Optional privileged Supabase client
 * @returns {Promise<Object>} - { processed, sent, failed }
 */
export async function processPendingReminders(supabaseClient = null) {
    const db = supabaseClient || supabase;
    try {
        // Get pending reminders that are due
        const { data: reminders, error } = await db
            .from('reminder_queue')
            .select('*, patients(*)')
            .eq('status', 'pending')
            .lte('scheduled_for', new Date().toISOString())
            .limit(50); // Process in batches

        if (error) throw error;

        let sent = 0;
        let failed = 0;

        for (const reminder of reminders || []) {
            // Check anti-spam
            const reminderPolicy = { minHoursBetween: 24, maxReminders: 3 }; // Default, could be from config
            const canSend = await canSendReminder(
                reminder.patient_id,
                reminder.item_id || reminder.screen,
                reminderPolicy.minHoursBetween,
                reminderPolicy.maxReminders,
                db
            );

            if (!canSend.canSend) {
                // Mark as cancelled
                await db
                    .from('reminder_queue')
                    .update({
                        status: 'cancelled',
                        processed_at: new Date().toISOString()
                    })
                    .eq('id', reminder.id);

                console.log(`Reminder ${reminder.id} cancelled: ${canSend.reason}`);
                continue;
            }

            // Send SMS
            const patient = reminder.patients;
            const getScreenPath = (screen) => {
                const mapping = {
                    'J-7': 'j7',
                    'J-2': 'j2',
                    'J-1': 'j1-preop',
                    'J+1': 'j1',
                    'J+4': 'j4',
                    'E-SATIS': 'e-satis',
                    'Bienvenue': ''
                };
                return mapping[screen] || '';
            };

            // Fetch token
            const { data: tokenData } = await db
                .from('patient_review_tokens')
                .select('token')
                .eq('patient_id', patient.id)
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            const token = tokenData?.token;
            const screenPath = getScreenPath(reminder.screen);
            const baseUrl = `https://surgilink.eu/patient-portal/${token || ''}`;
            const directLink = screenPath ? `${baseUrl}/${screenPath}` : baseUrl;

            const variables = {
                first_name: patient.name?.split(' ')[0] || 'Patient',
                procedure_date: patient.date || 'bientôt',
                arrival_time: patient.surgery_time || '07:30',

                clinic_name: 'SurgiLink',
                clinic_phone: '01 XX XX XX XX',
                checklist_link: directLink,
                consignes_link: directLink,
                esatis_link: directLink
            };

            const result = await sendSMS(
                reminder.template_key,
                patient.phone || '',
                variables,
                {
                    patientId: reminder.patient_id,
                    screen: reminder.screen,
                    linkedItemId: reminder.item_id,
                    manualMessage: reminder.custom_message // Use custom message if set
                },
                db
            );

            // Update reminder queue
            await db
                .from('reminder_queue')
                .update({
                    status: result.success ? 'sent' : 'failed',
                    processed_at: new Date().toISOString()
                })
                .eq('id', reminder.id);

            if (result.success) {
                sent++;
            } else {
                failed++;
            }
        }

        return {
            processed: (reminders || []).length,
            sent,
            failed
        };
    } catch (error) {
        console.error('Error processing reminders:', error);
        return { processed: 0, sent: 0, failed: 0, error: error.message };
    }
}

/**
 * Send a manual reminder for a specific item
 * @param {number} patientId - Patient ID
 * @param {string} screen - J7, J2, or J1
 * @param {string} itemId - Item ID
 * @param {string} templateKey - SMS template key
 * @param {Object} patient - Patient object with phone, name, etc.
 * @returns {Promise<Object>} - { success, canSend, reason, error }
 */
export async function sendManualReminder(patientId, screen, itemId, templateKey, patient) {
    try {
        console.log(`[sendManualReminder] Vérification anti-spam pour Patient:${patientId}, Item:${itemId || screen}`);
        // Check anti-spam - use screen if itemId is null
        const canSend = await canSendReminder(patientId, itemId || screen, 24, 3);

        if (!canSend.canSend) {
            console.warn(`[sendManualReminder] Anti-spam bloqué: ${canSend.reason}`);
            return {
                success: false,
                canSend: false,
                reason: canSend.reason
            };
        }

        const getScreenPath = (screen) => {
            const mapping = {
                'J-7': 'j7',
                'J-2': 'j2',
                'J-1': 'j1-preop',
                'J+1': 'j1',
                'J+4': 'j4',
                'E-SATIS': 'e-satis',
                'Bienvenue': ''
            };
            return mapping[screen] || '';
        };

        const { data: tokenData } = await supabase
            .from('patient_review_tokens')
            .select('token')
            .eq('patient_id', patientId)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        const token = tokenData?.token;
        const screenPath = getScreenPath(screen);
        const baseUrl = `https://surgilink.eu/patient-portal/${token || ''}`;
        const directLink = screenPath ? `${baseUrl}/${screenPath}` : baseUrl;


        // Prepare variables
        const variables = {
            first_name: patient.name?.split(' ')[0] || 'Patient',
            procedure_date: patient.date || 'bientôt',
            arrival_time: patient.arrival_time || '07:30',
            clinic_name: 'SurgiLink',
            clinic_phone: '01 44 44 44 44',
            checklist_link: directLink,
            consignes_link: directLink,
            esatis_link: directLink,
            item_name: itemId ? itemId.replace(/_/g, ' ') : ''
        };

        // Send SMS
        console.log(`[sendManualReminder] Appel de sendSMS pour ${patient.phone}...`);
        const result = await sendSMS(
            templateKey,
            patient.phone || '',
            variables,
            {
                patientId,
                screen,
                linkedItemId: itemId
            }
        );
        console.log(`[sendManualReminder] Résultat sendSMS:`, result);

        return {
            success: result.success,
            canSend: true,
            messageId: result.messageId,
            error: result.error
        };
    } catch (error) {
        console.error('Error sending manual reminder:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get reminder history for a patient
 * @param {number} patientId - Patient ID
 * @param {string} screen - Optional screen filter
 * @returns {Promise<Array>} - Reminder queue items
 */
export async function getReminderHistory(patientId, screen = null) {
    try {
        let query = supabase
            .from('reminder_queue')
            .select('*')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false });

        if (screen) {
            query = query.eq('screen', screen);
        }

        const { data, error } = await query;

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('Error fetching reminder history:', error);
        return [];
    }
}

/**
 * Schedule automatic time-based reminders for a patient
 * (To be called when patient is created or intervention is scheduled)
 * @param {number} patientId - Patient ID
 * @param {Date} interventionDate - Date of intervention
 * @returns {Promise<Object>} - { success, scheduled }
 */
export async function scheduleTimeBasedReminders(patientId, interventionDate, timePreferences = {}) {
    const reminders = [];

    // Fetch patient info for late-registration logic
    const { data: patient } = await supabase.from('patients').select('created_at').eq('id', patientId).single();
    const patientCreatedRecently = patient ? (new Date() - new Date(patient.created_at)) < 86400000 : false; // 24h


    // --- DYNAMIC OFFSET LOGIC ---
    let offsets = {
        welcome: -10,
        j7: -7,
        j2: -2,
        j1: -1,
        j0: 0,
        j1_postop: 1,
        j4_satisfaction: 4,
        esatis: 4
    };

    try {
        const { data: settingsData } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'reminder_offsets')
            .maybeSingle();

        if (settingsData?.value) {
            offsets = { ...offsets, ...(typeof settingsData.value === 'string' ? JSON.parse(settingsData.value) : settingsData.value) };
        }
    } catch (e) {
        console.warn('Using default reminder offsets due to fetch error:', e);
    }

    // Calculate reminder dates using dynamic offsets and optional time preferences
    const getTP = (key, defH, defM) => {
        if (timePreferences[key]) {
            const [h, m] = timePreferences[key].split(':').map(Number);
            return { h, m };
        }
        if (timePreferences.default) {
            const [h, m] = timePreferences.default.split(':').map(Number);
            return { h, m };
        }
        return { h: defH, m: defM };
    };

    const tpJ7 = getTP('j7', 8, 30);
    const tpJ2 = getTP('j2', 8, 30);
    const tpJ1 = getTP('j1', 8, 30); // J-1 aligned to 8:30
    const tpJ1Post = getTP('j1_postop', 8, 30);
    const tpJ4Sat = getTP('j4_satisfaction', 8, 30); // J+4 aligned to 8:30
    const tpJ4Esat = getTP('j4_esatis', 8, 30); // E-SATIS aligned to 8:30
    const tpWelcome = getTP('welcome', 8, 30);
    const tpJJ = getTP('j0', 8, 30); // Day of surgery aligned to 8:30

    const j7Date = setParisTime(new Date(interventionDate).getTime() + (offsets.j7 * 86400000), tpJ7.h, tpJ7.m);
    const j2Date = setParisTime(new Date(interventionDate).getTime() + (offsets.j2 * 86400000), tpJ2.h, tpJ2.m);
    const j1Date = setParisTime(new Date(interventionDate).getTime() + (offsets.j1 * 86400000), tpJ1.h, tpJ1.m);
    const j1PostOpDate = setParisTime(new Date(interventionDate).getTime() + (offsets.j1_postop * 86400000), tpJ1Post.h, tpJ1Post.m);
    const j4SatisfactionDate = setParisTime(new Date(interventionDate).getTime() + (offsets.j4_satisfaction * 86400000), tpJ4Sat.h, tpJ4Sat.m);
    const j4EsatisDate = setParisTime(new Date(interventionDate).getTime() + (offsets.esatis * 86400000), tpJ4Esat.h, tpJ4Esat.m);
    const jjDate = setParisTime(new Date(interventionDate).getTime() + (offsets.j0 * 86400000), tpJJ.h, tpJJ.m);
    const welcomeDate = setParisTime(new Date(interventionDate).getTime() + (offsets.welcome * 86400000), tpWelcome.h, tpWelcome.m);

    // Queue reminders
    const remindersToQueue = [
        { screen: 'Bienvenue', date: welcomeDate, template: 'welcome_accueil' },
        { screen: 'J-7', date: j7Date, template: 'j7_reminder' },
        { screen: 'J-2', date: j2Date, template: 'j2_reminder' },
        { screen: 'J-1', date: j1Date, template: 'j1_reminder_long' },
        { screen: 'J-J', date: jjDate, template: 'jj_reminder' },
        { screen: 'J+1', date: j1PostOpDate, template: 'j1_postop' },
        { screen: 'J+4', date: j4SatisfactionDate, template: 'j4_satisfaction' },
        { screen: 'E-SATIS', date: j4EsatisDate, template: 'j4_esatis' }
    ];
    // --- END DYNAMIC OFFSET LOGIC ---

    for (const reminder of remindersToQueue) {
        // Skip reminders that are more than 1 hour in the past to avoid "backlog bursts"
        const isPast = reminder.date < new Date(Date.now() - 3600000);

        const result = await queueReminder(
            patientId,
            reminder.screen,
            null,
            reminder.date,
            'auto_time',
            reminder.template
        );

        if (result.success) {
            if (isPast) {
                // For "late-created" patients (created in last 24h), keep Welcome and J-7 even if in the past
                const isLateWelcomeOrJ7 = (reminder.screen === 'Bienvenue' || reminder.screen === 'J-7') && patientCreatedRecently;

                if (isLateWelcomeOrJ7) {
                    console.log(`[ReminderService] Keeping past reminder ${reminder.screen} for late-created Patient ${patientId}`);
                    reminders.push(result.data);
                } else {
                    // Mark as cancelled immediately so it doesn't get sent by the cron
                    await cancelReminder(result.data.id);
                    console.log(`[ReminderService] Auto-cancelled past reminder: ${reminder.screen} for Patient ${patientId}`);
                }
            } else {
                reminders.push(result.data);
            }
        }
    }

    return {
        success: true,
        scheduled: reminders.length
    };
}

/**
 * Check and schedule state-based reminders for incomplete items
 * (To be called periodically or after patient updates their responses)
 * @param {number} patientId - Patient ID
 * @param {string} screen - J7, J2, or J1
 * @returns {Promise<Object>} - { success, scheduled }
 */
export async function scheduleStateBasedReminders(patientId, screen) {
    const incompleteItems = await getIncompleteItemsWithReminders(patientId, screen);
    const scheduled = [];

    for (const item of incompleteItems) {
        const policy = item.reminderPolicy;

        // Check if reminder already exists for this item
        const existing = await supabase
            .from('reminder_queue')
            .select('*')
            .eq('patient_id', patientId)
            .eq('item_id', item.id)
            .eq('status', 'pending')
            .single();

        if (existing.data) {
            // Already scheduled
            continue;
        }

        // Schedule reminder for X hours from now
        const scheduledFor = new Date();
        scheduledFor.setHours(scheduledFor.getHours() + (policy.auto_reminder_delay_hours || 48));

        const result = await queueReminder(
            patientId,
            screen,
            item.id,
            scheduledFor,
            'auto_state',
            policy.sms_template_key || 'generic_item_reminder'
        );

        if (result.success) {
            scheduled.push(result.data);
        }
    }

    return {
        success: true,
        scheduled: scheduled.length
    };
}

/**
 * Get the next pending reminder for a patient
 * @param {number} patientId - Patient ID
 * @returns {Promise<Object|null>} - Next pending reminder
 */
export async function getNextPendingReminder(patientId) {
    try {
        const { data, error } = await supabase
            .from('reminder_queue')
            .select('*')
            .eq('patient_id', patientId)
            .eq('status', 'pending')
            .order('scheduled_for', { ascending: true })
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching next reminder:', error);
        return null;
    }
}

/**
 * Cancel a specific reminder
 * @param {string} reminderId - Reminder ID
 * @returns {Promise<boolean>} - Success
 */
export async function cancelReminder(reminderId) {
    try {
        const { error } = await supabase
            .from('reminder_queue')
            .update({
                status: 'cancelled',
                processed_at: new Date().toISOString()
            })
            .eq('id', reminderId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error cancelling reminder:', error);
        return false;
    }
}
/**
 * Send a custom SMS override for a scheduled reminder
 * @param {number} patientId - Patient ID
 * @param {string} reminderId - ID of the reminder to override
 * @param {string} customMessage - The custom message text
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} - { success, error }
 */
export async function sendOverrideSMS(patientId, reminderId, customMessage, metadata = {}) {
    try {
        // 1. Get reminder details to know the template/screen
        const { data: reminder, error: rError } = await supabase
            .from('reminder_queue')
            .select('*, patients(phone)')
            .eq('id', reminderId)
            .single();

        if (rError) throw rError;

        // 2. Send the custom SMS via D7
        const result = await sendSMS(
            reminder.template_key,
            reminder.patients.phone,
            {}, // Variables not needed since we use manualMessage
            {
                ...metadata,
                patientId,
                screen: reminder.screen,
                linkedItemId: reminder.item_id,
                manualMessage: customMessage
            }
        );

        if (!result.success) throw new Error(result.error);

        // 3. Mark the scheduled reminder as 'sent' (so it's not picked up by scheduler)
        await supabase
            .from('reminder_queue')
            .update({
                status: 'sent',
                processed_at: new Date().toISOString()
            })
            .eq('id', reminderId);

        return { success: true };
    } catch (error) {
        console.error('Error sending override SMS:', error);
        return { success: false, error: error.message };
    }
}
/**
 * Get all pending reminders for a patient
 * @param {number} patientId - Patient ID
 * @returns {Promise<Array>} - List of pending reminders
 */
export async function getPendingReminders(patientId) {
    try {
        const { data, error } = await supabase
            .from('reminder_queue')
            .select('*')
            .eq('patient_id', patientId)
            .eq('status', 'pending')
            .order('scheduled_for', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching pending reminders:', error);
        return [];
    }
}

/**
 * Update a scheduled reminder with custom message and/or time
 * @param {string} reminderId - Reminder ID
 * @param {Object} updates - { customMessage, scheduledFor }
 * @returns {Promise<Object>} - { success, error }
 */
export async function updateReminder(reminderId, updates) {
    try {
        const payload = {};
        if (updates.customMessage !== undefined) payload.custom_message = updates.customMessage;
        if (updates.scheduledFor !== undefined) payload.scheduled_for = updates.scheduledFor;

        const { error } = await supabase
            .from('reminder_queue')
            .update(payload)
            .eq('id', reminderId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error updating reminder:', error);
        return { success: false, error: error.message };
    }
}
/**
 * Send a punctual (one-off) custom SMS and log it in history
 * @param {number} patientId - Patient ID
 * @param {string} message - Custom message text
 * @param {Object} patient - Patient object (phone, name...)
 * @returns {Promise<Object>} - { success, error }
 */
export async function sendPunctualSMS(patientId, message, patient) {
    try {
        // 1. Send via D7 (metadata screen='CUSTOM' to distinguish)
        const result = await sendSMS(
            'custom_punctual',
            patient.phone,
            {},
            {
                patientId,
                screen: 'MESSAGE',
                manualMessage: message
            }
        );

        if (!result.success) throw new Error(result.error || 'Failed to send SMS');

        // 2. Log in medical_history
        const { error: historyError } = await supabase
            .from('medical_history')
            .insert({
                patient_id: patientId,
                date: new Date().toISOString().split('T')[0],
                title: 'SMS Ponctuel Envoyé',
                description: message,
                category: 'sms'
            });

        if (historyError) {
            console.error('Error logging to history:', historyError);
            // We don't fail the whole operation if history logging fails, but it's not ideal
        }

        return { success: true };
    } catch (error) {
        console.error('Error in sendPunctualSMS:', error);
        return { success: false, error: error.message };
    }
}
