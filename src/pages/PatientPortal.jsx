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
    CheckCircle2,
    ShieldCheck,
    Clock,
    ChevronRight,
    Phone,
    Lock
} from 'lucide-react';
import ClinicAppointmentCard from '../components/ClinicAppointmentCard';
import CompactAppointmentCard from '../components/CompactAppointmentCard';
import ProtocolStatus from '../components/ProtocolStatus';
import PatientTraceability from '../components/PatientTraceability';

import { HelpCircle, Send, RefreshCw, Download } from 'lucide-react';
import { generateSynthesisPDF } from '../services/pdfService';
import PatientSynthesisReport from '../components/PatientSynthesisReport';
import { useTranslation } from 'react-i18next';

// Premium Assets
import wppPhone from '../assets/wpp-phone.png';
import wppDesktop from '../assets/wpp-desktop.png';

import logoSlMa from '../assets/logo-sl-ma.png';
import suiviCard from '../assets/suivi-card.png';
import suiviCardBw from '../assets/suivi-card-bw.png';

function ConsignesSection({ patientId }) {
    const { t } = useTranslation();
    const storageKey = `consignes_acknowledged_${patientId}`;
    const [acknowledged, setAcknowledged] = useState(() => {
        return localStorage.getItem(storageKey) === 'true';
    });

    const handleAcknowledge = () => {
        localStorage.setItem(storageKey, 'true');
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
                background: acknowledged ? '#f0fdf4' : 'white',
                padding: '166px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                borderBottom: acknowledged ? '1px solid #bbf7d0' : '1px solid #f3f4f6'
            }}>
                <ShieldCheck size={20} style={{ color: acknowledged ? '#059669' : 'var(--color-primary-600)', flexShrink: 0 }} />
                <div style={{ fontSize: '15px', fontWeight: '800', color: acknowledged ? '#059669' : 'var(--color-primary-600)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {t('Consignes pré-opératoires')}
                </div>
                {acknowledged && (
                    <div style={{ marginLeft: 'auto', background: '#d1fae5', color: '#059669', fontSize: '11px', fontWeight: '700', padding: '4px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #10b981' }}>
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
                            background: 'white',
                            color: 'var(--color-primary-600)',
                            border: '2px solid var(--color-primary-600)',
                            fontWeight: '800',
                            fontSize: '16px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.12)',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = 'var(--color-primary-50)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = 'white';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <CheckCircle2 size={20} color="var(--color-primary-600)" />
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
    const { t, i18n } = useTranslation();
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
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const reportRef = useRef(null);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


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
                background: 'var(--grad-premium-dark)'
            }}>
                <div className="card" style={{ maxWidth: '500px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                    <AlertCircle size={64} style={{ margin: '0 auto var(--spacing-4)', color: '#ef4444' }} />
                    <h2 style={{ marginBottom: 'var(--spacing-2)', color: 'white' }}>Accès non autorisé</h2>
                    <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 'var(--spacing-6)' }}>{error}</p>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'rgba(255,255,255,0.5)' }}>
                        Si vous pensez qu'il s'agit d'une erreur, veuillez contacter votre praticien.
                    </p>
                </div>
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="patient-view" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 'var(--spacing-4)', background: 'var(--grad-premium-dark)' }}>
                <div className="card" style={{ maxWidth: '400px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                    <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: 'var(--spacing-4)' }} />
                    <h2 style={{ marginBottom: 'var(--spacing-2)', color: 'white' }}>Accès non autorisé</h2>
                    <p style={{ color: 'rgba(255,255,255,0.7)' }}>
                        Impossible de charger les données de votre dossier. Veuillez contacter votre établissement de soins.
                    </p>
                </div>
            </div>
        );
    }

    const GLASS_STYLE = {
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--glass-shadow)',
        borderRadius: '24px'
    };

    return (
        <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
            {/* Animated Background Layer */}
            <div 
                className="bg-animate-zoom"
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${wppPhone})`,

                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed',
                    zIndex: -1
                }}

            />

            <div style={{
                position: 'relative',
                zIndex: 1,
                minHeight: '100vh',
                padding: '20px 16px',
                color: 'white',
                fontFamily: "var(--font-family)"
            }}>


            <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                {/* Top Bar Logo - Left Aligned with Content */}
                <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '32px', marginTop: '10px' }}>
                    <img src={logoSlMa} alt="Logo" style={{ height: '80px', objectFit: 'contain' }} />
                </div>

                {/* Greeting & Language */}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: '500', color: 'white', margin: 0 }}>
                        {t('Bienvenue,')} {patient?.name?.split(' ')[0] || 'Christophe'} !
                    </h1>
                    
                    {/* Liquid Glass Translation Menu */}
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <select 
                            value={i18n.language || 'fr'} 
                            onChange={(e) => i18n.changeLanguage(e.target.value)}
                            style={{
                                ...GLASS_STYLE,
                                padding: '8px 32px 8px 16px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'white',
                                appearance: 'none',
                                fontSize: '18px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                outline: 'none',
                                textAlign: 'center',
                                minWidth: '70px',
                                position: 'relative',
                                zIndex: 2
                            }}
                        >
                            <option value="fr">🇫🇷</option>
                            <option value="en">🇬🇧</option>
                            <option value="nl">🇳🇱</option>
                        </select>
                        <ChevronRight 
                            size={14} 
                            style={{ 
                                position: 'absolute',
                                right: '12px',
                                transform: 'rotate(90deg)', 
                                opacity: 0.6,
                                pointerEvents: 'none',
                                zIndex: 3
                            }} 
                        />
                    </div>


                </div>

                {/* Main Hero Card (Premium Status Card) */}
                <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '280px',
                    borderRadius: '40px',
                    overflow: 'hidden',
                    marginBottom: '32px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                    background: 'rgba(255,255,255,0.05)'
                }}>
                    {/* Background Status Card */}
                    <img 
                        src={(patient?.progress || 0) >= 100 ? suiviCard : suiviCardBw} 
                        alt="" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />

                    {/* Nurse Illustration */}
                    <img 
                        src="/src/assets/welcomecard-infirmier.png" 
                        alt="" 
                        style={{ 
                            position: 'absolute', 
                            right: '-10px', 
                            bottom: '0', 
                            height: '100%', 
                            zIndex: 1,
                            filter: (patient?.progress || 0) >= 100 ? 'none' : 'grayscale(1)',
                            opacity: (patient?.progress || 0) >= 100 ? 1 : 0.8,
                            transition: 'all 0.5s ease'
                        }} 
                    />



                    {/* Overlay Content */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        padding: '32px 40px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        background: 'linear-gradient(to right, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
                        zIndex: 2
                    }}>
                        <div style={{ maxWidth: '75%' }}>
                            <h2 style={{ 
                                fontSize: '28px', 
                                fontWeight: '500', 
                                color: 'white', 
                                marginBottom: '8px',
                                letterSpacing: '-0.02em',
                                lineHeight: 1.1
                            }}>
                                Préparez-vous en<br />toute sérénité !
                            </h2>
                            <p style={{ 
                                fontSize: '12px', 
                                color: 'rgba(255,255,255,0.7)', 
                                marginBottom: '24px',
                                lineHeight: 1.5,
                                maxWidth: '200px'
                            }}>
                                Répondez à des questions de suivi pour préparer votre opération
                            </p>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    background: (patient?.progress || 0) >= 100 ? '#10B981' : '#F59E0B',
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1.5px solid white'
                                }}>
                                    <CheckCircle2 size={12} color="white" />
                                </div>
                                <span style={{ fontSize: '16px', fontWeight: '700', color: 'white' }}>
                                    {(patient?.progress || 0) >= 100 ? t('Vous êtes à jour !') : t('Vous n’êtes pas à jour !')}
                                </span>
                            </div>
                        </div>

                        <div>
                            <p style={{ fontSize: '13px', fontWeight: '400', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                                Prochaines questions dans :
                            </p>
                            <div style={{ fontSize: '36px', fontWeight: '800', letterSpacing: '0.05em', color: 'white' }}>
                                {calculateDaysUntilSurgery(patient.date).includes('J') ? '00:00:00' : '00:00:00'}
                            </div>
                        </div>
                    </div>

                    {/* Progress Dots Bottom Right */}
                    <div style={{ position: 'absolute', right: '40px', bottom: '32px', display: 'flex', gap: '8px', zIndex: 3 }}>
                        <div style={{ width: '28px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.4)' }}></div>
                        <div style={{ width: '28px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.4)' }}></div>
                        <div style={{ width: '28px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.4)' }}></div>
                    </div>
                </div>

                {/* Main Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                    <button style={{
                        width: '100%',
                        padding: '18px',
                        borderRadius: '20px',
                        background: 'var(--grad-premium-purple)',
                        color: 'white',
                        border: 'none',
                        fontSize: '15px',
                        fontWeight: '800',
                        letterSpacing: '0.05em',
                        boxShadow: '0 10px 20px rgba(124, 58, 237, 0.3)',
                        cursor: 'pointer',
                        transition: 'transform 0.2s'
                    }}
                    onClick={() => {
                        const today = new Date();
                        const surgeryDate = patient.date ? new Date(patient.date) : null;
                        const diffDays = surgeryDate ? Math.ceil((surgeryDate - today) / (1000 * 60 * 60 * 24)) : 999;
                        
                        let nextStep = 'bienvenue';
                        if (diffDays <= 7 && !responses['anesthesia_consultation']) nextStep = 'j7';
                        else if (diffDays <= 2 && !responses['fasting_understood']) nextStep = 'j2';
                        else if (diffDays <= 1 && !responses['admission_confirmed']) nextStep = 'j1-preop';
                        
                        navigate(`/patient-portal/${token}/${nextStep}`);
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        DÉMARRER MON QUESTIONNAIRE
                    </button>

                    <button style={{
                        ...GLASS_STYLE,
                        width: '100%',
                        padding: '18px',
                        borderRadius: '20px',
                        color: 'rgba(255,255,255,0.9)',
                        fontSize: '15px',
                        fontWeight: '700',
                        letterSpacing: '0.05em',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                    }}
                    onClick={() => navigate(`/patient-portal/${token}/j7`)}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'var(--glass-bg)'}
                    >
                        MODIFIER MES RÉPONSES PRÉCÉDENTES
                    </button>
                </div>

                {/* Intervention Reminder Card */}
                <div style={{
                    ...GLASS_STYLE,
                    padding: '24px',
                    marginBottom: '24px',
                    background: 'rgba(255,255,255,0.06)'
                }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '500', color: 'white', marginBottom: '20px' }}>
                        Rappel de votre intervention
                    </h3>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '24px', borderRadius: '4px', overflow: 'hidden' }}>
                                <img src="/src/assets/clinic_thumb.png" alt="Clinic" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => {
                                        if (e.target.src.indexOf('clinic_thumb.png') !== -1) e.target.src = '/src/assets/clinic.png';
                                    }} />
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: '700' }}>{patient.clinic_name || 'Clinique de Vitrolles'}</span>
                        </div>
                        <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(patient.clinic_address || "Vitrolles")}`}
                            target="_blank" rel="noopener noreferrer"
                            style={{
                                padding: '8px 16px',
                                borderRadius: '14px',
                                background: 'rgba(255,255,255,0.15)',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: '700',
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                        >
                            M'y rendre <ChevronRight size={12} />
                        </a>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255,255,255,0.9)' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Calendar size={16} />
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: '500' }}>
                                {patient.date ? new Date(patient.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : t('Date à confirmer')}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255,255,255,0.9)' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Clock size={16} />
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: '500' }}>
                                {patient.surgery_time ? patient.surgery_time : 'Non-communiquée'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Parcours de Soins (Care Pathway) - Premium Glass Design */}
                <div style={{
                    ...GLASS_STYLE,
                    marginBottom: '24px',
                    overflow: 'hidden',
                    background: 'rgba(255,255,255,0.03)'
                }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                            Votre Parcours de Soins
                        </h3>
                        <div style={{ background: 'rgba(124, 58, 237, 0.2)', color: '#A78BFA', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                            {calculateDaysUntilSurgery(patient.date)}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {(() => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const surgeryDate = patient.date ? new Date(patient.date) : null;
                            if (surgeryDate) surgeryDate.setHours(0, 0, 0, 0);
                            const diffDays = surgeryDate ? Math.ceil((surgeryDate - today) / (1000 * 60 * 60 * 24)) : 999;

                            return [
                                { to: `bienvenue`, emoji: '👋', label: 'Bienvenue', desc: 'Activation de votre suivi', offset: 99 },
                                { to: `j7`, emoji: '📋', label: 'Questionnaire J-7', desc: 'Préparation administrative', offset: 7 },
                                { to: `j2`, emoji: '📄', label: 'Questionnaire J-2', desc: 'Documents & consignes', offset: 2 },
                                { to: `j1-preop`, emoji: '🚿', label: 'Confirmation J-1', desc: 'Vérification finale', offset: 1 },
                                { to: `j1`, emoji: '🌡️', label: 'Suivi J+1', desc: 'Bilan post-opératoire', offset: -1 },
                                { to: `j4`, emoji: '⭐', label: 'Satisfaction J+4', desc: 'Votre avis nous intéresse', offset: -4 },
                            ].map((step, idx, arr) => {
                                const isLocked = diffDays > step.offset;
                                const isLast = idx === arr.length - 1;
                                
                                const stepContent = (
                                    <div key={step.to} style={{ 
                                        padding: '16px 20px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '14px', 
                                        borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)', 
                                        opacity: isLocked ? 0.3 : 1,
                                        transition: 'background 0.2s'
                                    }}>
                                        <div style={{ 
                                            fontSize: '20px', width: '36px', height: '36px', 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                            borderRadius: '10px', background: 'rgba(255,255,255,0.1)', flexShrink: 0 
                                        }}>
                                            {step.emoji}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '700', fontSize: '14px', color: 'white' }}>{step.label}</div>
                                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{step.desc}</div>
                                        </div>
                                        {isLocked ? <Lock size={14} style={{ color: 'rgba(255,255,255,0.4)' }} /> : <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.6)' }} />}
                                    </div>
                                );

                                if (isLocked) return stepContent;
                                return (
                                    <Link key={step.to} to={`/patient-portal/${token}/${step.to}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                        {stepContent}
                                    </Link>
                                );
                            });
                        })()}
                    </div>
                </div>

                {/* Footer Call & Ordonnance Buttons */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <a href={`tel:${patient.clinic_phone || '0491159019'}`} style={{
                        ...GLASS_STYLE,
                        flex: 1,
                        padding: '16px',
                        textAlign: 'center',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'white',
                        textDecoration: 'none',
                        background: 'rgba(255,255,255,0.08)'
                    }}>
                        Appeler clinique <ChevronRight size={14} style={{ verticalAlign: 'middle', transform: 'rotate(-45deg)' }} />
                    </a>
                    <a href={`tel:${patient.practitioner_phone || '0491159019'}`} style={{
                        ...GLASS_STYLE,
                        flex: 1,
                        padding: '16px',
                        textAlign: 'center',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'white',
                        textDecoration: 'none',
                        background: 'rgba(255,255,255,0.08)'
                    }}>
                        Appeler cabinet <ChevronRight size={14} style={{ verticalAlign: 'middle', transform: 'rotate(-45deg)' }} />
                    </a>
                </div>

                <div 
                    onClick={documents.length > 0 ? handleDownloadPrescription : undefined}
                    style={{
                        ...GLASS_STYLE,
                        width: '100%',
                        padding: '16px',
                        textAlign: 'center',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'white',
                        background: 'rgba(255,255,255,0.08)',
                        cursor: documents.length > 0 ? 'pointer' : 'default',
                        opacity: documents.length > 0 ? 1 : 0.5,
                        marginBottom: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    Télécharger mon ordonnance <Download size={16} />
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
    </div>
    );
}
