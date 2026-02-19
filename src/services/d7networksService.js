import { supabase } from '../lib/supabase';
import { smsTemplates, interpolateTemplate } from '../config/smsTemplates';

const D7_API_TOKEN = import.meta.env.VITE_D7_API_TOKEN;
const D7_SENDER_ID = import.meta.env.VITE_D7_SENDER_ID || 'SurgiLink';

export async function sendSMS(templateKey, to, variables, metadata = {}) {
    try {
        if (!smsTemplates[templateKey]) throw new Error(`Invalid SMS template: ${templateKey}`);
        const message = interpolateTemplate(templateKey, variables);
        const formattedPhone = to.startsWith('+') ? to : `+${to}`;

        const logEntry = {
            patient_id: metadata.patientId,
            template_key: templateKey,
            linked_item_id: metadata.linkedItemId || null,
            screen: metadata.screen || null,
            phone_number: formattedPhone,
            status: 'queued',
            metadata: { variables, ...metadata }
        };

        if (!D7_API_TOKEN) throw new Error('D7Networks API Token not configured.');

        const response = await fetch('https://api.d7networks.com/messages/v1/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${D7_API_TOKEN}`
            },
            body: JSON.stringify({
                messages: [{ destinations: [formattedPhone], content: message, source: D7_SENDER_ID }]
            })
        });

        const d7Data = await response.json();
        if (!response.ok) throw new Error(d7Data.message || d7Data.detail || 'D7Networks API error');

        const messageId = d7Data.request_id || `D7_${Date.now()}`;

        await supabase.from('sms_logs').insert({
            ...logEntry,
            status: 'sent',
            sent_at: new Date().toISOString(),
            provider_message_id: messageId
        });

        return { success: true, messageId };
    } catch (error) {
        console.error('D7Networks SMS send error:', error);
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
        } catch (dbError) { }
        return { success: false, error: error.message };
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
