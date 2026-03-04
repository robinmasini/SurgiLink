import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sparkles, AlertCircle } from 'lucide-react';
import { pathwayConfig } from '../config/pathway.config';
import { saveResponse, getResponses, markScreenCompleted } from '../services/pathwayService';
import { scheduleStateBasedReminders } from '../services/reminderService';
import QuestionRenderer from '../components/pathway/QuestionRenderer';
import AlertBanner from '../components/pathway/AlertBanner';
import CompactAppointmentCard from '../components/CompactAppointmentCard';
import { usePatientId } from '../hooks/usePatientId';
import { supabase } from '../lib/supabase';
import { calculateDaysUntilSurgery } from '../utils/dateUtils';

export default function PatientJ1PreOp() {
    const navigate = useNavigate();
    const { token } = useParams();
    const { patientId: resolvedPatientId, loading: loadingPatientId, error: patientIdError, isTokenMode } = usePatientId();
    const [responses, setResponses] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [patient, setPatient] = useState(null);

    const config = pathwayConfig.J1_PreOp;

    useEffect(() => {
        if (resolvedPatientId) {
            loadResponses();
            loadPatientData();
        }
    }, [resolvedPatientId]);

    const loadPatientData = async () => {
        const { data } = await supabase.from('patients').select('*').eq('id', resolvedPatientId).single();
        if (data) setPatient(data);
    };

    const loadResponses = async () => {
        if (!resolvedPatientId) return;
        setLoading(true);
        const data = await getResponses(parseInt(resolvedPatientId), 'J1_PreOp');
        setResponses(data);
        setLoading(false);
    };

    const handleChange = async (itemId, value) => {
        setResponses(prev => ({ ...prev, [itemId]: value }));
        if (resolvedPatientId) {
            await saveResponse(parseInt(resolvedPatientId), 'J1_PreOp', itemId, value, false);
        }
    };

    const handleSubmit = async () => {
        setSaving(true);
        if (resolvedPatientId) {
            await markScreenCompleted(parseInt(resolvedPatientId), 'J1_PreOp');
            await scheduleStateBasedReminders(parseInt(resolvedPatientId), 'J1_PreOp');
        }
        setSaving(false);
        if (isTokenMode) {
            navigate(`/patient-portal/${token}/success`);
        } else {
            navigate('/patient/success');
        }
    };

    if (loadingPatientId) {
        return (
            <div className="patient-view" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div>Chargement...</div>
            </div>
        );
    }

    if (patientIdError) {
        return (
            <div className="patient-view" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="card" style={{ maxWidth: '500px', textAlign: 'center', padding: 'var(--spacing-6)' }}>
                    <AlertCircle size={64} style={{ margin: '0 auto var(--spacing-4)', color: 'var(--color-danger-500)' }} />
                    <h2 style={{ marginBottom: 'var(--spacing-2)' }}>Accès non autorisé</h2>
                    <p style={{ color: 'var(--color-gray-600)' }}>{patientIdError}</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="patient-view" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div>Chargement...</div>
            </div>
        );
    }

    return (
        <div className="patient-view">
            {/* Header */}
            <div className="patient-header" style={{ padding: 'var(--spacing-6) var(--spacing-4)', textAlign: 'center', display: 'block' }}>
                <h2 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-1)' }}>Dossier Médical</h2>
                <div style={{ color: 'var(--color-primary-600)', fontWeight: 'var(--font-weight-semibold)' }}>J-1 • Veille de l'Intervention</div>
            </div>

            {/* Content */}
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

                <AlertBanner
                    type="warning"
                    title="Ce soir : dernières préparations"
                    message="Effectuez votre douche antiseptique et l'épilation ce soir. Préparez votre sac pour demain matin."
                />

                {/* Sections */}
                {config.sections.map((section) => (
                    <div key={section.id}>
                        <div className="step-section" style={{ marginTop: 'var(--spacing-6)' }}>
                            <div className="step-header">
                                <span className="step-header-icon">{section.icon}</span>
                                <div>
                                    <div className="step-header-title">{section.title}</div>
                                    {section.subtitle && <div className="step-header-subtitle">{section.subtitle}</div>}
                                </div>
                            </div>
                        </div>
                        {section.items.map((item) => (
                            <QuestionRenderer
                                key={item.id}
                                item={item}
                                value={responses[item.id]?.main ?? responses[item.id]}
                                onChange={handleChange}
                                screen="J1_PreOp"
                            />
                        ))}
                    </div>
                ))}

                {/* Submit Button */}
                <button
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%', marginTop: 'var(--spacing-6)' }}
                    onClick={handleSubmit}
                    disabled={saving}
                >
                    {saving ? 'Enregistrement...' : 'Valider la préparation J-1'}
                </button>
            </div>

            {/* FAB */}
            <button className="fab">
                <Sparkles size={24} />
            </button>
        </div>
    );
}
