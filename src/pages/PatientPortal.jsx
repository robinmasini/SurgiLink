import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { validateToken } from '../services/tokenService';
import { getDocuments, downloadDocument } from '../services/documentService';
import { getCustomQuestions, answerCustomQuestion } from '../services/customQuestionService';
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
import DoctolibButton from '../components/pathway/DoctolibButton';
import { HelpCircle, Send, RefreshCw, Download } from 'lucide-react';
import { generateSynthesisPDF } from '../services/pdfService';
import PatientSynthesisReport from '../components/PatientSynthesisReport';

export default function PatientPortal({ patient: initialPatient }) {
    const { token } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(!initialPatient);
    const [error, setError] = useState(null);
    const [patient, setPatient] = useState(initialPatient);
    const [medicalHistory, setMedicalHistory] = useState([]);
    const [responses, setResponses] = useState({});
    const [clinicalResponses, setClinicalResponses] = useState({
        J7: {}, J2: {}, J1_PreOp: {}, J1: {}, J4_Satisfaction: {}
    });
    const [responsesMeta, setResponsesMeta] = useState({});
    const [documents, setDocuments] = useState([]);
    const [customQuestions, setCustomQuestions] = useState([]);
    const [answeringQuestionId, setAnsweringQuestionId] = useState(null);
    const [smsData, setSmsData] = useState([]);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const reportRef = useRef(null);

    useEffect(() => {
        if (initialPatient) {
            setPatient(initialPatient);
            loadMedicalHistory(initialPatient.id);
            loadDocuments(initialPatient.id);
            loadCustomQuestions(initialPatient.id);
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
            // Load SMS logs for PDF
            const { data: smsLogs, error: smsError } = await supabase
                .from('sms_logs')
                .select('*')
                .eq('patient_id', patientId)
                .order('sent_at', { ascending: false });

            if (!smsError) {
                setSmsData(smsLogs || []);
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
                .select('screen, item_id, response, updated_at, user_id')
                .eq('patient_id', patientId);

            if (!error && data) {
                // Flat map for portal UI (badge logic, etc.)
                const aggregated = {};
                // Nested map for PDF report (grouped by screen)
                const nested = {
                    J7: {},
                    J2: {},
                    J1_PreOp: {},
                    J1: {},
                    J4_Satisfaction: {}
                };
                // Meta map for PDF timestamps
                const meta = {};
                data.forEach(row => {
                    aggregated[row.item_id] = row.response?.value;
                    if (row.screen && nested[row.screen] !== undefined) {
                        nested[row.screen][row.item_id] = row.response?.value;
                        if (!meta[row.screen]) meta[row.screen] = {};
                        meta[row.screen][row.item_id] = {
                            updated_at: row.updated_at,
                            user_id: row.user_id
                        };
                    }
                });
                setResponses(aggregated);
                setClinicalResponses(nested);
                setResponsesMeta(meta);
            }
        } catch (err) {
            console.error('Error loading responses:', err);
        }
    };

    const loadDocuments = async (patientId) => {
        // ... (existing code)
    };

    const loadCustomQuestions = async (patientId) => {
        try {
            const questions = await getCustomQuestions(patientId);
            setCustomQuestions(questions);
        } catch (err) {
            console.error('Error loading custom questions:', err);
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

    const handleDownloadSynthesis = async () => {
        setIsGeneratingPDF(true);
        try {
            const fileName = `Ma_Synthese_${patient.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
            await generateSynthesisPDF(reportRef.current, fileName);
        } catch (err) {
            console.error('Error during PDF generation:', err);
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const handleAnswerCustomQuestion = async (questionId, response) => {
        if (!response.trim()) return;
        setAnsweringQuestionId(questionId);
        try {
            const res = await answerCustomQuestion(questionId, response);
            if (res.success) {
                // Refresh local questions state
                setCustomQuestions(prev => prev.map(q => q.id === questionId ? { ...q, response, answered_at: new Date().toISOString() } : q));
            } else {
                alert(`Erreur: ${res.error}`);
            }
        } finally {
            setAnsweringQuestionId(null);
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
                        stayType={patient.stay_type}
                        operation={patient.operation}
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
                        progress={Math.min(100, patient?.progress || (responses ? Math.round((Object.keys(responses).length / 20) * 100) : 0))}
                        status={patient?.status}
                        statusLabel="Protocole en cours d'exécution"
                    />
                </div>

                {/* Doctolib Integration */}
                <div style={{ marginBottom: 'var(--spacing-8)' }}>
                    <DoctolibButton />
                </div>

                {/* Care Pathway Section */}
                <div className="card" style={{
                    background: 'rgba(232, 240, 254, 0.4)',
                    padding: 'var(--spacing-6)',
                    borderRadius: '32px',
                    border: '1px solid rgba(255, 255, 255, 0.5)'
                }}>
                    {/* Custom Questions Section */}
                    {customQuestions.filter(q => !q.response).length > 0 && (
                        <div style={{ marginBottom: 'var(--spacing-6)' }}>
                            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary-600)', textTransform: 'uppercase', marginBottom: 'var(--spacing-4)', letterSpacing: '0.05em' }}>
                                Question(s) spécifique(s) pour vous
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {customQuestions.filter(q => !q.response).map(q => (
                                    <div key={q.id} className="card glass-effect" style={{ padding: 'var(--spacing-4)', background: 'rgba(255,255,255,0.8)', borderLeft: '4px solid var(--color-primary-500)' }}>
                                        <div style={{ fontSize: '15px', color: 'var(--color-gray-900)', fontWeight: '600', marginBottom: '12px' }}>
                                            {q.question_text}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input
                                                type="text"
                                                className="input"
                                                placeholder="Votre réponse ici..."
                                                style={{ flex: 1, fontSize: '14px', height: '40px', background: 'white' }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleAnswerCustomQuestion(q.id, e.target.value);
                                                }}
                                            />
                                            <button
                                                className="btn btn-primary"
                                                style={{ padding: '0 16px', height: '40px', background: 'var(--color-primary-600)' }}
                                                disabled={answeringQuestionId === q.id}
                                                onClick={(e) => {
                                                    const input = e.currentTarget.previousSibling;
                                                    handleAnswerCustomQuestion(q.id, input.value);
                                                }}
                                            >
                                                {answeringQuestionId === q.id ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.5)', margin: '24px 0' }}></div>
                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-6)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: '#FFF3E0', padding: '8px', borderRadius: '10px', color: '#E65100' }}>
                                <FileText size={20} />
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1A1A1A' }}>Votre Parcours de Soins</h3>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                                onClick={handleDownloadSynthesis}
                                disabled={isGeneratingPDF}
                                className="btn btn-secondary btn-sm"
                                style={{
                                    padding: '6px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: 'rgba(255,255,255,0.8)',
                                    borderRadius: '12px'
                                }}
                            >
                                {isGeneratingPDF ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                                <span style={{ fontSize: '12px', fontWeight: '600' }}>Synthèse PDF</span>
                            </button>
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
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                        {[
                            { to: `j7`, emoji: '📋', label: 'Questionnaire J-7', desc: 'Préparation administrative (anesthésie, accompagnant)' },
                            { to: `j2`, emoji: '📄', label: 'Questionnaire J-2', desc: 'Documents, jeûne et consignes du jour J' },
                            { to: `j1-preop`, emoji: '🚿', label: 'Confirmation J-1', desc: 'Dernière vérification avant votre venue' },
                            { to: `j1`, emoji: '🌡️', label: 'Suivi J+1', desc: 'Bilan post-opératoire du lendemain' },
                            { to: `j4`, emoji: '⭐', label: 'Satisfaction J+4', desc: 'Votre avis sur votre prise en charge' },
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

                                        {/* Dynamic Requisition Badge */}
                                        {(() => {
                                            // Get numeric days for accurate comparison
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            const surgeryDate = patient.date ? new Date(patient.date) : null;
                                            if (surgeryDate) surgeryDate.setHours(0, 0, 0, 0);

                                            const diffDays = surgeryDate ? Math.ceil((surgeryDate - today) / (1000 * 60 * 60 * 24)) : 999;
                                            let isRequired = false;

                                            if (step.to === 'j7' && diffDays <= 7 && !responses['anesthesia_consultation']) isRequired = true;
                                            if (step.to === 'j2' && diffDays <= 2 && !responses['fasting_understood']) isRequired = true;
                                            if (step.to === 'j1-preop' && diffDays <= 1 && !responses['admission_confirmed']) isRequired = true;

                                            if (!isRequired) return null;

                                            return (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginRight: 'var(--spacing-4)' }}>
                                                    <div style={{ color: '#FF1744' }}><AlertCircle size={24} /></div>
                                                    <div style={{
                                                        background: '#FFEBEE',
                                                        color: '#FF1744',
                                                        padding: '4px 12px',
                                                        borderRadius: '8px',
                                                        fontSize: '11px',
                                                        fontWeight: '800',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        Requis
                                                    </div>
                                                </div>
                                            );
                                        })()}

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

            {/* Hidden Report for PDF Generation */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <div ref={reportRef}>
                    <PatientSynthesisReport
                        patient={patient}
                        clinicalResponses={clinicalResponses}
                        responsesMeta={responsesMeta}
                        smsData={smsData}
                        medicalHistory={medicalHistory}
                        documents={documents}
                        customQuestions={customQuestions}
                    />
                </div>
            </div>
        </div>
    );
}
