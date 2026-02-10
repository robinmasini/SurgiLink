import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { validateToken } from '../services/tokenService';

/**
 * Hook to resolve patient ID from either direct patientId param or token param
 * @returns {object} - { patientId, loading, error, isTokenMode }
 */
export function usePatientId() {
    const params = useParams();
    const [patientId, setPatientId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isTokenMode, setIsTokenMode] = useState(false);

    useEffect(() => {
        const resolvePatientId = async () => {
            setLoading(true);
            setError(null);

            // Check if we have a direct patientId
            if (params.patientId) {
                setPatientId(parseInt(params.patientId));
                setIsTokenMode(false);
                setLoading(false);
                return;
            }

            // Otherwise, try to resolve from token
            if (params.token) {
                setIsTokenMode(true);
                const validation = await validateToken(params.token);

                if (validation.valid) {
                    setPatientId(validation.patientId);
                } else {
                    setError(validation.error || 'Token invalide');
                }

                setLoading(false);
                return;
            }

            // No valid param found
            setError('Aucun identifiant patient fourni');
            setLoading(false);
        };

        resolvePatientId();
    }, [params.patientId, params.token]);

    return {
        patientId,
        loading,
        error,
        isTokenMode
    };
}
