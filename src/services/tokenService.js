import { supabase } from '../lib/supabase';

/**
 * Generate a cryptographically secure random token
 * @returns {string} - 32-character hexadecimal token
 */
function generateSecureToken() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a unique patient portal token
 * @param {string} patientId - UUID of the patient
 * @param {number|null} expiresInDays - Optional: number of days until expiration
 * @returns {Promise<{success: boolean, token?: string, error?: string}>}
 */
export async function generatePatientToken(patientId, expiresInDays = null) {
    try {
        // Generate unique token
        const token = generateSecureToken();

        // Calculate expiration date if provided
        const expiresAt = expiresInDays
            ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
            : null;

        // Insert into database
        const { data, error } = await supabase
            .from('patient_review_tokens')
            .insert([{
                patient_id: patientId,
                token: token,
                expires_at: expiresAt,
                is_active: true
            }])
            .select()
            .single();

        if (error) throw error;

        return {
            success: true,
            token: data.token,
            tokenId: data.id,
            expiresAt: data.expires_at
        };
    } catch (err) {
        console.error('Error generating patient token:', err);
        return {
            success: false,
            error: err.message
        };
    }
}

/**
 * Validate a patient token and return patient ID
 * @param {string} token - The token to validate
 * @returns {Promise<{valid: boolean, patientId?: string, error?: string}>}
 */
export async function validateToken(token) {
    try {
        const { data, error } = await supabase
            .from('patient_review_tokens')
            .select('patient_id, expires_at, is_active, id')
            .eq('token', token)
            .single();

        if (error || !data) {
            return {
                valid: false,
                error: 'Token invalide ou introuvable'
            };
        }

        // Check if token is active
        if (!data.is_active) {
            return {
                valid: false,
                error: 'Ce lien a été révoqué'
            };
        }

        // Check if token has expired
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
            return {
                valid: false,
                error: 'Ce lien a expiré'
            };
        }

        // Update last accessed timestamp
        await supabase
            .from('patient_review_tokens')
            .update({ last_accessed_at: new Date().toISOString() })
            .eq('id', data.id);

        return {
            valid: true,
            patientId: data.patient_id
        };
    } catch (err) {
        console.error('Error validating token:', err);
        return {
            valid: false,
            error: err.message
        };
    }
}

/**
 * Verify a patient's date of birth against a given portal token
 * @param {string} token - The portal token
 * @param {string} dob - The date of birth (ISO format YYYY-MM-DD)
 * @returns {Promise<{success: boolean, patientId?: string, error?: string}>}
 */
export async function verifyPatientDOB(token, dob) {
    try {
        // 1. First validate the token is still active and valid
        const validation = await validateToken(token);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }

        // 2. Fetch the patient's DOB to compare
        // Note: This fetch happens on the server (via Supabase client)
        // We only return the result to the caller if it matches
        const { data: patient, error: patientError } = await supabase
            .from('patients')
            .select('id, birth_date')
            .eq('id', validation.patientId)
            .single();

        if (patientError || !patient) {
            return { success: false, error: 'Patient introuvable' };
        }

        // 3. Compare DOB
        // Ensure both are in the same format (YYYY-MM-DD)
        if (patient.birth_date === dob) {
            return {
                success: true,
                patientId: patient.id
            };
        } else {
            return {
                success: false,
                error: 'Date de naissance incorrecte'
            };
        }
    } catch (err) {
        console.error('Error verifying DOB:', err);
        return { success: false, error: 'Erreur lors de la vérification' };
    }
}

/**
 * Revoke a patient token
 * @param {string} tokenId - UUID of the token to revoke
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function revokeToken(tokenId) {
    try {
        const { error } = await supabase
            .from('patient_review_tokens')
            .update({ is_active: false })
            .eq('id', tokenId);

        if (error) throw error;

        return { success: true };
    } catch (err) {
        console.error('Error revoking token:', err);
        return {
            success: false,
            error: err.message
        };
    }
}

/**
 * Get all tokens for a patient
 * @param {string} patientId - UUID of the patient
 * @returns {Promise<Array>} - List of tokens
 */
export async function getPatientTokens(patientId) {
    try {
        const { data, error } = await supabase
            .from('patient_review_tokens')
            .select('*')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data || [];
    } catch (err) {
        console.error('Error fetching patient tokens:', err);
        return [];
    }
}
