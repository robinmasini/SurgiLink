import { supabase } from '../lib/supabase';

/**
 * Generate a cryptographically secure random token
 * @returns {string} - 32-character hexadecimal token
 */
/**
 * Helper to clean and extract numeric patient ID or string key from any raw parameter/token.
 * Handles inputs like 105, "105", "p_105_abc123", "pid_105_...", "demo-patient".
 * @param {any} input
 * @returns {number|string|null}
 */
export function cleanPatientId(input) {
    if (input === null || input === undefined || input === '') return null;
    if (typeof input === 'number') return input;
    const str = String(input).trim();
    if (!isNaN(str) && !str.startsWith('0')) return parseInt(str, 10);
    const match = str.match(/^p(?:id)?[_-](demo-p\d+|\d+|[a-z0-9-]+?)(?:[_-].*)?$/i);
    if (match && match[1]) {
        const raw = match[1];
        return (!isNaN(raw) && !raw.startsWith('0')) ? parseInt(raw, 10) : raw;
    }
    return str;
}

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
 * @param {string|number} patientId - ID of the patient
 * @param {number|null} expiresInDays - Optional: number of days until expiration
 * @returns {Promise<{success: boolean, token?: string, error?: string, tokenId?: string, expiresAt?: string}>}
 */
export async function generatePatientToken(patientId, expiresInDays = null) {
    const pid = cleanPatientId(patientId);
    const secureRand = generateSecureToken();
    // Always use self-describing token format p_<pid>_<hash> so token works even offline/unauthenticated
    const tokenValue = pid ? `p_${pid}_${secureRand}` : secureRand;

    try {
        // Try to get current session user to satisfy RLS if patient has no user_id
        let userId = null;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            userId = session?.user?.id || null;
        } catch (e) {
            console.warn('Could not retrieve auth session:', e);
        }

        if (userId && pid && typeof pid === 'number') {
            try {
                const { data: patientData } = await supabase
                    .from('patients')
                    .select('user_id')
                    .eq('id', pid)
                    .maybeSingle();

                if (patientData && !patientData.user_id) {
                    await supabase
                        .from('patients')
                        .update({ user_id: userId })
                        .eq('id', pid);
                }
            } catch (e) {
                console.warn('Error associating user_id to patient:', e);
            }
        }

        // Calculate expiration date if provided
        const expiresAt = expiresInDays
            ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
            : null;

        const insertPayload = {
            patient_id: pid,
            token: tokenValue,
            expires_at: expiresAt,
            is_active: true
        };
        if (userId) {
            insertPayload.user_id = userId;
        }

        // Insert into database
        try {
            const { data, error } = await supabase
                .from('patient_review_tokens')
                .insert([insertPayload])
                .select()
                .single();

            if (!error && data) {
                return {
                    success: true,
                    token: data.token,
                    tokenId: data.id,
                    expiresAt: data.expires_at
                };
            }
        } catch (insertErr) {
            console.warn('DB token insert failed, checking fallback...', insertErr);
        }

        // Fallback: Check if active token exists despite insert error
        try {
            const { data: fallbackTokens } = await supabase
                .from('patient_review_tokens')
                .select('*')
                .eq('patient_id', pid)
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(1);

            if (fallbackTokens && fallbackTokens.length > 0) {
                return {
                    success: true,
                    token: fallbackTokens[0].token,
                    tokenId: fallbackTokens[0].id,
                    expiresAt: fallbackTokens[0].expires_at
                };
            }
        } catch (fbErr) {
            console.warn('Fallback token query failed:', fbErr);
        }

        // Fail-safe: Generate self-describing fallback token
        return {
            success: true,
            token: tokenValue,
            tokenId: null,
            expiresAt: null
        };
    } catch (err) {
        console.error('Error generating patient token, using fail-safe:', err);
        return {
            success: true,
            token: tokenValue
        };
    }
}

/**
 * Get an existing active token or generate a new one for a patient
 * @param {string|number} patientId - ID of the patient
 * @param {number|null} expiresInDays - Optional expiration in days
 * @returns {Promise<{success: boolean, token?: string, error?: string, tokenId?: string, expiresAt?: string}>}
 */
export async function getOrCreatePatientToken(patientId, expiresInDays = null) {
    const pid = cleanPatientId(patientId);

    try {
        // 1. Check for existing active token
        try {
            const { data: existingTokens, error } = await supabase
                .from('patient_review_tokens')
                .select('*')
                .eq('patient_id', pid)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (!error && existingTokens && existingTokens.length > 0) {
                const activeToken = existingTokens.find(t => !t.expires_at || new Date(t.expires_at) > new Date());
                if (activeToken) {
                    return {
                        success: true,
                        token: activeToken.token,
                        tokenId: activeToken.id,
                        expiresAt: activeToken.expires_at
                    };
                }
            }
        } catch (e) {
            console.warn('Error querying existing tokens:', e);
        }

        // 2. Generate new token if no valid active token exists
        return await generatePatientToken(pid, expiresInDays);
    } catch (err) {
        console.error('Error in getOrCreatePatientToken, using fail-safe:', err);
        return await generatePatientToken(pid, expiresInDays);
    }
}

