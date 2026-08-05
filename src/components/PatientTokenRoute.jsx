import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { validateToken } from '../services/tokenService';
import { Loader, AlertCircle } from 'lucide-react';
import LanguageSelector from './LanguageSelector';

export default function PatientTokenRoute({ children }) {
    const { token } = useParams();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [patient, setPatient] = useState(null);
    const [needsOnboarding, setNeedsOnboarding] = useState(false);

    useEffect(() => {
        const checkInitialStatus = async () => {
            setLoading(true);
            setError(null);

            try {
                // 1. Validate token
                const validation = await validateToken(token);

                if (!validation.valid) {
                    setError(validation.error || 'Lien invalide ou expiré');
                    setLoading(false);
                    return;
                }

                // 2. Load patient
                const { data: patientData, error: patientError } = await supabase
                    .from('patients')
                    .select('*')
                    .eq('id', validation.patientId)
                    .single();

                if (patientError) throw patientError;

                console.log('[TokenRoute] Data:', patientData);
                setPatient(patientData);

                // ── Intake gate: patient hasn't filled their medical form yet ──
                // Redirect them directly to the intake form instead of the portal.
                if (patientData.status === 'intake') {
                    // We reuse the same token — /fiche/:token handles intake flow
                    window.location.replace(`/fiche/${token}`);
                    return;
                }

                // 3. Onboarding check
                const storageKey = `onboarding_completed_${patientData.id}`;
                const localOnboarded = localStorage.getItem(storageKey) === 'true';
                const consultedOnboarded = !!patientData.last_consulted_at;

                // Check if patient has any responses in pathway_responses table
                const { data: userResponses } = await supabase
                    .from('pathway_responses')
                    .select('id')
                    .eq('patient_id', patientData.id)
                    .limit(1);

                const hasResponsesOnboarded = (userResponses || []).length > 0;
                const isOnboarded = localOnboarded || consultedOnboarded || hasResponsesOnboarded;
                const isAlreadyOnboarding = location.pathname.includes('/onboarding');

                // Trigger onboarding for any portal route if not completed
                if (!isOnboarded && !isAlreadyOnboarding) {
                    console.log('[TokenRoute] -> Setting needsOnboarding=true');
                    setNeedsOnboarding(true);
                }

                setLoading(false);
            } catch (err) {
                console.error('[TokenRoute] Error:', err);
                setError('Erreur d\'accès');
                setLoading(false);
            }
        };

        checkInitialStatus();
    }, [token, location.pathname]);

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
                <div style={{ textAlign: 'center' }}>
                    <Loader className="animate-spin" size={48} style={{ margin: '0 auto var(--spacing-4)', color: 'var(--color-primary-500)' }} />
                    <p style={{ color: 'var(--color-gray-600)' }}>Chargement...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
                <div className="card" style={{ maxWidth: '500px', textAlign: 'center' }}>
                    <AlertCircle size={64} style={{ margin: '0 auto var(--spacing-4)', color: 'var(--color-danger-500)' }} />
                    <h2 style={{ marginBottom: 'var(--spacing-2)' }}>Accès non autorisé</h2>
                    <p style={{ color: 'var(--color-gray-600)' }}>{error}</p>
                </div>
            </div>
        );
    }

    if (needsOnboarding) {
        return <Navigate to={`/patient-portal/${token}/onboarding`} replace />;
    }


    // Pass patient and token to children
    return (
        <div style={{ position: 'relative' }}>
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child, { patient, token });
                }
                return child;
            })}
        </div>
    );
}
