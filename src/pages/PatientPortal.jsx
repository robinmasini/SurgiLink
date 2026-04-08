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
    ChevronRight,
    Phone,
    Lock,
    CheckCircle2,
    ShieldCheck
} from 'lucide-react';
import ClinicAppointmentCard from '../components/ClinicAppointmentCard';
import CompactAppointmentCard from '../components/CompactAppointmentCard';
import ProtocolStatus from '../components/ProtocolStatus';
import PatientTraceability from '../components/PatientTraceability';

import { HelpCircle, Send, RefreshCw, Download } from 'lucide-react';
import { generateSynthesisPDF } from '../services/pdfService';
import PatientSynthesisReport from '../components/PatientSynthesisReport';
import { useTranslation } from 'react-i18next';

function ConsignesSection() {
    const { t } = useTranslation();
    const [acknowledged, setAcknowledged] = useState(() => {
        return localStorage.getItem('consignes_acknowledged') === 'true';
    });

    const handleAcknowledge = () => {
        localStorage.setItem('consignes_acknowledged', 'true');
        setAcknowledged(true);
    };

    const consignes = [
        {
            icon: '🍽️',
            text: t('Vous devez être à jeun 3 heures avant votre examen (ni boire, ni manger, ni fumer).')
        },
        {
            icon: '🩸',
            text: t('Un bilan sanguin avec dosage de la créatinine (de moins de 3 mois) est demandé à tous les patients qui présentent : une hyper tension, une pathologie rénale, un diabète de type II (quelque soit l’âge du patient).')
        }
    ];

    return (
        <div style={{
            background: acknowledged ? '#f0fdf4' : '#f5f3ff',
            borderRadius: '24px',
            marginBottom: '16px',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            border: acknowledged ? '2px solid #bbf7d0' : '2px solid var(--color-primary-200)'
        }}>
            {/* Header */}
            <div style={{
                background: acknowledged
                    ? 'linear-gradient(135deg, #059669, #10b981)'
                    : 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-800))',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            }}>
                <ShieldCheck size={20} style={{ color: 'white', flexShrink: 0 }} />
                <div style={{ fontSize: '14px', fontWeight: '800', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {t('Consignes pré-opératoires')}
                </div>
                {acknowledged && (
                    <div style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '11px', fontWeight: '700', padding: '4px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(255,255,255,0.3)' }}>
                        <CheckCircle2 size={12} /> {t('Lu et compris')}
                    </div>
                )}
            </div>

            {/* Instructions */}
            <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                    {consignes.map((c, i) => (
                        <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                            <div style={{ fontSize: '24px', flexShrink: 0 }}>{c.icon}</div>
                            <p style={{ fontSize: '15px', color: '#1f2937', lineHeight: 1.6, fontWeight: '500', margin: 0 }}>{c.text}</p>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                {!acknowledged ? (
                    <button
                        onClick={handleAcknowledge}
                        style={{
                            width: '100%',
                            padding: '16px 20px',
                            borderRadius: '16px',
                            background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-800))',
                            color: 'white',
                            border: '2px solid rgba(255,255,255,0.2)',
                            fontWeight: '800',
                            fontSize: '16px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            boxShadow: '0 10px 20px rgba(124, 58, 237, 0.3)',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 12px 24px rgba(124, 58, 237, 0.4)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 10px 20px rgba(124, 58, 237, 0.3)';
                        }}
                    >
                        <CheckCircle2 size={20} />
                        {t("J'affirme avoir lu et compris les consignes")}
                    </button>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: '#d1fae5', borderRadius: '14px', border: '1px solid #10b981' }}>
                        <CheckCircle2 size={24} style={{ color: '#059669' }} />
                        <span style={{ fontSize: '15px', fontWeight: '700', color: '#064e3b' }}>{t('Vous avez confirmé avoir lu les consignes')}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function PatientPortal({ patient: initialPatient }) {
    const { t } = useTranslation();
    const { token } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(!initialPatient);
    const [error, setError] = useState(null);
    const [patient, setPatient] = useState(initialPatient);
    const [medicalHistory, setMedicalHistory] = useState([]);
    const [responses, setResponses] = useState({});
    const [clinicalResponses, setClinicalResponses] = useState({
        J7: {}, J2: {}, J1_PreOp: {}, J1: {}, J4_Satisfaction: {}, ESATIS: {}
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
                    J4_Satisfaction: {},
                    ESATIS: {}
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
        try {
            const docs = await getDocuments(patientId);
            setDocuments(docs || []);
        } catch (err) {
            console.error('Error loading documents:', err);
        }
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
                background: 'white'
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
                background: 'white'
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
            background: 'var(--color-primary-50)',
            padding: 'var(--spacing-8) var(--spacing-4)'
        }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                {/* Header Greeting */}
                <div style={{ marginBottom: 'var(--spacing-10)', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '36px', fontWeight: '900', marginBottom: 'var(--spacing-2)', color: 'var(--color-gray-900)', letterSpacing: '-0.02em' }}>
                        {t('Bonjour,')} {patient?.name || 'Patient'}
                    </h1>
                    <p style={{ color: 'var(--color-gray-500)', fontSize: '18px', fontWeight: '500' }}>{t('Votre portail de suivi personnalisé SurgiLink')}</p>
                </div>

                {/* Main Info Glass Container */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.4)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '32px',
                    padding: 'var(--spacing-6)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    marginBottom: 'var(--spacing-4)',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.02)'
                }}>
                    {/* Primary Call Action - Moved to TOP as requested */}
                    <div style={{ marginBottom: 'var(--spacing-6)' }}>
                        <a href={`tel:${patient.clinic_phone || '0491159019'}`} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                            padding: '16px 24px', borderRadius: '18px', 
                            background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-800))',
                            color: 'white', fontWeight: '800', fontSize: '16px', textDecoration: 'none',
                            boxShadow: '0 8px 16px rgba(124, 58, 237, 0.2)',
                            transition: 'transform 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                            <Phone size={20} fill="white" /> {t('Appeler la clinique')}
                        </a>
                    </div>

                    {/* Appointment info - full width */}
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

                    {/* Protocol Status - Full width now */}
                    <div style={{ marginTop: 'var(--spacing-4)' }}>
                        <ProtocolStatus
                            progress={Math.min(100, patient?.progress || (responses ? Math.round((Object.keys(responses).length / 20) * 100) : 0))}
                            status={patient?.status}
                            statusLabel={t("Protocole en cours d'exécution")}
                        />
                    </div>
                </div>

                {/* ─── Informations du rendez-vous ─── */}
                <div style={{ background: 'white', borderRadius: '24px', marginBottom: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #eef0f4' }}>
                    {/* Date banner */}
                    <div style={{ background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-800))', color: 'white', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '15px' }}>
                            <Calendar size={18} />
                            {patient.date ? new Date(patient.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : t('Date à confirmer')}
                        </div>
                        {patient.surgery_time && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '15px' }}>
                                <Clock size={18} />
                                {patient.surgery_time}
                            </div>
                        )}
                    </div>

                    <div style={{ padding: '4px 0' }}> {/* Wrapper for tighter spacing */}
                        {/* Operation type */}
                        {patient.operation && (
                            <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Activity size={22} style={{ color: 'var(--color-primary-600)' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '800', fontSize: '17px', color: '#111827' }}>{patient.operation}</div>
                                    {patient.stay_type && <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500', marginTop: '1px' }}>{patient.stay_type}</div>}
                                </div>
                            </div>
                        )}

                        {/* Clinic name */}
                        {patient.clinic_name && (
                            <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f5f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Home size={22} style={{ color: 'var(--color-primary-500)' }} />
                                </div>
                                <div style={{ fontWeight: '700', fontSize: '16px', color: '#374151' }}>{patient.clinic_name}</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── Préparation & Documents ─── */}
                <div style={{ background: 'white', borderRadius: '24px', marginBottom: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #eef0f4' }}>
                    {/* Protocol status row */}
                    <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f4f5f7' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <TrendingUp size={20} style={{ color: '#16a34a' }} />
                            </div>
                            <div>
                                <div style={{ fontWeight: '700', fontSize: '15px', color: '#1a1a1a' }}>
                                    {(patient?.progress || 0) >= 100 ? 'Préparation terminée 🎉' : 'Préparation en cours'}
                                </div>
                                <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>
                                    {(patient?.progress || 0) >= 100 ? 'Tout est prêt pour votre prise en charge' : `${patient?.progress || 0}% du protocole complété`}
                                </div>
                            </div>
                        </div>
                        <ChevronRight size={20} style={{ color: '#ccc', flexShrink: 0 }} />
                    </div>

                    {/* Download ordonnance — always visible */}
                    <div
                        onClick={documents.length > 0 ? handleDownloadPrescription : undefined}
                        style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', cursor: documents.length > 0 ? 'pointer' : 'default', opacity: documents.length > 0 ? 1 : 0.5, borderBottom: '1px solid #f4f5f7', transition: 'background 0.15s' }}
                        onMouseOver={(e) => { if (documents.length > 0) e.currentTarget.style.background = '#f9fafb'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Download size={20} style={{ color: 'var(--color-primary-600)' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '700', fontSize: '15px', color: documents.length > 0 ? 'var(--color-primary-600)' : '#aaa' }}>
                                Télécharger mon ordonnance
                            </div>
                            <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>
                                {documents.length > 0 ? `${documents.length} document(s) disponible(s)` : 'Aucun document disponible pour le moment'}
                            </div>
                        </div>
                        <ChevronRight size={20} style={{ color: '#ccc', flexShrink: 0 }} />
                    </div>

                    {/* Custom Questions */}
                    {customQuestions.filter(q => !q.response).length > 0 && (
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f4f5f7' }}>
                            <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--color-primary-600)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>
                                Questions de votre équipe médicale
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {customQuestions.filter(q => !q.response).map(q => (
                                    <div key={q.id} style={{ background: 'var(--color-primary-50)', borderRadius: '12px', padding: '12px 16px', borderLeft: '3px solid var(--color-primary-400)' }}>
                                        <div style={{ fontSize: '14px', color: 'var(--color-gray-900)', fontWeight: '600', marginBottom: '10px' }}>{q.question_text}</div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input type="text" className="input" placeholder="Votre réponse..." style={{ flex: 1, fontSize: '14px', height: '38px', background: 'white' }}
                                                onKeyDown={(e) => { if (e.key === 'Enter') handleAnswerCustomQuestion(q.id, e.target.value); }} />
                                            <button className="btn btn-primary" style={{ padding: '0 14px', height: '38px' }} disabled={answeringQuestionId === q.id}
                                                onClick={(e) => { const input = e.currentTarget.previousSibling; handleAnswerCustomQuestion(q.id, input.value); }}>
                                                {answeringQuestionId === q.id ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Patient name */}
                    <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f4f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <User size={20} style={{ color: '#555' }} />
                        </div>
                        <div style={{ fontWeight: '600', fontSize: '15px', color: '#1a1a1a' }}>{patient.name}</div>
                    </div>
                </div>

                {/* ─── Consignes pré-opératoires ─── */}
                <ConsignesSection />

                {/* ─── Détails de l'établissement ─── */}
                <div style={{ background: 'white', borderRadius: '24px', marginBottom: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #eef0f4' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #f4f5f7' }}>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Détails de l'établissement de santé</div>
                    </div>

                    <a href={`tel:${patient.clinic_phone || '0444444444'}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid #f4f5f7', cursor: 'pointer' }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#f9fafb'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                            <Phone size={18} style={{ color: 'var(--color-primary-600)', flexShrink: 0 }} />
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a1a' }}>Téléphone de la clinique</div>
                                <div style={{ fontSize: '13px', color: 'var(--color-primary-600)', fontWeight: '600', marginTop: '2px' }}>{patient.clinic_phone || '04 91 15 90 19'}</div>
                                <div style={{ fontSize: '12px', color: 'var(--color-primary-500)', marginTop: '2px' }}>Appeler l'établissement</div>
                            </div>
                        </div>
                    </a>

                    {patient.clinic_name && (
                        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                            <Home size={18} style={{ color: 'var(--color-primary-600)', flexShrink: 0, marginTop: '2px' }} />
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a1a', marginBottom: '4px' }}>{t('Se rendre à la consultation')}</div>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a' }}>{patient.clinic_name}</div>
                                {patient.clinic_address && <div style={{ fontSize: '13px', color: '#666', marginTop: '2px', lineHeight: 1.5 }}>{patient.clinic_address}</div>}
                            </div>
                        </div>
                    )}
                </div>

                {/* ─── Parcours de Soins ─── */}
                <div style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #eef0f4' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #f4f5f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Votre Parcours de Soins</div>
                        <div style={{ background: 'var(--color-primary-600)', color: 'white', padding: '4px 14px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700' }}>
                            <Zap size={13} fill="currentColor" />
                            {calculateDaysUntilSurgery(patient.date)}
                        </div>
                    </div>

                    {(() => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const surgeryDate = patient.date ? new Date(patient.date) : null;
                        if (surgeryDate) surgeryDate.setHours(0, 0, 0, 0);
                        const diffDays = surgeryDate ? Math.ceil((surgeryDate - today) / (1000 * 60 * 60 * 24)) : 999;

                        return [
                            { to: `bienvenue`, emoji: '👋', label: 'Bienvenue', desc: 'Activation de votre suivi', offset: 99 },
                            { to: `j7`, emoji: '📋', label: 'Questionnaire J-7', desc: 'Préparation administrative (anesthésie, accompagnant)', offset: 7 },
                            { to: `j2`, emoji: '📄', label: 'Questionnaire J-2', desc: 'Documents, jeûne et consignes du jour J', offset: 2 },
                            { to: `j1-preop`, emoji: '🚿', label: 'Confirmation J-1', desc: 'Dernière vérification avant votre venue', offset: 1 },
                            { to: `j1`, emoji: '🌡️', label: 'Suivi J+1', desc: 'Bilan post-opératoire du lendemain', offset: -1 },
                            { to: `j4`, emoji: '⭐', label: 'Satisfaction J+4', desc: 'Votre avis sur notre prise en charge', offset: -4 },
                            { to: `e-satis`, emoji: '🇫🇷', label: 'Enquête e-Satis', desc: 'Questionnaire national de satisfaction', offset: -4 },
                        ].map((step, idx, arr) => {
                            const isLocked = diffDays > step.offset;
                            const isLast = idx === arr.length - 1;
                            let isRequired = false;
                            if (step.to === 'j7' && diffDays <= 7 && !responses['anesthesia_consultation']) isRequired = true;
                            if (step.to === 'j2' && diffDays <= 2 && !responses['fasting_understood']) isRequired = true;
                            if (step.to === 'j1-preop' && diffDays <= 1 && !responses['admission_confirmed']) isRequired = true;

                            const row = (
                                <div key={step.to} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', borderBottom: isLast ? 'none' : '1px solid #f4f5f7', opacity: isLocked ? 0.5 : 1 }}>
                                    <div style={{ fontSize: '28px', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', background: '#f9fafb', flexShrink: 0, filter: isLocked ? 'grayscale(1)' : 'none' }}>
                                        {step.emoji}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '700', fontSize: '15px', color: isLocked ? '#999' : '#1a1a1a' }}>{step.label}</div>
                                        <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>{step.desc}</div>
                                    </div>
                                    {isRequired && !isLocked && (
                                        <div style={{ background: '#FFEBEE', color: '#FF1744', padding: '3px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', flexShrink: 0 }}>
                                            Requis
                                        </div>
                                    )}
                                    {isLocked
                                        ? <Lock size={16} style={{ color: '#ccc', flexShrink: 0 }} />
                                        : <ChevronRight size={18} style={{ color: '#ccc', flexShrink: 0 }} />}
                                </div>
                            );

                            if (isLocked) return row;
                            return (
                                <Link key={step.to} to={`/patient-portal/${token}/${step.to}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                                    onMouseOver={(e) => e.currentTarget.style.background = '#f9fafb'}
                                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                    {row}
                                </Link>
                            );
                        });
                    })()}
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

