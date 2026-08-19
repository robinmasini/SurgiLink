import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
import { pathwayConfig } from '../config/pathway.config';
import { saveResponse, getResponses, markScreenCompleted } from '../services/pathwayService';
import QuestionnaireFlow from '../components/pathway/QuestionnaireFlow';
import AlertBanner from '../components/pathway/AlertBanner';
import CompactAppointmentCard from '../components/CompactAppointmentCard';
import { usePatientId } from '../hooks/usePatientId';
import { supabase } from '../lib/supabase';
import { calculateDaysUntilSurgery } from '../utils/dateUtils';

export default function Bienvenue({ patient: propPatient, token: propToken }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { token: urlToken } = useParams();
    const token = propToken || urlToken;
    const { patientId: hookPatientId, loading: hookLoading, error: hookError, isTokenMode: hookIsTokenMode } = usePatientId();

    const resolvedPatientId = propPatient?.id || hookPatientId;
    const loadingPatientId = !propPatient && hookLoading;
    const patientIdError = !propPatient && hookError;
    const isTokenMode = propPatient ? true : hookIsTokenMode;

    const [responses, setResponses] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [patient, setPatient] = useState(propPatient || null);
    const [saveError, setSaveError] = useState(null);

    const config = pathwayConfig.Bienvenue;

    useEffect(() => {
        if (resolvedPatientId) {
            loadResponses();
            if (!propPatient) loadPatientData();
        }
    }, [resolvedPatientId]);

    const loadPatientData = async () => {
        try {
            const queryPromise = supabase.from('patients').select('*').eq('id', resolvedPatientId).single();
            const timeoutPromise = new Promise(resolve => setTimeout(() => resolve({ data: null }), 600));
            const { data } = await Promise.race([queryPromise, timeoutPromise]);
            if (data) {
                setPatient(data);
            } else {
                setPatient({
                    id: resolvedPatientId || 'demo-patient',
                    name: 'Marie DUPONT',
                    clinic_name: 'Clinique de la Paix',
                    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    surgery_time: '08:30'
                });
            }
        } catch (e) {
            setPatient({
                id: resolvedPatientId || 'demo-patient',
                name: 'Marie DUPONT',
                clinic_name: 'Clinique de la Paix',
                date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                surgery_time: '08:30'
            });
        }
    };

    const loadResponses = async () => {
        if (!resolvedPatientId) return;
        setLoading(true);
        const data = await getResponses(resolvedPatientId, 'Bienvenue');
        setResponses(data);
        setLoading(false);
    };

    const handleChange = async (itemId, value) => {
        setResponses(prev => ({ ...prev, [itemId]: value }));
        setSaveError(null);
        if (resolvedPatientId) {
            const res = await saveResponse(resolvedPatientId, 'Bienvenue', itemId, value, false);
            if (!res.success) {
                setSaveError(t("Erreur de sauvegarde : votre réponse n'a pas pu être enregistrée. La base de données rejette l'opération (vérifiez les contraintes de table)."));
            }
        }
    };

    const handleSubmit = async () => {
        setSaving(true);
        setSaveError(null);
        if (resolvedPatientId) {
            const res = await markScreenCompleted(resolvedPatientId, 'Bienvenue');
            if (!res.success) {
                setSaveError(t("Erreur de validation : impossible de valider le questionnaire dans la base de données."));
                setSaving(false);
                return;
            }
        }
        setSaving(false);

        if (isTokenMode) {
            navigate(`/patient-portal/${token}/success`);
        } else {
            navigate('/patient/success');
        }
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
                <h2 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-1)' }}>{t('Bienvenue')}</h2>
                <div style={{ color: 'var(--color-primary-600)', fontWeight: 'var(--font-weight-semibold)' }}>{t(config.subtitle)}</div>
            </div>

            <div className="patient-content fade-in">
                {saveError && (
                    <div style={{ marginBottom: 'var(--spacing-4)' }}>
                        <AlertBanner
                            type="danger"
                            title={t("Erreur de synchronisation")}
                            message={saveError}
                        />
                    </div>
                )}
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

                <div style={{
                    background: 'var(--color-primary-50)',
                    padding: 'var(--spacing-4)',
                    borderRadius: 'var(--radius-lg)',
                    marginBottom: 'var(--spacing-6)',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    color: 'var(--color-primary-900)',
                    border: '1px solid var(--color-primary-100)'
                }}>
                    <strong>{t('Bienvenue sur votre portail SurgiLink.')}</strong> {t('Nous sommes ravis de vous accompagner dans votre parcours de soins. Merci de confirmer que vous avez bien accès à tous vos outils.')}
                </div>

                <QuestionnaireFlow
                    config={config}
                    responses={responses}
                    onChange={handleChange}
                    onComplete={handleSubmit}
                    saving={saving}
                    screen="Bienvenue"
                    patientId={resolvedPatientId}
                />
            </div>
        </div>
    );
}
