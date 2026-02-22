import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { validateToken } from '../services/tokenService';
import PatientPortalAuth from './PatientPortalAuth';
import { Loader, AlertCircle } from 'lucide-react';

export default function PatientTokenRoute({ children }) {
    const { token } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [patient, setPatient] = useState(null);
    const [verified, setVerified] = useState(false);
    const [verificationLoading, setVerificationLoading] = useState(false);

    // Initial check: is the token valid and is the patient already verified in this session?
    useEffect(() => {
        const checkInitialStatus = async () => {
            setLoading(true);
            setError(null);

            try {
                // 1. First, validate the token itself (without DOB yet)
                const validation = await validateToken(token);

                if (!validation.valid) {
                    setError(validation.error || 'Lien invalide ou expiré');
                    setLoading(false);
                    return;
                }

                // 2. Check if this patient is already verified in the session
                const isVerified = sessionStorage.getItem(`patient_verified_${validation.patientId}`) === 'true';

                if (isVerified) {
                    // If already verified, load the patient data immediately
                    const { data: patientData, error: patientError } = await supabase
                        .from('patients')
                        .select('*')
                        .eq('id', validation.patientId)
                        .single();

                    if (patientError) throw patientError;

                    setPatient(patientData);
                    setVerified(true);
                } else {
                    // Not verified yet, we stay on the auth screen
                    setVerified(false);
                }

            } catch (err) {
                console.error('Error in PatientTokenRoute initial check:', err);
                setError('Erreur lors du chargement de l\'accès');
            } finally {
                setLoading(false);
            }
        };

        checkInitialStatus();
    }, [token]);

    const handleVerifySuccess = async (patientId) => {
        setVerificationLoading(true);
        try {
            // Store verification in session
            sessionStorage.setItem(`patient_verified_${patientId}`, 'true');

            // Now that we are verified, load the patient data
            const { data: patientData, error: patientError } = await supabase
                .from('patients')
                .select('*')
                .eq('id', patientId)
                .single();

            if (patientError) throw patientError;

            setPatient(patientData);
            setVerified(true);
        } catch (err) {
            console.error('Error loading patient after verification:', err);
            setError('Erreur lors du chargement de vos données');
        } finally {
            setVerificationLoading(false);
        }
    };

    if (loading || verificationLoading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <Loader className="animate-spin" size={48} style={{ margin: '0 auto var(--spacing-4)', color: 'var(--color-primary-500)' }} />
                    <p style={{ color: 'var(--color-gray-600)' }}>
                        {verificationLoading ? 'Vérification en cours...' : 'Chargement de l\'accès sécurisé...'}
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
            }}>
                <div className="card" style={{ maxWidth: '500px', textAlign: 'center' }}>
                    <AlertCircle size={64} style={{ margin: '0 auto var(--spacing-4)', color: 'var(--color-danger-500)' }} />
                    <h2 style={{ marginBottom: 'var(--spacing-2)' }}>Accès non autorisé</h2>
                    <p style={{ color: 'var(--color-gray-600)', marginBottom: 'var(--spacing-6)' }}>{error}</p>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)' }}>
                        Si vous pensez qu'il s'agit d'une erreur, veuillez contacter votre praticien.
                    </p>
                </div>
            </div>
        );
    }

    if (!verified) {
        return <PatientPortalAuth token={token} onVerify={handleVerifySuccess} />;
    }

    // Pass patient and token to children
    return (
        <>
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child, { patient, token });
                }
                return child;
            })}
        </>
    );
}
