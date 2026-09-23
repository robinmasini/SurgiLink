import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LogOut, AlertCircle } from 'lucide-react';
import { pathwayConfig } from '../config/pathway.config';
import { saveResponse, getResponses, markScreenCompleted } from '../services/pathwayService';
import QuestionRenderer from '../components/pathway/QuestionRenderer';
import QuestionnaireFlow from '../components/pathway/QuestionnaireFlow';
import AlertBanner from '../components/pathway/AlertBanner';
import CompactAppointmentCard from '../components/CompactAppointmentCard';

import { usePatientId } from '../hooks/usePatientId';
import { cleanPatientId } from '../services/tokenService';
import { supabase } from '../lib/supabase';
import { calculateDaysUntilSurgery, isMilestoneDue } from '../utils/dateUtils';
import { useTranslation } from 'react-i18next';

export default function PatientJ1({ patient: propPatient, token: propToken }) {
    const { t } = useTranslation();
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

    useEffect(() => {
        calculateAlerts();
    }, [responses]);

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
            if (rule.condition === 'yes' && (response === true || response === 'Oui' || response === 'oui')) flagged = true;
            if (rule.condition === 'no' && (response === false || response === 'Non' || response === 'non')) flagged = true;
            if (rule.condition === 'gte_8') {
                const num = Number(response);
                if (!isNaN(num) && num >= 8) flagged = true;
            }

            if (flagged) {
                if (rule.type === 'hard') {
                    hardAlerts.push({
                        itemId: item.id,
                        label: item.label,
                        action: item.action || 'Consulter un médecin immédiatement ou composer le 15 / 112'
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

    if (loading) {
        return (
            <div className="patient-view" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div>{t('Chargement...')}</div>
            </div>
        );
    }

    return (
        <div className="patient-view">
            {/* Header */}
            <div className="patient-header" style={{ padding: 'var(--spacing-6) var(--spacing-4)', textAlign: 'center', display: 'block' }}>
                <h2 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-1)' }}>{t('Suivi Post-opératoire')}</h2>
                <div style={{ color: 'var(--color-primary-600)', fontWeight: 'var(--font-weight-semibold)' }}>{t('Premier jour (J+1)')}</div>
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

                {/* Message J+1 Banner */}
                <div style={{
                    background: 'white',
                    padding: 'var(--spacing-4) var(--spacing-5)',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--color-primary-100)',
                    boxShadow: 'var(--shadow-sm)',
                    marginBottom: 'var(--spacing-6)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: '800', color: 'var(--color-primary-600)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                        Message J+1 au patient
                    </div>
                    <div style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-gray-800)', fontWeight: '600' }}>
                        {t(config.intro_text || 'Bonjour, avant notre appel, pouvez-vous répondre à ces questions ?')}
                    </div>
                </div>

                {/* Hard Alerts - CRITICAL */}
                {alerts.hard.length > 0 && (
                    <div style={{ marginBottom: 'var(--spacing-4)' }}>
                        {alerts.hard.map((alert, index) => (
                            <div key={index} style={{ marginBottom: 'var(--spacing-4)' }}>
                                <AlertBanner
                                    type="danger"
                                    title={`🚨 ALERTE: ${t(alert.label)}`}
                                    message={t(alert.action)}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Questionnaire Flow */}
                <QuestionnaireFlow
                    config={config}
                    responses={responses}
                    onChange={handleChange}
                    onComplete={handleSubmit}
                    saving={saving}
                    screen="J1"
                    patientId={resolvedPatientId}
                />

                {/* Bottom Emergency Banner */}
                <div style={{
                    marginTop: 'var(--spacing-6)',
                    padding: 'var(--spacing-4) var(--spacing-5)',
                    borderRadius: 'var(--radius-xl)',
                    background: '#FFF5F5',
                    border: '1px solid #FED7D7',
                    color: '#9B2C2C',
                    fontSize: 'var(--font-size-sm)',
                    lineHeight: '1.5',
                    textAlign: 'center'
                }}>
                    L’infirmier vous appellera dans tous les cas. <strong>En cas d’essoufflement, de douleur thoracique ou de malaise, appelez immédiatement le 15 ou le 112</strong>
                </div>

                {/* Soft Alerts */}
                {alerts.soft.length > 0 && (
                    <div style={{ marginTop: 'var(--spacing-6)' }}>
                        <AlertBanner
                            type="warning"
                            title={t("Points d'attention")}
                            message={`${alerts.soft.length} ${t('élément(s) nécessitent un suivi')} : ${alerts.soft.map(a => t(a.label)).join(', ')}`}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
