import { supabase } from '../lib/supabase.js';
import { smsTemplates, interpolateTemplate } from '../config/smsTemplates.js';

// Base URL for API calls. Uses VITE_APP_URL if defined, otherwise empty string (relative path)
const API_BASE_URL = (typeof process !== 'undefined' && process.env.VITE_APP_URL) || 
    (typeof import.meta.env !== 'undefined' && import.meta.env.VITE_APP_URL) || 
    '';

export async function sendSMS(templateKey, to, variables, metadata = {}, supabaseClient = null) {
    const db = supabaseClient || supabase;
    try {
        let message;
        let isManual = !!metadata.manualMessage;
        if (isManual) {
            message = metadata.manualMessage;
        } else {
            if (!smsTemplates[templateKey]) throw new Error(`Invalid SMS template: ${templateKey}`);
            message = interpolateTemplate(templateKey, variables);
        }

        // Phone formatting: Vonage requires numbers in E.164 format without the '+'
        let cleanedPhone = to.replace(/[\s\.\-\(\)\+]/g, '');

        // Handle French numbers starting with 0 (convert 06... to 336...)
        let formattedPhone;
        if (cleanedPhone.startsWith('0') && cleanedPhone.length === 10) {
            formattedPhone = `33${cleanedPhone.substring(1)}`;
        } else {
            formattedPhone = cleanedPhone;
        }

        const logEntry = {
            patient_id: metadata.patientId,
            template_key: templateKey,
            linked_item_id: metadata.linkedItemId || null,
            screen: metadata.screen || null,
            phone_number: `+${formattedPhone}`,
            status: 'queued',
            metadata: { variables, ...metadata }
        };

        console.log(`[sendSMS] Sending to ${formattedPhone}: ${message}`);

        // Call our Vercel Serverless Function proxy to bypass CORS
        const response = await fetch(`${API_BASE_URL}/api/send-sms`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: formattedPhone,
                text: message
            })
        });

        const d7Data = await response.json();
        
        console.log(`[sendSMS] Vonage API Response (Status ${response.status}):`, d7Data);

        // Vonage specific error handling
        // Even if HTTP is 200, Vonage returns message status inside the messages array
        let isSuccess = false;
        let errorMessage = 'Unknown error';
        let messageId = `VONAGE_${Date.now()}`;

        if (d7Data.messages && d7Data.messages.length > 0) {
            const msgResponse = d7Data.messages[0];
            if (msgResponse.status === '0') {
                isSuccess = true;
                messageId = msgResponse['message-id'];
            } else {
                errorMessage = msgResponse['error-text'];
            }
        }

        if (!isSuccess) {
            throw new Error(`Vonage API Error: ${errorMessage}`);
        }

        console.log(`[sendSMS] Insertion du log de succès dans Supabase...`);
        const { error: dbError } = await db.from('sms_logs').insert({
            ...logEntry,
            message: message, // Store the actual message sent
            status: 'sent',
            sent_at: new Date().toISOString(),
            provider_message_id: messageId,
            metadata: { ...logEntry.metadata, vonage_response: d7Data }
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

        console.error('Vonage SMS send error:', errorMessage);

        try {
            // Attempt to log failure to DB
            const db = supabaseClient || supabase;
            await db.from('sms_logs').insert({
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

export async function getSMSHistory(patientId, filters = {}, supabaseClient = null) {
    const db = supabaseClient || supabase;
    let query = db.from('sms_logs').select('*').eq('patient_id', patientId).order('created_at', { ascending: false });
    if (filters.screen) query = query.eq('screen', filters.screen);
    if (filters.linkedItemId) query = query.eq('linked_item_id', filters.linkedItemId);
    if (filters.status) query = query.eq('status', filters.status);
    const { data, error } = await query;
    return error ? [] : data || [];
}

export async function canSendReminder(patientId, linkedItemId, minHoursBetween = 24, maxReminders = 3, supabaseClient = null) {
    const history = await getSMSHistory(patientId, { linkedItemId }, supabaseClient);
    const successfulSends = history.filter(log => log.status === 'sent' || log.status === 'delivered');
    if (successfulSends.length >= maxReminders) return { canSend: false, reason: `Maximum reminders reached (${maxReminders})` };
    if (successfulSends.length > 0) {
        const lastSent = new Date(successfulSends[0].sent_at);
        const hoursSince = (Date.now() - lastSent.getTime()) / (1000 * 60 * 60);
        if (hoursSince < minHoursBetween) return { canSend: false, reason: `Too soon (wait ${Math.ceil(minHoursBetween - hoursSince)}h)` };
    }
    return { canSend: true };
}
