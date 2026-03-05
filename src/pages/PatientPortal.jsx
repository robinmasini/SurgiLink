import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { validateToken } from '../services/tokenService';
import { getDocuments, downloadDocument } from '../services/documentService';
import { calculateAge, formatDateFR, calculateDaysUntilSurgery } from '../utils/dateUtils';
import {
    User,
    Calendar,
    Activity,
    FileText,
    TrendingUp,
    Loader,
    AlertCircle,
    LogOut,
    Home,
    Zap,
    Clock,
    ChevronRight
} from 'lucide-react';
import ClinicAppointmentCard from '../components/ClinicAppointmentCard';
import CompactAppointmentCard from '../components/CompactAppointmentCard';
import ProtocolStatus from '../components/ProtocolStatus';
import PatientTraceability from '../components/PatientTraceability';

export default function PatientPortal({ patient: initialPatient }) {
    const { token } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(!initialPatient);
    const [error, setError] = useState(null);
    const [patient, setPatient] = useState(initialPatient);
    const [medicalHistory, setMedicalHistory] = useState([]);
    const [responses, setResponses] = useState({});
    const [documents, setDocuments] = useState([]);

    useEffect(() => {
        if (initialPatient) {
            setPatient(initialPatient);
            loadMedicalHistory(initialPatient.id);
            loadDocuments(initialPatient.id);
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
            loadPatientResponses(patientId);
        } catch (err) {
            console.error('Error loading history:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadPatientResponses = async (patientId) => {
        try {
            const { data, error } = await supabase
                .from('pathway_responses')
                .select('responses')
                .eq('patient_id', patientId)
                .single();

            if (!error && data) {
                setResponses(data.responses || {});
            }
        } catch (err) {
            console.error('Error loading responses:', err);
        }
    };

    const loadDocuments = async (patientId) => {
        try {
            const { data, error } = await supabase
                .from('patient_documents')
                .select('*')
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Fetch error:', error);
                setDocuments([]);
                return;
            }

            setDocuments(data || []);
        } catch (err) {
            console.error('Error loading documents:', err);
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
            loadDocuments(patientData.id);

            // Update last_consulted_at proof
            const { error: trackError } = await supabase
                .from('patients')
                .update({ last_consulted_at: new Date().toISOString() })
                .eq('id', patientData.id);

            if (trackError) console.error('Consultation tracking error:', trackError);
            else console.log('Consultation tracked successfully');

        } catch (err) {
            console.error('Error loading patient data:', err);
            setError('Erreur lors du chargement de vos données');
            setLoading(false);
        }
    };

    const handleDownloadPrescription = async () => {
        if (documents.length === 0) return;

        // Take the first/latest document as the prescription
        const prescription = documents[0];
        await downloadDocument(prescription.storage_path, prescription.name);
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

    if (!patient) {
        return (
            <div className="patient-view" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 'var(--spacing-4)' }}>
                <div className="card" style={{ maxWidth: '400px', textAlign: 'center' }}>
                    <AlertCircle size={48} style={{ color: 'var(--color-danger-500)', marginBottom: 'var(--spacing-4)' }} />
                    <h2 style={{ marginBottom: 'var(--spacing-2)' }}>Accès non autorisé</h2>
                    <p style={{ color: 'var(--color-gray-600)' }}>
                        Impossible de charger les données de votre dossier. Veuillez contacter votre établissement de soins.
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
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                {/* Header Greeting */}
                <div style={{ marginBottom: 'var(--spacing-8)' }}>
                    <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: 'var(--spacing-1)', color: '#1A1A1A' }}>
                        Bonjour, {patient?.name || 'Patient'}
                    </h1>
                    <p style={{ color: '#666', fontSize: '16px', fontWeight: '500' }}>Votre portail de suivi personnalisé</p>
                </div>

                {/* Main Info Glass Container */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.4)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '32px',
                    padding: 'var(--spacing-6)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    marginBottom: 'var(--spacing-8)',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.02)'
                }}>
                    {/* Top Pills Row */}
                    <CompactAppointmentCard
                        variant="pill"
                        appointmentDate={patient.date}
                        appointmentTime={patient.surgery_time}
                        jValue={calculateDaysUntilSurgery(patient.date)}
                        hasPrescription={documents.length > 0}
                        onDownloadPrescription={handleDownloadPrescription}
                    />

                    {/* Clinic Card Row */}
                    <CompactAppointmentCard
                        variant="card"
                        clinicName={patient.clinic_name || 'Clinique de Vitrolles'}
                        appointmentDate={patient.date}
                        appointmentTime={patient.surgery_time}
                    />

                    {/* Protocol Status Row */}
                    <ProtocolStatus
                        progress={patient?.progress || (responses ? Math.round((Object.keys(responses).length / 7) * 100) : 0)}
                        statusLabel="Protocole en cours d'exécution"
                    />
                </div>

                {/* Care Pathway Section */}
                <div className="card" style={{
                    background: 'rgba(232, 240, 254, 0.4)',
                    padding: 'var(--spacing-6)',
                    borderRadius: '32px',
                    border: '1px solid rgba(255, 255, 255, 0.5)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-6)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: '#FFF3E0', padding: '8px', borderRadius: '10px', color: '#E65100' }}>
                                <FileText size={20} />
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1A1A1A' }}>Votre Parcours de Soins</h3>
                        </div>
                        <div style={{
                            background: '#37474F',
                            color: 'white',
                            padding: '6px 16px',
                            borderRadius: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px',
                            fontWeight: '700'
                        }}>
                            <Zap size={14} fill="currentColor" />
                            {calculateDaysUntilSurgery(patient.date)}
                        </div>
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
                                    className="card"
                                    style={{
                                        textDecoration: 'none',
                                        display: 'block',
                                        transition: 'transform 0.2s',
                                        cursor: 'pointer',
                                        background: 'white',
                                        borderRadius: '20px',
                                        padding: 'var(--spacing-4) var(--spacing-6)',
                                        border: 'none',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
                                        <div style={{ fontSize: '32px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {step.emoji}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ marginBottom: '2px', fontWeight: '700', color: '#1A1A1A' }}>{step.label}</h4>
                                            <p style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>{step.desc}</p>
                                        </div>

                                        {step.to === 'j7' && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginRight: 'var(--spacing-4)' }}>
                                                <div style={{ color: '#FBC02D' }}><AlertCircle size={24} /></div>
                                                <div style={{
                                                    background: '#FFEBEE',
                                                    color: '#D32F2F',
                                                    padding: '4px 12px',
                                                    borderRadius: '8px',
                                                    fontSize: '11px',
                                                    fontWeight: '800',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    Requis
                                                </div>
                                            </div>
                                        )}

                                        <div style={{
                                            color: '#BDBDBD',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            Ouvrir
                                            <ChevronRight size={16} />
                                        </div>
                                    </div>
                                </Link>
                            )
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