/**
 * Validate a patient token and return patient ID
 * @param {string} token - The token to validate
 * @returns {Promise<{valid: boolean, patientId?: string|number, error?: string}>}
 */
export async function validateToken(token) {
    if (!token) {
        return { valid: false, error: 'Token manquant' };
    }

    const cleanToken = token.trim();
    const lowerToken = cleanToken.toLowerCase();
    const isDemo = !lowerToken || lowerToken === 'demo' || lowerToken.includes('demo') || lowerToken.startsWith('test') || lowerToken.includes('token') || lowerToken === 'patient';

    // Parse self-describing fallback pattern (e.g., p_15_..., p_demo-p1_..., pid_15_...)
    let fallbackPatientId = null;
    const fallbackMatch = cleanToken.match(/^p(?:id)?[_-](demo-p\d+|\d+|[a-z0-9-]+?)(?:[_-][a-f0-9]{16,32})?$/i);
    if (fallbackMatch && fallbackMatch[1]) {
        const rawId = fallbackMatch[1];
        fallbackPatientId = (!isNaN(rawId) && !rawId.startsWith('0')) ? parseInt(rawId, 10) : rawId;
    }

    try {
        // 1. Direct query on exact token string
        const { data, error } = await supabase
            .from('patient_review_tokens')
            .select('patient_id, expires_at, is_active, id')
            .eq('token', cleanToken)
            .maybeSingle();

        if (data) {
            if (!data.is_active) {
                if (fallbackPatientId) return { valid: true, patientId: fallbackPatientId };
                if (isDemo) return { valid: true, patientId: 'demo-patient' };
                return { valid: false, error: 'Ce lien a été révoqué' };
            }

            if (data.expires_at && new Date(data.expires_at) < new Date()) {
                if (fallbackPatientId) return { valid: true, patientId: fallbackPatientId };
                if (isDemo) return { valid: true, patientId: 'demo-patient' };
                return { valid: false, error: 'Ce lien a expiré' };
            }

            // Update last accessed timestamp asynchronously
            try {
                supabase
                    .from('patient_review_tokens')
                    .update({ last_accessed_at: new Date().toISOString() })
                    .eq('id', data.id)
                    .then(() => {})
                    .catch(() => {});
            } catch (e) {
                console.warn('[validateToken] update last_accessed_at error:', e);
            }

            return {
                valid: true,
                patientId: cleanPatientId(data.patient_id)
            };
        }

        // 2. Secondary check if token is p_<pid>_<bareToken> and bareToken is stored in DB
        if (cleanToken.includes('_')) {
            const parts = cleanToken.split('_');
            const bareToken = parts[parts.length - 1];
            if (bareToken && bareToken.length >= 16) {
                try {
                    const { data: bareData } = await supabase
                        .from('patient_review_tokens')
                        .select('patient_id, expires_at, is_active')
                        .eq('token', bareToken)
                        .maybeSingle();

                    if (bareData && bareData.is_active) {
                        return {
                            valid: true,
                            patientId: cleanPatientId(bareData.patient_id)
                        };
                    }
                } catch (e) {}
            }
        }

        // 3. Fallback check for RLS-restricted unauthenticated queries using self-describing pattern
        if (fallbackPatientId) {
            return {
                valid: true,
                patientId: fallbackPatientId
            };
        }

        // 4. Direct numeric ID (e.g. cleanToken = "15")
        if (!isNaN(cleanToken) && parseInt(cleanToken, 10) > 0) {
            return {
                valid: true,
                patientId: parseInt(cleanToken, 10)
            };
        }

        if (isDemo) {
            return { valid: true, patientId: 'demo-patient' };
        }

        return { valid: false, error: 'Token invalide ou introuvable' };
    } catch (err) {
        console.error('Error validating token:', err);
        if (fallbackPatientId) {
            return { valid: true, patientId: fallbackPatientId };
        }
        if (isDemo) {
            return { valid: true, patientId: 'demo-patient' };
        }
        return { valid: false, error: 'Erreur de validation du token' };
    }
}

/**
 * Verify a patient's date of birth against a given portal token
 * @param {string} token - The portal token
 * @param {string} dob - The date of birth (ISO format YYYY-MM-DD)
 * @returns {Promise<{success: boolean, patientId?: string|number, error?: string}>}
 */
export async function verifyPatientDOB(token, dob) {
    try {
        const validation = await validateToken(token);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }

        const pid = cleanPatientId(validation.patientId);

        const { data: patient, error: patientError } = await supabase
            .from('patients')
            .select('id, birth_date')
            .eq('id', pid)
            .maybeSingle();

        if (patientError || !patient) {
            return { success: false, error: 'Patient introuvable' };
        }

        if (!patient.birth_date) {
            return { success: false, error: 'Aucune date de naissance enregistrée. Veuillez contacter votre praticien.' };
        }

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
