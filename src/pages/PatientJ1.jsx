import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LogOut, Sparkles, AlertCircle } from 'lucide-react';
import { pathwayConfig } from '../config/pathway.config';
import { saveResponse, getResponses, markScreenCompleted } from '../services/pathwayService';
import QuestionRenderer from '../components/pathway/QuestionRenderer';
import AlertBanner from '../components/pathway/AlertBanner';
import CompactAppointmentCard from '../components/CompactAppointmentCard';

import { usePatientId } from '../hooks/usePatientId';
import { supabase } from '../lib/supabase';
import { calculateDaysUntilSurgery } from '../utils/dateUtils';

export default function PatientJ1({ patient: propPatient, token: propToken }) {
    const navigate = useNavigate();
    const { token: urlToken } = useParams();
    const token = propToken || urlToken;
    const { patientId: hookPatientId, loading: hookLoading, error: hookError, isTokenMode: hookIsTokenMode } = usePatientId();
    // Resolve patient ID and mode from either props or hook
    const resolvedPatientId = propPatient?.id || hookPatientId;
    const patientIdError = !propPatient && hookError;
    const loadingPatientId = !propPatient && hookLoading;
    const isTokenMode = propPatient ? true : hookIsTokenMode;

    const [responses, setResponses] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [patient, setPatient] = useState(propPatient || null);
    const [alerts, setAlerts] = useState({ soft: [], hard: [] });

    const config = pathwayConfig.J1;

    useEffect(() => {
        if (resolvedPatientId) {
            loadResponses();
            if (!propPatient) loadPatientData();
        }
    }, [resolvedPatientId]);

    useEffect(() => {
        calculateAlerts();
    }, [responses]);

    const loadPatientData = async () => {
        const { data } = await supabase.from('patients').select('*').eq('id', resolvedPatientId).single();
        if (data) setPatient(data);
    };

    const loadResponses = async () => {
        if (!resolvedPatientId) return;
        setLoading(true);
        const data = await getResponses(resolvedPatientId, 'J1');
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

        if (resolvedPatientId) {
            await saveResponse(resolvedPatientId, 'J1', itemId, value, false);
        }
    };

    const handleSubmit = async () => {
        setSaving(true);

        if (resolvedPatientId) {
            await markScreenCompleted(resolvedPatientId, 'J1');
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
                <h2 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-1)' }}>Suivi Post-opératoire</h2>
                <div style={{ color: 'var(--color-primary-600)', fontWeight: 'var(--font-weight-semibold)' }}>Premier jour (J+1)</div>
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
                    {saving ? 'Enregistrement...' : 'Valider mon suivi J+1'}
                </button>
            </div>

            {/* FAB */}
            <button className="fab">
                <Sparkles size={24} />
            </button>
        </div>
    );
}
