import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { pathwayConfig } from '../config/pathway.config';
import { saveResponse, getResponses, markScreenCompleted } from '../services/pathwayService';
import QuestionnaireFlow from '../components/pathway/QuestionnaireFlow';
import CompactAppointmentCard from '../components/CompactAppointmentCard';
import { usePatientId } from '../hooks/usePatientId';
import { cleanPatientId } from '../services/tokenService';
import { supabase } from '../lib/supabase';
import { calculateDaysUntilSurgery, isMilestoneDue } from '../utils/dateUtils';
import { useTranslation } from 'react-i18next';

export default function PatientESatis({ patient: propPatient, token: propToken }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { token: urlToken } = useParams();
    const token = propToken || urlToken;
    const { patientId: hookPatientId, loading: hookLoading, error: hookError } = usePatientId();

    const resolvedPatientId = propPatient?.id || hookPatientId;
    const loadingPatientId = !propPatient && hookLoading;
    const patientIdError = !propPatient && hookError;

    const [responses, setResponses] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [patient, setPatient] = useState(propPatient || null);

    const config = pathwayConfig.ESATIS;

    useEffect(() => {
        if (resolvedPatientId) {
            if (String(resolvedPatientId).toLowerCase().includes('demo')) {
                setPatient({
                    id: 'demo-patient',
                    name: 'Marie DUPONT',
                    clinic_name: 'Clinique de la Paix',
                    date: new Date().toISOString().split('T')[0],
                    surgery_time: '08:30'
                });
                setLoading(false);
            } else {
                loadResponses();
                if (!propPatient || !propPatient.date) loadPatientData();
            }
        } else {
            setLoading(false);
        }
    }, [resolvedPatientId, propPatient]);

    const loadPatientData = async () => {
        try {
            const cleanId = cleanPatientId(resolvedPatientId);
            if (!cleanId) return;
            const { data } = await supabase.from('patients').select('*').eq('id', cleanId).maybeSingle();
            if (data) {
                setPatient(data);
            } else if (propPatient) {
                setPatient(propPatient);
            }
        } catch (e) {
            if (propPatient) setPatient(propPatient);
        }
    };

    const loadResponses = async () => {
        if (!resolvedPatientId) return;
        setLoading(true);
        const data = await getResponses(resolvedPatientId, 'ESATIS');
        setResponses(data);
        setLoading(false);
    };

    const handleChange = async (itemId, value) => {
        setResponses(prev => ({ ...prev, [itemId]: value }));
        if (resolvedPatientId) {
            await saveResponse(resolvedPatientId, 'ESATIS', itemId, value, false);
        }
    };

    const handleSubmit = async () => {
        setSaving(true);
        if (resolvedPatientId) {
            await markScreenCompleted(resolvedPatientId, 'ESATIS');
        }
        setSaving(false);
        navigate(`/patient-portal/${token}/success`);
    };

    if (loadingPatientId || loading) {
        return (
            <div className="patient-view" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div>{t('Chargement...')}</div>
            </div>
        );
    }

    if (patientIdError) {
        return (
            <div className="patient-view" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="card" style={{ maxWidth: '500px', textAlign: 'center', padding: 'var(--spacing-6)' }}>
                    <AlertCircle size={64} style={{ margin: '0 auto var(--spacing-4)', color: 'var(--color-danger-500)' }} />
                    <h2 style={{ marginBottom: 'var(--spacing-2)' }}>{t('Accès non autorisé')}</h2>
                    <p style={{ color: 'var(--color-gray-600)' }}>{t(patientIdError)}</p>
                </div>
            </div>
        );
    }



    return (
        <div className="patient-view">
            <div className="patient-header" style={{ padding: 'var(--spacing-6) var(--spacing-4)', textAlign: 'center', display: 'block' }}>
                <h2 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-1)' }}>{t('Enquête e-Satis')}</h2>
                <div style={{ color: 'var(--color-primary-600)', fontWeight: 'var(--font-weight-semibold)' }}>{t('Votre avis national')}</div>
            </div>

            <div className="patient-content fade-in">
                {patient && (
                    <CompactAppointmentCard
                        variant="pill"
                        clinicName={patient.clinic_name}
                        appointmentDate={patient.date}
                        appointmentTime={patient.surgery_time}
                        jValue={calculateDaysUntilSurgery(patient.date)}
                        style={{ justifyContent: 'center', marginBottom: 'var(--spacing-6)' }}
                    />
                )}

                <QuestionnaireFlow
                    config={config}
                    responses={responses}
                    onChange={handleChange}
                    onComplete={handleSubmit}
                    saving={saving}
                    screen="ESATIS"
                    patientId={resolvedPatientId}
                />
            </div>
        </div>
    );
}
