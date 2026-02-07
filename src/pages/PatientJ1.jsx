import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LogOut, Sparkles } from 'lucide-react';
import { pathwayConfig } from '../config/pathway.config';
import { saveResponse, getResponses, markScreenCompleted } from '../services/pathwayService';
import QuestionRenderer from '../components/pathway/QuestionRenderer';
import AlertBanner from '../components/pathway/AlertBanner';

export default function PatientJ1() {
    const navigate = useNavigate();
    const { patientId } = useParams();
    const [responses, setResponses] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alerts, setAlerts] = useState({ soft: [], hard: [] });

    const config = pathwayConfig.J1;

    useEffect(() => {
        loadResponses();
    }, [patientId]);

    useEffect(() => {
        calculateAlerts();
    }, [responses]);

    const loadResponses = async () => {
        if (!patientId) return;
        setLoading(true);
        const data = await getResponses(parseInt(patientId), 'J1');
        setResponses(data);
        setLoading(false);
    };

    const calculateAlerts = () => {
        const items = config.sections.flatMap(s => s.items);
        const hardAlerts = [];
        const softAlerts = [];

        items.forEach(item => {
            if (!item.risk_flag_rule) return;

            const response = responses[item.id]?.main ?? responses[item.id];
            const rule = item.risk_flag_rule;

            let flagged = false;
            if (rule.condition === 'yes' && response === true) flagged = true;
            if (rule.condition === 'no' && response === false) flagged = true;

            if (flagged) {
                if (rule.type === 'hard') {
                    hardAlerts.push({
                        itemId: item.id,
                        label: item.label,
                        action: item.action || 'Consulter un médecin immédiatement'
                    });
                } else {
                    softAlerts.push({
                        itemId: item.id,
                        label: item.label
                    });
                }
            }
        });

        setAlerts({ hard: hardAlerts, soft: softAlerts });
    };

    const handleChange = async (itemId, value) => {
        setResponses(prev => ({ ...prev, [itemId]: value }));

        if (patientId) {
            await saveResponse(parseInt(patientId), 'J1', itemId, value, false);
        }
    };

    const handleSubmit = async () => {
        setSaving(true);

        if (patientId) {
            await markScreenCompleted(parseInt(patientId), 'J1');
        }

        setSaving(false);
        navigate('/patient/success');
    };

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
            <div className="patient-header">
                <div className="patient-header-left">
                    <h2>Appel Post-opératoire</h2>
                    <span>J+1 • Suivi Patient</span>
                </div>
                <button
                    style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--color-gray-500)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px'
                    }}
                    onClick={() => navigate('/dashboard')}
                >
                    <LogOut size={20} />
                </button>
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

                {/* Hard Alerts - CRITICAL */}
                {alerts.hard.length > 0 && (
                    <div style={{ marginBottom: 'var(--spacing-6)' }}>
                        {alerts.hard.map((alert, index) => (
                            <div key={index} style={{ marginBottom: 'var(--spacing-4)' }}>
                                <AlertBanner
                                    type="danger"
                                    title={`🚨 ALERTE: ${alert.label}`}
                                    message={alert.action}
                                    actions={[
                                        {
                                            label: 'Appeler le Patient',
                                            onClick: () => console.log('Call patient'),
                                            style: { background: 'var(--color-danger-600)', color: 'white' }
                                        },
                                        {
                                            label: 'Avis Médecin',
                                            onClick: () => console.log('Request medical opinion')
                                        }
                                    ]}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Soft Alerts */}
                {alerts.soft.length > 0 && (
                    <div style={{ marginBottom: 'var(--spacing-6)' }}>
                        <AlertBanner
                            type="warning"
                            title="Points d'attention"
                            message={`${alerts.soft.length} élément(s) nécessitent un suivi : ${alerts.soft.map(a => a.label).join(', ')}`}
                        />
                    </div>
                )}

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
                                screen="J1"
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
                    {saving ? 'Enregistrement...' : 'Valider l\'appel post-opératoire'}
                </button>
            </div>

            {/* FAB */}
            <button className="fab">
                <Sparkles size={24} />
            </button>
        </div>
    );
}
