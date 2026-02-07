import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LogOut, Clock, Sparkles, Scissors } from 'lucide-react';
import { pathwayConfig } from '../config/pathway.config';
import { saveResponse, getResponses, markScreenCompleted, calculateRiskFlags } from '../services/pathwayService';
import { scheduleStateBasedReminders } from '../services/reminderService';
import QuestionRenderer from '../components/pathway/QuestionRenderer';
import AlertBanner from '../components/pathway/AlertBanner';

export default function PatientJ7() {
    const navigate = useNavigate();
    const { patientId } = useParams();
    const [responses, setResponses] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [riskFlags, setRiskFlags] = useState({ soft: [], hard: [] });

    const config = pathwayConfig.J7;

    useEffect(() => {
        loadResponses();
    }, [patientId]);

    useEffect(() => {
        // Calculate risk flags whenever responses change
        const flags = calculateRiskFlagsSync();
        setRiskFlags(flags);
    }, [responses]);

    const loadResponses = async () => {
        if (!patientId) return;
        setLoading(true);
        const data = await getResponses(parseInt(patientId), 'J7');
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
        // Update local state
        setResponses(prev => ({ ...prev, [itemId]: value }));

        // Save to database
        if (patientId) {
            await saveResponse(parseInt(patientId), 'J7', itemId, value, false);
        }
    };

    const handleSubmit = async () => {
        setSaving(true);

        if (patientId) {
            // Mark screen as completed
            await markScreenCompleted(parseInt(patientId), 'J7');

            // Schedule state-based reminders for incomplete items
            await scheduleStateBasedReminders(parseInt(patientId), 'J7');
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
                    <h2>Bonjour Patient</h2>
                    <span>J-7 • Intervention programmée</span>
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
                    onClick={() => navigate('/login')}
                >
                    <LogOut size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="patient-content fade-in">
                {/* Time Alert */}
                <AlertBanner
                    type="info"
                    title="Arrivée prévue à 07:30"
                    message="Rendez-vous à l'accueil principal. Prévoyez d'arriver 15 min avant. À apporter : pièce d'identité + documents."
                />

                {/* Risk Alerts */}
                {riskFlags.hard.length > 0 && (
                    <div style={{ marginTop: 'var(--spacing-4)' }}>
                        <AlertBanner
                            type="danger"
                            title="⚠️ Attention requise"
                            message={`${riskFlags.hard.length} point(s) critique(s) nécessitent une action immédiate : ${riskFlags.hard.map(f => f.label).join(', ')}`}
                        />
                    </div>
                )}

                {riskFlags.soft.length > 0 && (
                    <div style={{ marginTop: 'var(--spacing-4)' }}>
                        <AlertBanner
                            type="warning"
                            title="À vérifier"
                            message={`${riskFlags.soft.length} point(s) à compléter ou vérifier.`}
                        />
                    </div>
                )}

                {/* Sections */}
                {config.sections.map((section) => (
                    <div key={section.id}>
                        {/* Section Header */}
                        <div className="step-section" style={{ marginTop: 'var(--spacing-6)' }}>
                            <div className="step-header">
                                <span className="step-header-icon">
                                    {typeof section.icon === 'string' ? section.icon : <Scissors size={18} />}
                                </span>
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
                                screen="J7"
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
                    {saving ? 'Enregistrement...' : 'Valider et Envoyer mon dossier'}
                </button>
            </div>

            {/* FAB */}
            <button className="fab">
                <Sparkles size={24} />
            </button>
        </div>
    );
}
