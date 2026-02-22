import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { validateToken } from '../services/tokenService';
import { calculateAge, formatDateFR } from '../utils/dateUtils';
import {
    User,
    Calendar,
    Activity,
    FileText,
    TrendingUp,
    Loader,
    AlertCircle,
    LogOut,
    Home
} from 'lucide-react';
import ClinicAppointmentCard from '../components/ClinicAppointmentCard';
import PatientTraceability from '../components/PatientTraceability';

export default function PatientPortal({ patient: initialPatient }) {
    const { token } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(!initialPatient);
    const [error, setError] = useState(null);
    const [patient, setPatient] = useState(initialPatient);
    const [medicalHistory, setMedicalHistory] = useState([]);

    useEffect(() => {
        if (initialPatient) {
            setPatient(initialPatient);
            loadMedicalHistory(initialPatient.id);
        } else {
            loadPatientData();
        }
    }, [initialPatient, token]);

    const loadMedicalHistory = async (patientId) => {
        try {
            const { data: historyData, error: historyError } = await supabase
                .from('medical_history')
                .select('*')
                .eq('patient_id', patientId)
                .order('date', { ascending: false });

            if (!historyError) {
                setMedicalHistory(historyData || []);
            }
        } catch (err) {
            console.error('Error loading history:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadPatientData = async () => {
        setLoading(true);
        setError(null);

        try {
            const validation = await validateToken(token);
            if (!validation.valid) {
                setError(validation.error || 'Lien invalid');
                setLoading(false);
                return;
            }

            const { data: patientData, error: patientError } = await supabase
                .from('patients')
                .select('*')
                .eq('id', validation.patientId)
                .single();

            if (patientError) throw patientError;
            setPatient(patientData);
            loadMedicalHistory(patientData.id);
        } catch (err) {
            console.error('Error loading patient data:', err);
            setError('Erreur lors du chargement de vos données');
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <Loader className="animate-spin" size={48} style={{ margin: '0 auto var(--spacing-4)', color: 'var(--color-primary-500)' }} />
                    <p style={{ color: 'var(--color-gray-600)' }}>Chargement de votre dossier...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
            }}>
                <div className="card" style={{ maxWidth: '500px', textAlign: 'center' }}>
                    <AlertCircle size={64} style={{ margin: '0 auto var(--spacing-4)', color: 'var(--color-danger-500)' }} />
                    <h2 style={{ marginBottom: 'var(--spacing-2)' }}>Accès non autorisé</h2>
                    <p style={{ color: 'var(--color-gray-600)', marginBottom: 'var(--spacing-6)' }}>{error}</p>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)' }}>
                        Si vous pensez qu'il s'agit d'une erreur, veuillez contacter votre praticien.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            padding: 'var(--spacing-6) var(--spacing-4)'
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <div className="card glass-effect" style={{ marginBottom: 'var(--spacing-6)', padding: 'var(--spacing-6)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h1 style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--spacing-2)' }}>
                                Bonjour, {patient?.name?.split(' ')[0] || 'Patient'}
                            </h1>
                            <p style={{ color: 'var(--color-gray-600)' }}>Votre portail de suivi personnalisé</p>
                        </div>
                        <Home size={32} style={{ color: 'var(--color-primary-500)' }} />
                    </div>
                </div>

                {/* Simplified Header Info */}
                <div className="card glass-effect" style={{ marginBottom: 'var(--spacing-6)', padding: 'var(--spacing-6)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: 'var(--color-primary-100)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-primary-600)',
                            fontSize: 'var(--font-size-2xl)',
                            fontWeight: 'var(--font-weight-bold)'
                        }}>
                            {patient?.name?.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                            <h2 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-1)' }}>{patient?.name}</h2>
                            <p style={{ color: 'var(--color-gray-600)' }}>{patient?.operation} • {patient?.date ? formatDateFR(patient.date) : ''}</p>
                        </div>
                    </div>
                </div>

                {/* Single View Content */}
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
                    <ClinicAppointmentCard
                        clinicName={patient.clinic_name}
                        appointmentDatetime={patient.appointment_datetime}
                        operationType={patient.operation}
                        operationCategory={patient.operation_category || 'Ambulatoire'}
                    />

                    <div className="card glass-effect">
                        <div className="card-header">
                            <div className="card-icon card-icon-primary">
                                <FileText size={20} />
                            </div>
                            <h3>Votre Parcours de Soins</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                            {[
                                { to: `j7`, emoji: '📋', label: 'Questionnaire J-7', desc: 'Préparation administrative (anesthésie, accompagnant)' },
                                { to: `j3`, emoji: '✂️', label: 'Questionnaire J-3', desc: 'Préparation épilation et vérification infections' },
                                { to: `j2`, emoji: '📄', label: 'Questionnaire J-2', desc: 'Documents, jeûne et consignes du jour J' },
                                { to: `j1-preop`, emoji: '🚿', label: 'Questionnaire J-1', desc: 'Hygiène, traitements et préparation de la veille' },
                                { to: `j0`, emoji: '🏥', label: 'Questionnaire J-0', desc: 'Vérifications finales le jour de l\'intervention' },
                                { to: `j1`, emoji: '🌡️', label: 'Suivi J+1', desc: 'Bilan post-opératoire du lendemain' },
                                { to: `j2-sat`, emoji: '⭐', label: 'Satisfaction J+2', desc: 'Votre avis sur votre prise en charge', disabled: true },
                            ].map(step => (
                                step.disabled ? (
                                    <div
                                        key={step.to}
                                        className="card glass-effect"
                                        style={{ textDecoration: 'none', display: 'block', border: '1px solid var(--color-gray-100)', opacity: 0.5, cursor: 'default' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
                                            <div style={{ fontSize: '32px' }}>{step.emoji}</div>
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ marginBottom: '4px' }}>{step.label}</h4>
                                                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>{step.desc}</p>
                                            </div>
                                            <div className="badge" style={{ background: 'var(--color-gray-200)', color: 'var(--color-gray-500)' }}>Bientôt</div>
                                        </div>
                                    </div>
                                ) : (
                                    <Link
                                        key={step.to}
                                        to={`/patient-portal/${token}/${step.to}`}
                                        className="card glass-effect"
                                        style={{ textDecoration: 'none', display: 'block', transition: 'transform 0.2s', cursor: 'pointer', border: '1px solid var(--color-primary-100)' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
                                            <div style={{ fontSize: '32px' }}>{step.emoji}</div>
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ marginBottom: '4px' }}>{step.label}</h4>
                                                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>{step.desc}</p>
                                            </div>
                                            <div className="badge badge-primary">Ouvrir</div>
                                        </div>
                                    </Link>
                                )
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
