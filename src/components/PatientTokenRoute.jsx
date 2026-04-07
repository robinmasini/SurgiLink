import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { validateToken } from '../services/tokenService';
import { Loader, AlertCircle } from 'lucide-react';
import LanguageSelector from './LanguageSelector';

export default function PatientTokenRoute({ children }) {
    const { token } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [patient, setPatient] = useState(null);

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

                // 2. Load the patient data immediately (no DOB check required anymore)
                const { data: patientData, error: patientError } = await supabase
                    .from('patients')
                    .select('*')
                    .eq('id', validation.patientId)
                    .single();

                if (patientError) throw patientError;

                setPatient(patientData);

            } catch (err) {
                console.error('Error in PatientTokenRoute initial check:', err);
                setError('Erreur lors du chargement de l\'accès');
            } finally {
                setLoading(false);
            }
        };

        checkInitialStatus();
    }, [token]);


    if (loading) {
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
                        Chargement de l'accès sécurisé...
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


    // Pass patient and token to children
    return (
        <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 1000 }}>
                <LanguageSelector />
            </div>
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child, { patient, token });
                }
                return child;
            })}
        </div>
    );
}
