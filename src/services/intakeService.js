import { supabase } from '../lib/supabase.js';
import { generatePatientToken } from './tokenService.js';
import { sendSMS } from './vonageService.js';

/**
 * Intake Form Service
 * Manages the pre-intake (new patient registration) workflow:
 * 1. Create a lightweight patient record from just a phone number
 * 2. Send the intake form link via SMS
 * 3. Save the completed form responses
 */

/**
 * Create a new intake patient and send the intake form SMS.
 * @param {string} phone - Patient phone number (E.164 or local French)
 * @param {string} [firstName] - Optional first name (to personalise SMS)
 * @param {string} [lastName] - Optional last name
 * @param {string} [userId] - The logged-in practitioner's user_id (for RLS)
 * @returns {Promise<{success: boolean, patientId?: number, token?: string, error?: string}>}
 */
export async function createIntakePatient(phone, firstName = null, lastName = null, userId = null) {
    try {
        // Determine the display name
        const nameForRecord = firstName || lastName
            ? `${firstName || ''} ${lastName || ''}`.trim()
            : 'Nouveau patient';

        // 1. Insert minimal patient record with status = 'intake'
        const { data: patientData, error: insertError } = await supabase
            .from('patients')
            .insert([{
                name: nameForRecord,
                phone: phone,
                status: 'intake',
                progress: 0,
                days_until: 'J-0',
                // If userId is known, link to practitioner for RLS
                ...(userId ? { user_id: userId } : {})
            }])
            .select()
            .single();

        if (insertError) throw insertError;

        const patientId = patientData.id;

        // 2. Generate a portal access token
        const tokenRes = await generatePatientToken(patientId);
        if (!tokenRes.success) throw new Error(`Token generation failed: ${tokenRes.error}`);

        const token = tokenRes.token;
        const intakeLink = `${window.location.origin}/fiche/${token}`;

        // 3. Send intake form SMS
        await sendSMS(
            'intake_form',
            phone,
            { intake_link: intakeLink, first_name: firstName || 'cher(e) patient(e)' },
            { patientId, screen: 'Intake', linkedItemId: null }
        );

        return { success: true, patientId, token };
    } catch (err) {
        console.error('[intakeService] createIntakePatient error:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Retrieve the patient and their existing intake response (if any) using a portal token.
 * @param {string} token - The portal access token
 * @returns {Promise<{success: boolean, patient?: object, intakeResponse?: object, error?: string}>}
 */
export async function getIntakeByToken(token) {
    try {
        // 1. Resolve token → patient_id
        const { data: tokenData, error: tokenError } = await supabase
            .from('patient_review_tokens')
            .select('patient_id, is_active, expires_at')
            .eq('token', token.trim().toLowerCase())
            .single();

        if (tokenError || !tokenData) {
            return { success: false, error: 'Lien invalide ou introuvable.' };
        }
        if (!tokenData.is_active) {
            return { success: false, error: 'Ce lien a été révoqué.' };
        }
        if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
            return { success: false, error: 'Ce lien a expiré.' };
        }

        const patientId = tokenData.patient_id;

        // 2. Fetch patient
        const { data: patient, error: patientError } = await supabase
            .from('patients')
            .select('*')
            .eq('id', patientId)
            .single();

        if (patientError || !patient) {
            return { success: false, error: 'Patient introuvable.' };
        }

        // 3. Fetch existing intake response (if any)
        const { data: intakeResponse } = await supabase
            .from('intake_form_responses')
            .select('*')
            .eq('patient_id', patientId)
            .maybeSingle();

        return { success: true, patient, intakeResponse: intakeResponse || null };
    } catch (err) {
        console.error('[intakeService] getIntakeByToken error:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Save (upsert) intake form responses.
 * Also updates the patient record with basic info and sets status to 'pending'.
 * @param {string} token - Portal access token
 * @param {object} formData - All form field values
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function submitIntakeForm(token, formData) {
    try {
        // 1. Get patient_id from token
        const { data: tokenData, error: tokenError } = await supabase
            .from('patient_review_tokens')
            .select('patient_id')
            .eq('token', token.trim().toLowerCase())
            .single();

        if (tokenError || !tokenData) {
            return { success: false, error: 'Token invalide.' };
        }

        const patientId = tokenData.patient_id;

        // 2. Build full name and update the patients table with key fields
        const fullName = [formData.first_name, formData.last_name].filter(Boolean).join(' ') || null;
        const patientUpdate = {
            ...(fullName ? { name: fullName } : {}),
            ...(formData.email ? { email: formData.email } : {}),
            ...(formData.phone ? { phone: formData.phone } : {}),
            ...(formData.birth_date ? { birth_date: formData.birth_date } : {}),
            ...(formData.address ? { address: `${formData.address}, ${formData.postal_code || ''} ${formData.city || ''}`.trim() } : {}),
            ...(formData.height_cm ? { height: `${formData.height_cm} cm` } : {}),
            ...(formData.weight_kg ? { weight: `${formData.weight_kg} kg` } : {}),
            ...(formData.general_practitioner ? { referring_doctor: formData.general_practitioner } : {}),
            status: 'pending', // Graduate from 'intake' to normal patient
        };

        await supabase.from('patients').update(patientUpdate).eq('id', patientId);

        // 3. Upsert intake_form_responses
        const intakePayload = {
            patient_id: patientId,
            submitted_at: new Date().toISOString(),
            form_completed: true,

            // Section 1 — Identité
            last_name: formData.last_name || null,
            first_name: formData.first_name || null,
            maiden_name: formData.maiden_name || null,
            birth_date: formData.birth_date || null,
            address: formData.address || null,
            postal_code: formData.postal_code || null,
            city: formData.city || null,
            phone: formData.phone || null,
            email: formData.email || null,
            emergency_contact_name: formData.emergency_contact_name || null,
            emergency_contact_phone: formData.emergency_contact_phone || null,

            // Section 2 — Médecins
            general_practitioner: formData.general_practitioner || null,
            gp_city: formData.gp_city || null,
            specialist: formData.specialist || null,
            specialist_city: formData.specialist_city || null,

            // Section 3 — Situation générale
            profession: formData.profession || null,
            referral_source: formData.referral_source || [],
            referral_other: formData.referral_other || null,

            // Section 4 — Données médicales
            height_cm: formData.height_cm ? parseInt(formData.height_cm) : null,
            weight_kg: formData.weight_kg ? parseInt(formData.weight_kg) : null,
            has_allergies: formData.has_allergies ?? null,
            allergies_detail: formData.allergies_detail || null,
            is_smoker: formData.is_smoker ?? null,
            cigarettes_per_day: formData.cigarettes_per_day ? parseInt(formData.cigarettes_per_day) : null,
            has_treatment: formData.has_treatment ?? null,
            treatment_detail: formData.treatment_detail || null,

            // Section 5 — Motif
            consultation_reasons: formData.consultation_reasons || [],
            consultation_other: formData.consultation_other || null,

            // Section 6 — Ressenti esthétique
            discomfort_level: formData.discomfort_level || null,
            discomfort_duration: formData.discomfort_duration || null,
            previous_consultation: formData.previous_consultation ?? null,

            // Section 7 — Antécédents personnels
            antecedents: formData.antecedents || {},
            antecedents_details: formData.antecedents_details || null,

            // Section 8 — Antécédents chirurgicaux & familiaux
            previous_surgery: formData.previous_surgery ?? null,
            previous_surgery_detail: formData.previous_surgery_detail || null,
            surgical_complications: formData.surgical_complications ?? null,
            complications_detail: formData.complications_detail || null,
            easy_hematomas: formData.easy_hematomas ?? null,
            keloid_scars: formData.keloid_scars ?? null,
            autoimmune_family: formData.autoimmune_family ?? null,
            autoimmune_detail: formData.autoimmune_detail || null,
            family_history_other: formData.family_history_other || null,

            // Méta
            has_aesthetic_interventions: formData.has_aesthetic_interventions ?? null,
            aesthetic_satisfied: formData.aesthetic_satisfied ?? null,
            signed_city: formData.signed_city || null,
            signed_date: formData.signed_date || new Date().toISOString().split('T')[0],
        };

        const { error: upsertError } = await supabase
            .from('intake_form_responses')
            .upsert(intakePayload, { onConflict: 'patient_id' });

        if (upsertError) throw upsertError;

        return { success: true };
    } catch (err) {
        console.error('[intakeService] submitIntakeForm error:', err);
        return { success: false, error: err.message };
    }
}
