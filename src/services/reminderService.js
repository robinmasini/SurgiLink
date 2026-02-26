import { supabase } from '../lib/supabase';
import { sendSMS, canSendReminder } from './d7networksService';
import { getIncompleteItemsWithReminders } from './pathwayService';

/**
 * Reminder Service
 * Manages automated and manual reminders for pathway items
 */

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
        console.error('Error queueing reminder:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Process pending reminders (to be called by scheduler/cron)
 * @returns {Promise<Object>} - { processed, sent, failed }
 */
export async function processPendingReminders() {
    try {
        // Get pending reminders that are due
        const { data: reminders, error } = await supabase
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
                reminderPolicy.maxReminders
            );

            if (!canSend.canSend) {
                // Mark as cancelled
                await supabase
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
            const variables = {
                first_name: patient.name?.split(' ')[0] || 'Patient',
                procedure_date: patient.date || 'bientôt',
                clinic_name: 'SurgiLink',
                clinic_phone: '01 XX XX XX XX',
                checklist_link: `https://surgilink.eu/patient/pathway/${reminder.screen.toLowerCase()}/${patient.id}`,
                consignes_link: `https://surgilink.eu/patient/pathway/${reminder.screen.toLowerCase()}/${patient.id}`
            };

            const result = await sendSMS(
                reminder.template_key,
                patient.phone || '',
                variables,
                {
                    patientId: reminder.patient_id,
                    screen: reminder.screen,
                    linkedItemId: reminder.item_id
                }
            );

            // Update reminder queue
            await supabase
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

        // Prepare variables
        const variables = {
            first_name: patient.name?.split(' ')[0] || 'Patient',
            procedure_date: patient.date || 'bientôt',
            arrival_time: patient.arrival_time || '07:30',
            clinic_name: 'SurgiLink',
            clinic_phone: '01 44 44 44 44',
            checklist_link: `https://surgilink.eu/patient-portal/${patient.token || ''}`,
            consignes_link: `https://surgilink.eu/patient-portal/${patient.token || ''}`,
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
export async function scheduleTimeBasedReminders(patientId, interventionDate) {
    const reminders = [];

    // Calculate reminder dates
    const j7Date = new Date(interventionDate);
    j7Date.setDate(j7Date.getDate() - 7);

    const j2Date = new Date(interventionDate);
    j2Date.setDate(j2Date.getDate() - 2);

    const j1Date = new Date(interventionDate);
    j1Date.setDate(j1Date.getDate() - 1);

    const j1PostOpDate = new Date(interventionDate);
    j1PostOpDate.setDate(j1PostOpDate.getDate() + 1);

    // Queue reminders
    const remindersToQueue = [
        { screen: 'J7', date: j7Date, template: 'j7_reminder' },
        { screen: 'J2', date: j2Date, template: 'j2_reminder' },
        { screen: 'J7', date: j1Date, template: 'j1_reminder_long' }, // J-1 reminder
        { screen: 'J1', date: j1PostOpDate, template: 'j1_postop' }
    ];

    for (const reminder of remindersToQueue) {
        const result = await queueReminder(
            patientId,
            reminder.screen,
            null, // No specific item for time-based reminders
            reminder.date,
            'auto_time',
            reminder.template
        );

        if (result.success) {
            reminders.push(result.data);
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
