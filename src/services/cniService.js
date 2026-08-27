import { supabase } from '../lib/supabase';

/**
 * Compress and process an image file to Base64 (JPEG format).
 * @param {File} file - Image file from file input or drag-and-drop
 * @param {number} maxWidth - Max width allowed (default 1200px)
 * @param {number} maxHeight - Max height allowed (default 1200px)
 * @param {number} quality - JPEG compression quality (0 to 1, default 0.7)
 * @returns {Promise<string>} Base64 data URL
 */
export function processImageToBase64(file, maxWidth = 1200, maxHeight = 1200, quality = 0.7) {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) {
            reject(new Error('Le fichier fourni n\'est pas une image valide.'));
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = (err) => reject(new Error('Erreur lors du chargement de l\'image.'));
        };
        reader.onerror = (err) => reject(new Error('Erreur lors de la lecture du fichier.'));
    });
}

/**
 * Fetch intake response data (including CNI) for a given patient.
 * @param {number|string} patientId 
 * @returns {Promise<Object|null>}
 */
export async function getPatientCNI(patientId) {
    try {
        const { data, error } = await supabase
            .from('intake_form_responses')
            .select('id, patient_id, id_card_recto, id_card_verso, cni_in_person')
            .eq('patient_id', patientId)
            .maybeSingle();

        if (error) throw error;
        return data || null;
    } catch (err) {
        console.error('Error fetching patient CNI:', err);
        return null;
    }
}

/**
 * Save or update CNI fields for a patient in intake_form_responses.
 * @param {number|string} patientId 
 * @param {Object} cniData - { id_card_recto, id_card_verso, cni_in_person }
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function updatePatientCNI(patientId, { id_card_recto = null, id_card_verso = null, cni_in_person = false }) {
    try {
        const numericPatientId = parseInt(patientId, 10);
        if (isNaN(numericPatientId)) {
            throw new Error('ID Patient invalide');
        }

        // Check if an intake response already exists for this patient
        const { data: existing } = await supabase
            .from('intake_form_responses')
            .select('id')
            .eq('patient_id', numericPatientId)
            .maybeSingle();

        const payload = {
            id_card_recto: cni_in_person ? 'IN_PERSON' : (id_card_recto || null),
            id_card_verso: cni_in_person ? null : (id_card_verso || null),
            cni_in_person: !!cni_in_person,
            updated_at: new Date().toISOString()
        };

        let result;
        if (existing) {
            const { data, error } = await supabase
                .from('intake_form_responses')
                .update(payload)
                .eq('patient_id', numericPatientId)
                .select()
                .single();

            if (error) throw error;
            result = data;
        } else {
            const { data, error } = await supabase
                .from('intake_form_responses')
                .insert({
                    patient_id: numericPatientId,
                    submitted_at: new Date().toISOString(),
                    ...payload
                })
                .select()
                .single();

            if (error) throw error;
            result = data;
        }

        return { success: true, data: result };
    } catch (err) {
        console.error('Error updating CNI:', err);
        return { success: false, error: err.message || 'Erreur lors de la mise à jour de la CNI' };
    }
}

/**
 * Delete / clear CNI data for a patient.
 * @param {number|string} patientId 
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deletePatientCNI(patientId) {
    return updatePatientCNI(patientId, {
        id_card_recto: null,
        id_card_verso: null,
        cni_in_person: false
    });
}
