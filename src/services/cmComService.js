import { supabase } from '../lib/supabase';
import { smsTemplates, interpolateTemplate } from '../config/smsTemplates';

/**
 * CM.com SMS Service
 * Handles SMS sending via CM.com API with retry logic and logging
 */

const CMCOM_API_URL = 'https://gw.cmtelecom.com/v1.0/message';
const PRODUCT_TOKEN = import.meta.env.VITE_CMCOM_PRODUCT_TOKEN;
const SANDBOX_MODE = import.meta.env.VITE_CMCOM_SANDBOX_MODE === 'true';
const DEFAULT_SENDER = import.meta.env.VITE_SMS_DEFAULT_SENDER || 'SurgiLink';

/**
 * Send an SMS via CM.com
 * @param {string} templateKey - Template key from smsTemplates
 * @param {string} to - Recipient phone number (E.164 format recommended)
 * @param {Object} variables - Variables for template interpolation
 * @param {Object} metadata - Additional metadata to log
 * @returns {Promise<Object>} - { success, messageId, error }
 */
export async function sendSMS(templateKey, to, variables, metadata = {}) {
    try {
        // Validate template
        if (!smsTemplates[templateKey]) {
            throw new Error(`Invalid SMS template: ${templateKey}`);
        }

        // Interpolate message
        const message = interpolateTemplate(templateKey, variables);

        // Log SMS attempt
        const logEntry = {
            patient_id: metadata.patientId,
            template_key: templateKey,
            linked_item_id: metadata.linkedItemId || null,
            screen: metadata.screen || null,
            phone_number: to,
            status: 'queued',
            metadata: {
                variables,
                ...metadata
            }
        };

        if (SANDBOX_MODE) {
            // Sandbox mode: mock send
            console.log('📱 [SANDBOX] SMS would be sent:', {
                to,
                message,
                template: templateKey,
                metadata
            });

            // Log to database
            const { data: log, error: logError } = await supabase
                .from('sms_logs')
                .insert({
                    ...logEntry,
                    status: 'sent',
                    sent_at: new Date().toISOString(),
                    provider_message_id: `SANDBOX_${Date.now()}`
                })
                .select()
                .single();

            if (logError) {
                console.error('Failed to log SMS in sandbox mode:', logError);
            }

            return {
                success: true,
                messageId: `SANDBOX_${Date.now()}`,
                sandboxMode: true
            };
        }

        // Real mode: send via CM.com
        if (!PRODUCT_TOKEN) {
            throw new Error('CM.com Product Token not configured');
        }

        const payload = {
            messages: {
                authentication: {
                    producttoken: PRODUCT_TOKEN
                },
                msg: [
                    {
                        from: DEFAULT_SENDER,
                        to: [
                            {
                                number: to
                            }
                        ],
                        body: {
                            content: message
                        }
                    }
                ]
            }
        };

        const response = await fetch(CMCOM_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(`CM.com API error: ${result.details || result.errorMessage || 'Unknown error'}`);
        }

        // Extract message ID
        const messageId = result.messages?.[0]?.messageDetails || result.id || `CMCOM_${Date.now()}`;

        // Log success
        await supabase.from('sms_logs').insert({
            ...logEntry,
            status: 'sent',
            sent_at: new Date().toISOString(),
            provider_message_id: messageId
        });

        return {
            success: true,
            messageId
        };
    } catch (error) {
        console.error('SMS send error:', error);

        // Log failure
        try {
            await supabase.from('sms_logs').insert({
                patient_id: metadata.patientId,
                template_key: templateKey,
                linked_item_id: metadata.linkedItemId || null,
                screen: metadata.screen || null,
                phone_number: to,
                status: 'failed',
                error_message: error.message,
                metadata
            });
        } catch (dbError) {
            console.error('Failed to log SMS error:', dbError);
        }

        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get SMS send history for a patient
 * @param {number} patientId - Patient ID
 * @param {Object} filters - Optional filters { screen, linkedItemId, status }
 * @returns {Promise<Array>} - SMS logs
 */
export async function getSMSHistory(patientId, filters = {}) {
    let query = supabase
        .from('sms_logs')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

    if (filters.screen) {
        query = query.eq('screen', filters.screen);
    }

    if (filters.linkedItemId) {
        query = query.eq('linked_item_id', filters.linkedItemId);
    }

    if (filters.status) {
        query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching SMS history:', error);
        return [];
    }

    return data || [];
}

/**
 * Check if SMS can be sent (anti-spam protection)
 * @param {number} patientId - Patient ID
 * @param {string} linkedItemId - Item ID
 * @param {number} minHoursBetween - Minimum hours between reminders (default 24)
 * @param {number} maxReminders - Maximum reminders allowed (default 3)
 * @returns {Promise<Object>} - { canSend, reason, lastSent, count }
 */
export async function canSendReminder(patientId, linkedItemId, minHoursBetween = 24, maxReminders = 3) {
    const history = await getSMSHistory(patientId, { linkedItemId });

    const successfulSends = history.filter(log => log.status === 'sent' || log.status === 'delivered');

    // Check max count
    if (successfulSends.length >= maxReminders) {
        return {
            canSend: false,
            reason: `Maximum reminders reached (${maxReminders})`,
            count: successfulSends.length
        };
    }

    // Check time since last send
    if (successfulSends.length > 0) {
        const lastSent = new Date(successfulSends[0].sent_at);
        const hoursSince = (Date.now() - lastSent.getTime()) / (1000 * 60 * 60);

        if (hoursSince < minHoursBetween) {
            return {
                canSend: false,
                reason: `Too soon (wait ${Math.ceil(minHoursBetween - hoursSince)}h)`,
                lastSent,
                count: successfulSends.length
            };
        }
    }

    return {
        canSend: true,
        count: successfulSends.length,
        lastSent: successfulSends[0]?.sent_at || null
    };
}
