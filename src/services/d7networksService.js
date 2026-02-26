import { supabase } from '../lib/supabase';
import { smsTemplates, interpolateTemplate } from '../config/smsTemplates';

const D7_API_TOKEN = import.meta.env.VITE_D7_API_TOKEN;
const D7_SENDER_ID = import.meta.env.VITE_D7_SENDER_ID || 'SurgiLink';

export async function sendSMS(templateKey, to, variables, metadata = {}) {
    try {
        let message;
        if (metadata.manualMessage) {
            message = metadata.manualMessage;
        } else {
            if (!smsTemplates[templateKey]) throw new Error(`Invalid SMS template: ${templateKey}`);
            message = interpolateTemplate(templateKey, variables);
        }

        // Stricter phone formatting for D7 (D7 requires + prefix and NO spaces/dots/dashes)
        let cleanedPhone = to.replace(/[\s\.\-\(\)]/g, '');

        // Handle French numbers starting with 0 (convert 06... to +336...)
        let formattedPhone;
        if (cleanedPhone.startsWith('0') && cleanedPhone.length === 10) {
            formattedPhone = `+33${cleanedPhone.substring(1)}`;
        } else {
            formattedPhone = cleanedPhone.startsWith('+') ? cleanedPhone : `+${cleanedPhone}`;
        }

        const logEntry = {
            patient_id: metadata.patientId,
            template_key: templateKey,
            linked_item_id: metadata.linkedItemId || null,
            screen: metadata.screen || null,
            phone_number: formattedPhone,
            status: 'queued',
            metadata: { variables, ...metadata }
        };

        if (!D7_API_TOKEN) {
            console.error('[sendSMS] CRITICAL: VITE_D7_API_TOKEN is missing in environment!');
            throw new Error('D7Networks API Token not configured.');
        }

        const response = await fetch('https://api.d7networks.com/messages/v1/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${D7_API_TOKEN}`
            },
            body: JSON.stringify({
                messages: [
                    {
                        channel: 'sms',
                        recipients: [formattedPhone],
                        content: message,
                        msg_type: 'text',
                        data_coding: 'text'
                    }
                ],
                message_globals: {
                    originator: D7_SENDER_ID
                }
            })
        });

        const responseText = await response.text();
        let d7Data;
        try {
            d7Data = JSON.parse(responseText);
        } catch (e) {
            d7Data = responseText;
        }

        console.log(`[sendSMS] D7 API Response (Status ${response.status}):`, d7Data);

        if (!response.ok) {
            const errorMsg = typeof d7Data === 'string' ? d7Data : JSON.stringify(d7Data);
            throw new Error(`D7 API Error (${response.status}): ${errorMsg}`);
        }

        const messageId = d7Data.request_id || `D7_${Date.now()}`;

        console.log(`[sendSMS] Insertion du log de succès dans Supabase...`);
        const { error: dbError } = await supabase.from('sms_logs').insert({
            ...logEntry,
            message: message, // Store the actual message sent
            status: 'sent',
            sent_at: new Date().toISOString(),
            provider_message_id: messageId
        });

        if (dbError) {
            console.error(`[sendSMS] ERREUR DB lors du log de succès:`, dbError);
            throw dbError;
        }

        return { success: true, messageId, to: formattedPhone };
    } catch (error) {
        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null) {
            errorMessage = JSON.stringify(error);
        } else {
            errorMessage = String(error);
        }

        console.error('D7Networks SMS send error:', errorMessage);

        try {
            // Attempt to log failure to DB
            await supabase.from('sms_logs').insert({
                patient_id: metadata.patientId,
                template_key: templateKey,
                linked_item_id: metadata.linkedItemId || null,
                screen: metadata.screen || null,
                phone_number: to,
                status: 'failed',
                error_message: errorMessage,
                metadata
            });
        } catch (dbError) {
            console.error(`[sendSMS] CRITICAL: Impossible de logger l'échec dans Supabase:`, dbError);
        }

        return { success: false, error: errorMessage };
    }
}

export async function getSMSHistory(patientId, filters = {}) {
    let query = supabase.from('sms_logs').select('*').eq('patient_id', patientId).order('created_at', { ascending: false });
    if (filters.screen) query = query.eq('screen', filters.screen);
    if (filters.linkedItemId) query = query.eq('linked_item_id', filters.linkedItemId);
    if (filters.status) query = query.eq('status', filters.status);
    const { data, error } = await query;
    return error ? [] : data || [];
}

export async function canSendReminder(patientId, linkedItemId, minHoursBetween = 24, maxReminders = 3) {
    const history = await getSMSHistory(patientId, { linkedItemId });
    const successfulSends = history.filter(log => log.status === 'sent' || log.status === 'delivered');
    if (successfulSends.length >= maxReminders) return { canSend: false, reason: `Maximum reminders reached (${maxReminders})` };
    if (successfulSends.length > 0) {
        const lastSent = new Date(successfulSends[0].sent_at);
        const hoursSince = (Date.now() - lastSent.getTime()) / (1000 * 60 * 60);
        if (hoursSince < minHoursBetween) return { canSend: false, reason: `Too soon (wait ${Math.ceil(minHoursBetween - hoursSince)}h)` };
    }
    return { canSend: true };
}
