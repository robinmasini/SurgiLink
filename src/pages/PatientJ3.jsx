import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sparkles, AlertCircle } from 'lucide-react';
import { pathwayConfig } from '../config/pathway.config';
import { saveResponse, getResponses, markScreenCompleted } from '../services/pathwayService';
import { scheduleStateBasedReminders } from '../services/reminderService';
import QuestionRenderer from '../components/pathway/QuestionRenderer';
import AlertBanner from '../components/pathway/AlertBanner';
import { usePatientId } from '../hooks/usePatientId';

export default function PatientJ3() {
    const navigate = useNavigate();
    const { token } = useParams();
    const { patientId: resolvedPatientId, loading: loadingPatientId, error: patientIdError, isTokenMode } = usePatientId();
    const [responses, setResponses] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const config = pathwayConfig.J3;

    useEffect(() => {
        if (resolvedPatientId) {
            loadResponses();
        }
    }, [resolvedPatientId]);

    const loadResponses = async () => {
        if (!resolvedPatientId) return;
        setLoading(true);
        const data = await getResponses(parseInt(resolvedPatientId), 'J3');
        setResponses(data);
        setLoading(false);
    };

    const handleChange = async (itemId, value) => {
        setResponses(prev => ({ ...prev, [itemId]: value }));
        if (resolvedPatientId) {
            await saveResponse(parseInt(resolvedPatientId), 'J3', itemId, value, false);
        }
    };

    const handleSubmit = async () => {
        setSaving(true);
        if (resolvedPatientId) {
            await markScreenCompleted(parseInt(resolvedPatientId), 'J3');
            await scheduleStateBasedReminders(parseInt(resolvedPatientId), 'J3');
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
                <div style={{ color: 'var(--color-primary-600)', fontWeight: 'var(--font-weight-semibold)' }}>J-3 • Rappel Intermédiaire</div>
            </div>

            {/* Content */}
            <div className="patient-content fade-in">
                <AlertBanner
                    type="info"
                    title="À 3 jours de votre intervention"
                    message="Vérifiez que tout est bien organisé pour votre retour à domicile et que vos documents sont prêts."
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
                                screen="J3"
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
                    {saving ? 'Enregistrement...' : 'Valider le rappel J-3'}
                </button>
            </div>

            {/* FAB */}
            <button className="fab">
                <Sparkles size={24} />
            </button>
        </div>
    );
}
