import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LogOut, Sparkles, AlertCircle } from 'lucide-react';
import { pathwayConfig } from '../config/pathway.config';
import { saveResponse, getResponses, markScreenCompleted, calculateRiskFlags } from '../services/pathwayService';
import { scheduleStateBasedReminders } from '../services/reminderService';
import QuestionRenderer from '../components/pathway/QuestionRenderer';
import AlertBanner from '../components/pathway/AlertBanner';
import { usePatientId } from '../hooks/usePatientId';

export default function PatientJ2() {
    const navigate = useNavigate();
    const { token } = useParams();
    const { patientId: resolvedPatientId, loading: loadingPatientId, error: patientIdError, isTokenMode } = usePatientId();
    const [responses, setResponses] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [riskFlags, setRiskFlags] = useState({ soft: [], hard: [] });

    const config = pathwayConfig.J2;

    useEffect(() => {
        loadResponses();
    }, [resolvedPatientId]);

    useEffect(() => {
        const flags = calculateRiskFlagsSync();
        setRiskFlags(flags);
    }, [responses]);

    const loadResponses = async () => {
        if (!resolvedPatientId) return;
        setLoading(true);
        const data = await getResponses(parseInt(resolvedPatientId), 'J2');
        setResponses(data);
        setLoading(false);
    };

    const calculateRiskFlagsSync = () => {
        const items = config.sections.flatMap(s => s.items);
        const flags = { soft: [], hard: [] };

        items.forEach(item => {
            if (!item.risk_flag_rule) return;

            const response = responses[item.id]?.main ?? responses[item.id];
            const rule = item.risk_flag_rule;

            let flagged = false;
            if (rule.condition === 'yes' && response === true) flagged = true;
            if (rule.condition === 'no' && response === false) flagged = true;

            if (flagged) {
                if (rule.type === 'hard') {
                    flags.hard.push({ itemId: item.id, label: item.label });
                } else {
                    flags.soft.push({ itemId: item.id, label: item.label });
                }
            }
        });

        return flags;
    };

    const handleChange = async (itemId, value) => {
        setResponses(prev => ({ ...prev, [itemId]: value }));

        if (resolvedPatientId) {
            await saveResponse(parseInt(resolvedPatientId), 'J2', itemId, value, false);
        }
    };

    const handleSubmit = async () => {
        setSaving(true);

        if (resolvedPatientId) {
            await markScreenCompleted(parseInt(resolvedPatientId), 'J2');
            await scheduleStateBasedReminders(parseInt(resolvedPatientId), 'J2');
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
            <div className=" patient-view" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
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
                <div style={{ color: 'var(--color-primary-600)', fontWeight: 'var(--font-weight-semibold)' }}>J-2 • Consignes</div>
            </div>

            {/* Content */}
            <div className="patient-content fade-in">
                {/* Title */}
                <div style={{ marginBottom: 'var(--spacing-6)' }}>
                    <h3 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-2)' }}>
                        {config.title}
                    </h3>
                    <p style={{ color: 'var(--color-gray-600)' }}>{config.subtitle}</p>
                </div>


                {/* Sections */}
                {config.sections.map((section) => (
                    <div key={section.id}>
                        {/* Section Header */}
                        <div className="step-section" style={{ marginTop: 'var(--spacing-6)' }}>
                            <div className="step-header">
                                <span className="step-header-icon">{section.icon}</span>
                                <div>
                                    <div className="step-header-title">{section.title}</div>
                                    {section.subtitle && <div className="step-header-subtitle">{section.subtitle}</div>}
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        {section.items.map((item) => (
                            <QuestionRenderer
                                key={item.id}
                                item={item}
                                value={responses[item.id]?.main ?? responses[item.id]}
                                onChange={handleChange}
                                screen="J2"
                            />
                        ))}
                    </div>
                ))}

                {/* Partial Completion Notice */}
                {(riskFlags.soft.length > 0 || riskFlags.hard.length > 0) && (
                    <div style={{ marginTop: 'var(--spacing-6)' }}>
                        <AlertBanner
                            type="info"
                            message="Vous pouvez valider même si certains points ne sont pas encore complétés. L'équipe vous contactera pour les éléments manquants."
                        />
                    </div>
                )}

                {/* Submit Button */}
                <button
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%', marginTop: 'var(--spacing-6)' }}
                    onClick={handleSubmit}
                    disabled={saving}
                >
                    {saving ? 'Enregistrement...' : 'Valider mes consignes J-2'}
                </button>
            </div>

            {/* FAB */}
            <button className="fab">
                <Sparkles size={24} />
            </button>
        </div>
    );
}
