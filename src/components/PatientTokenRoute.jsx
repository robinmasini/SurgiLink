import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { validateToken, cleanPatientId } from '../services/tokenService';
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

                const pid = cleanPatientId(validation.patientId);

                // 2. Load patient
                let patientData = null;

                try {
                    const queryPromise = supabase
                        .from('patients')
                        .select('*')
                        .eq('id', pid)
                        .maybeSingle();
                    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve({ data: null }), 5000));
                    const res = await Promise.race([queryPromise, timeoutPromise]);
                    if (res?.data) patientData = res.data;
                } catch (e) {
                    console.log('[TokenRoute] Using fallback patient data');
                }

                // If patient object is not directly available, check if intake response exists
                if (!patientData) {
                    let intakeResp = null;
                    try {
                        const { data } = await supabase
                            .from('intake_form_responses')
                            .select('*')
                            .eq('patient_id', pid)
                            .maybeSingle();
                        intakeResp = data;
                    } catch (e) {}

                    patientData = {
                        id: pid || 'demo-patient',
                        name: intakeResp?.first_name ? `${intakeResp.first_name} ${intakeResp.last_name || ''}`.trim() : 'Nouveau patient',
                        status: intakeResp?.form_completed ? 'pending' : 'intake',
                        progress: 0,
                        days_until: 'J-0',
                        date: null
                    };
                }

                console.log('[TokenRoute] Data:', patientData);
                setPatient(patientData);

                // 3. Onboarding check
                const isDemoToken = String(token).toLowerCase().includes('demo') || String(token).toLowerCase().includes('test');
                const storageKey = `onboarding_completed_${patientData.id}`;
                const storageKeyToken = `onboarding_completed_${token}`;
                const localOnboarded = localStorage.getItem(storageKey) === 'true' || localStorage.getItem(storageKeyToken) === 'true';
                const consultedOnboarded = !!(patientData.last_consulted_at || patientData.onboarding_completed_at);

                let hasResponsesOnboarded = false;
                try {
                    const { data: userResponses } = await supabase
                        .from('pathway_responses')
                        .select('id')
                        .eq('patient_id', patientData.id)
                        .limit(1);
                    hasResponsesOnboarded = (userResponses || []).length > 0;
                } catch (e) {
                    hasResponsesOnboarded = false;
                }

                const isOnboarded = isDemoToken || localOnboarded || consultedOnboarded || hasResponsesOnboarded;
                const isAlreadyOnboarding = location.pathname.includes('/onboarding');
                const isPortalDashboard = location.pathname === `/patient-portal/${token}` || location.pathname === `/patient-portal/${token}/`;

                // Trigger onboarding only for the portal home dashboard if not completed
                if (!isOnboarded && !isAlreadyOnboarding && isPortalDashboard) {
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
