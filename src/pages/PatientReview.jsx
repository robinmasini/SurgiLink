import { useState, useEffect, useRef } from 'react';
import wppPhone from '../assets/wpp-phone.png';
// Last Push Confirmation: 2026-03-19 14:58 (Antigravity)
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import EditPatientModal from '../components/EditPatientModal';
import EditSMSModal from '../components/EditSMSModal';
import CustomSMSModal from '../components/CustomSMSModal';
import AddQuestionModal from '../components/AddQuestionModal';
import QuestionsPreviewModal from '../components/QuestionsPreviewModal';
import ClinicAppointmentCard from '../components/ClinicAppointmentCard';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Calendar,
    User,
    Clipboard,
    ClipboardList,
    History,
    ChevronLeft,
    Clock,
    Activity,
    Plus,
    X,
    Edit2,
    FileText,
    TrendingUp,
    AlertCircle,
    Zap,
    Download,
    UploadCloud,
    Trash2,
    Eye,
    Send,
    Mail,
    Phone,
    MapPin,
    Link as LinkIcon,
    Copy,
    RefreshCw,
    ShieldCheck,
    Sparkles,
    ExternalLink
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { calculateAge, calculateDaysUntilSurgery, formatDateFR, formatDateTimeFR } from '../utils/dateUtils';
import { getPatientPathwayStatus, getResponses, calculateRiskFlags } from '../services/pathwayService';
import { getDocuments, uploadDocument, deleteDocument, downloadDocument } from '../services/documentService';
import { generatePatientToken, getPatientTokens, revokeToken } from '../services/tokenService';
import { generateSynthesisPDF } from '../services/pdfService';
import PatientSynthesisReport from '../components/PatientSynthesisReport';
import { sendManualReminder, getNextPendingReminder, getPendingReminders, sendOverrideSMS, updateReminder, sendPunctualSMS } from '../services/reminderService';
import { getCustomQuestions, addCustomQuestion, deleteCustomQuestion } from '../services/customQuestionService';
import LogoPremium from '../components/LogoPremium';
import clinicImage from '../assets/clinic.png';
import hmIcon from '../assets/hm-icon.png';
import StatusBolt from '../components/StatusBolt';
import LogoIcon from '../components/LogoIcon';

const Drawer = ({ isOpen, onClose, title, icon, children }) => {
    return (
        <div className={`drawer-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
            <div className="drawer-content" onClick={e => e.stopPropagation()}>
                <div className="drawer-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="card-icon card-icon-primary" style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {icon}
                        </div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>{title}</h3>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--color-gray-400)', cursor: 'pointer', padding: '8px' }}>
                        <X size={24} />
                    </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default function PatientReview() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [patient, setPatient] = useState(null);
    const [medicalHistory, setMedicalHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isQuestionsModalOpen, setIsQuestionsModalOpen] = useState(false);
    const [clinicalResponses, setClinicalResponses] = useState({
        Bienvenue: {},
        J7: {},
        J1_PreOp: {},
        J1: {},
        J4_Satisfaction: {},
        ESATIS: {}
    });
    const [responsesMeta, setResponsesMeta] = useState({});
    const [riskStatus, setRiskStatus] = useState('NORMAL'); // NORMAL, VIGILANCE, URGENT
    const [activeTab, setActiveTab] = useState('overview'); // Not used but kept for logic if needed
    const [documents, setDocuments] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [tokenData, setTokenData] = useState(null);
    const [isGeneratingToken, setIsGeneratingToken] = useState(false);
    const [isSMSModalOpen, setIsSMSModalOpen] = useState(false);
    const [isCustomSMSModalOpen, setIsCustomSMSModalOpen] = useState(false);
    const [nextReminder, setNextReminder] = useState(null);
    const [pendingReminders, setPendingReminders] = useState([]);
    const [editingReminder, setEditingReminder] = useState(null);
    const [customQuestions, setCustomQuestions] = useState([]);
    const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [isSecureLinkDrawerOpen, setIsSecureLinkDrawerOpen] = useState(false);
    const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
    const reportRef = useRef(null);
    const fileInputRef = useRef(null);

    const loadPatientData = async () => {
        setIsLoading(true);
        try {
            // Load patient
            const { data: patientData, error: patientError } = await supabase
                .from('patients')
                .select('*')
                .eq('id', id)
                .single();

            if (patientError) throw patientError;
            setPatient(patientData);

            // Calculate risk status
            const [riskJ7, riskJ1Pre, riskJ1, riskJ4, riskESatis] = await Promise.all([
                calculateRiskFlags(id, 'J7'),
                calculateRiskFlags(id, 'J1_PreOp'),
                calculateRiskFlags(id, 'J1'),
                calculateRiskFlags(id, 'J4_Satisfaction'),
                calculateRiskFlags(id, 'ESATIS')
            ]);

            const hasHardRisk = riskJ7.hard?.length > 0 || riskJ1Pre.hard?.length > 0 || riskJ1.hard?.length > 0 || riskJ4.hard?.length > 0 || riskESatis?.hard?.length > 0;
            const hasSoftRisk = riskJ7.soft?.length > 0 || riskJ1Pre.soft?.length > 0 || riskJ1.soft?.length > 0 || riskJ4.soft?.length > 0 || riskESatis?.soft?.length > 0;

            if (hasHardRisk) setRiskStatus('URGENT');
            else if (hasSoftRisk) setRiskStatus('VIGILANCE');
            else setRiskStatus('NORMAL');

            // Load clinical responses for all steps
            const [respBienvenue, respJ7, respJ1Pre, respJ1, respJ4, respESatis] = await Promise.all([
                getResponses(id, 'Bienvenue'),
                getResponses(id, 'J7'),
                getResponses(id, 'J1_PreOp'),
                getResponses(id, 'J1'),
                getResponses(id, 'J4_Satisfaction'),
                getResponses(id, 'ESATIS')
            ]);

            setClinicalResponses({
                Bienvenue: respBienvenue || {},
                J7: respJ7 || {},
                J1_PreOp: respJ1Pre || {},
                J1: respJ1 || {},
                J4_Satisfaction: respJ4 || {},
                ESATIS: respESatis || {}
            });

            // Fetch response metadata (timestamps + user_id) for PDF
            const { data: metaRows } = await supabase
                .from('pathway_responses')
                .select('screen, item_id, updated_at, user_id')
                .eq('patient_id', id);

            if (metaRows) {
                const meta = {};
                metaRows.forEach(r => {
                    if (!meta[r.screen]) meta[r.screen] = {};
                    meta[r.screen][r.item_id] = {
                        updated_at: r.updated_at,
                        user_id: r.user_id
                    };
                });
                setResponsesMeta(meta);
            }

            setPatient({
                ...patientData,
                displayProgress: patientData.progress || 0
            });

            // Load history (unified)
            await loadHistoryData(id);

            // Load documents
            const docData = await getDocuments(parseInt(id));
            setDocuments(docData);

            // Load custom questions
            const questions = await getCustomQuestions(id);
            setCustomQuestions(questions);

        } catch (err) {
            console.error('Error loading patient:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const loadTokenData = async () => {
        if (!id) return;
        const tokens = await getPatientTokens(id);
        const activeToken = tokens.find(t => t.is_active);
        setTokenData(activeToken || null);
    };

    const loadHistoryData = async (patientId) => {
        try {
            // Load medical history
            const { data: historyData, error: historyError } = await supabase
                .from('medical_history')
                .select('*')
                .eq('patient_id', patientId)
                .order('date', { ascending: false });

            // Load SMS logs
            const { data: smsLogs, error: smsError } = await supabase
                .from('sms_logs')
                .select('*')
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false });

            let unifiedHistory = [];

            // Add medical history entries
            if (!historyError && historyData) {
                unifiedHistory = historyData.map(h => ({
                    ...h,
                    type: 'history',
                    timestamp: h.date // or created_at if date is same
                }));
            }

            // Add SMS logs (deduplicating if they might overlap with medical_history)
            if (!smsError && smsLogs) {
                const logs = smsLogs.map(l => ({
                    ...l,
                    type: 'sms_log',
                    timestamp: l.sent_at || l.created_at,
                    title: l.screen ? `SMS ${l.screen}` : 'SMS Automatique',
                    description: l.message // Using the new column
                }));
                unifiedHistory = [...unifiedHistory, ...logs];
            }

            // Sort by descending timestamp
            unifiedHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setMedicalHistory(unifiedHistory);

        } catch (err) {
            console.error('Error loading history:', err);
        }
    };

    const handleGenerateToken = async () => {
        setIsGeneratingToken(true);
        try {
            // Revoke old tokens if any
            if (tokenData) {
                await revokeToken(tokenData.id);
            }
            const res = await generatePatientToken(id);
            if (res.success) {
                setTokenData({
                    id: res.tokenId,
                    token: res.token,
                    expires_at: res.expiresAt,
                    is_active: true
                });
            } else {
                alert(`Erreur: ${res.error}`);
            }
        } finally {
            setIsGeneratingToken(false);
        }
    };

    const handleOpenPortal = async () => {
        let currentToken = tokenData?.token;
        if (!currentToken) {
            try {
                const res = await generatePatientToken(id);
                if (res.success) {
                    currentToken = res.token;
                    setTokenData({
                        id: res.tokenId,
                        token: res.token,
                        expires_at: res.expiresAt,
                        is_active: true
                    });
                } else {
                    alert(`Erreur lors de la génération du lien portail : ${res.error}`);
                    return;
                }
            } catch (err) {
                console.error(err);
                alert('Erreur lors de la génération du lien portail.');
                return;
            }
        }
        const url = `${window.location.origin}/patient-portal/${currentToken}`;
        window.open(url, '_blank');
    };

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            alert('Lien copié dans le presse-papier !');
        } catch (err) {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                alert('Lien copié dans le presse-papier !');
            } catch (err2) {
                console.error('Erreur de copie:', err2);
                alert('Erreur lors de la copie du lien. Veuillez le copier manuellement.');
            }
            textArea.remove();
        }
    };

    useEffect(() => {
        if (id) {
            loadPatientData();
            loadTokenData();
            loadNextReminder();
        }
    }, [id]);
    
    const handleResetOnboarding = async () => {
        if (!window.confirm('Voulez-vous vraiment réinitialiser le didacticiel pour ce patient ?')) return;

        try {
            const { error } = await supabase
                .from('patients')
                .update({ onboarding_completed_at: null })
                .eq('id', id);

            if (error) {
                // If column doesn't exist, we still clear local storage and show a message
                console.warn('Database reset failed (column might be missing):', error);
            }

            // Clear local storage for the current device (facilitates practitioner testing)
            localStorage.removeItem(`onboarding_completed_${id}`);

            // Refresh patient data
            const { data: updatedPatient } = await supabase
                .from('patients')
                .select('*')
                .eq('id', id)
                .single();
            
            setPatient(updatedPatient);
            alert('Didacticiel réinitialisé ! (Pensez à tester en navigation privée ou à vider le cache du patient si vous testez sur le même appareil).');
        } catch (err) {
            console.error('Error resetting onboarding:', err);
            alert('Erreur lors de la réinitialisation.');
        }
    };

    const loadNextReminder = async () => {
        const reminders = await getPendingReminders(id);
        setPendingReminders(reminders);
        setNextReminder(reminders.length > 0 ? reminders[0] : null);
    };

    const handleUpdateReminder = async (reminderId, updates) => {
        const res = await updateReminder(reminderId, updates);
        if (res.success) {
            setIsSMSModalOpen(false);
            setEditingReminder(null);
            loadNextReminder();
            alert('Rappel mis à jour !');
        } else {
            alert(`Erreur: ${res.error}`);
        }
    };

    const handleSendManualSMS = async (customMessage, reminderId) => {
        const res = await sendOverrideSMS(id, reminderId, customMessage, {
            user_id: (await supabase.auth.getUser()).data.user?.id // Avoid null
        });

        if (res.success) {
            setIsSMSModalOpen(false);
            setEditingReminder(null);
            // Refresh history and next reminder
            loadHistoryData(id);
            loadNextReminder();
            alert('SMS envoyé et rappel automatique mis à jour !');
        } else {
            alert(`Erreur lors de l'envoi : ${res.error}`);
        }
    };

    const handleSendPunctualSMS = async (message) => {
        const res = await sendPunctualSMS(id, message, patient);

        if (res.success) {
            setIsCustomSMSModalOpen(false);
            // Refresh history
            loadHistoryData(id);
            alert('SMS personnalisé envoyé avec succès !');
        } else {
            alert(`Erreur lors de l'envoi : ${res.error}`);
        }
    };

    const handleAddCustomQuestion = async (text, screen) => {
        const res = await addCustomQuestion(id, text, screen);
        if (res.success) {
            setIsAddQuestionModalOpen(false);
            const questions = await getCustomQuestions(id);
            setCustomQuestions(questions);
        } else {
            alert(`Erreur lors de l'ajout: ${res.error}`);
        }
    };

    const handleDeleteCustomQuestion = async (questionId) => {
        if (!confirm('Supprimer cette question ?')) return;
        const res = await deleteCustomQuestion(questionId);
        if (res.success) {
            setCustomQuestions(prev => prev.filter(q => q.id !== questionId));
        } else {
            alert(`Erreur lors de la suppression: ${res.error}`);
        }
    };

    const handleDownloadSynthesis = async () => {
        setIsGeneratingPDF(true);
        try {
            const fileName = `Synthese_${patient.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
            await generateSynthesisPDF(reportRef.current, fileName);
        } catch (err) {
            console.error('Error during PDF generation:', err);
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const handleRegenerateSchedule = async () => {
        if (!confirm('Cela va supprimer tous les rappels en attente et les remplacer par le nouveau planning complet (Bienvenue J-18 à ESATIS). Continuer ?')) return;

        try {
            // 1. Delete pending
            await supabase.from('reminder_queue').delete().eq('patient_id', id).eq('status', 'pending');

            // 2. Re-schedule
            const { scheduleTimeBasedReminders } = await import('../services/reminderService');
            await scheduleTimeBasedReminders(id, patient.date, { default: patient.reminder_time });

            loadNextReminder();
            alert('Planning SMS régénéré avec succès !');
        } catch (err) {
            console.error('Error regenerating schedule:', err);
            alert('Erreur lors de la régénération du planning.');
        }
    };


    const handleFileUpload = async (files) => {
        setIsUploading(true);
        try {
            for (const file of Array.from(files)) {
                const { success, data, error } = await uploadDocument(parseInt(id), file);
                if (success) {
                    setDocuments(prev => [data, ...prev]);
                } else {
                    console.error(`Upload error for ${file.name}:`, error);
                    alert(`Erreur lors de l'envoi de ${file.name}.\n\nDétail: ${error}\n\nNote: Vérifiez que le bucket 'patient-documents' est bien créé dans Supabase.`);
                }
            }
        } finally {
            setIsUploading(false);
        }
    };

    const removeDocument = async (docId, storagePath) => {
        if (!confirm('Supprimer ce document ?')) return;

        const { success, error } = await deleteDocument(docId, storagePath);
        if (success) {
            setDocuments(prev => prev.filter(d => d.id !== docId));
        } else {
            alert(`Erreur lors de la suppression: ${error}`);
        }
    };

    const handleDownloadDocument = async (storagePath, fileName) => {
        console.log('Attempting download:', storagePath, fileName);
        const { success, error } = await downloadDocument(storagePath, fileName);
        if (!success) {
            console.error('Download failed:', error);
            alert(`Erreur lors du téléchargement: ${error}`);
        }
    };

    const onDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = () => {
        setIsDragging(false);
    };

    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files);
        }
    };


    const handleDeletePatient = async () => {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer le patient ${patient.name} ? Cette action est irréversible.`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('patients')
                .delete()
                .eq('id', id);

            if (error) throw error;

            alert('Patient supprimé avec succès');
            navigate('/patients');
        } catch (err) {
            console.error('Error deleting patient:', err);
            alert(`Erreur: ${err.message}`);
        }
    };

    const handlePatientUpdated = async () => {
        // Reload patient data after update
        try {
            const { data: patientData, error: patientError } = await supabase
                .from('patients')
                .select('*')
                .eq('id', id)
                .single();

            if (patientError) throw patientError;
            setPatient(patientData);
        } catch (err) {
            console.error('Error reloading patient:', err);
        }
    };


    const handleModalResponseSaved = (screen, itemId, value) => {
        setClinicalResponses(prev => ({
            ...prev,
            [screen]: {
                ...prev[screen],
                [itemId]: value
            }
        }));
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex' }}>
                <Sidebar />
                <main className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div className="spinner" style={{ margin: '0 auto var(--spacing-4)' }}></div>
                        <p>Chargement...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (!patient) {
        return (
            <div style={{ display: 'flex' }}>
                <Sidebar />
                <main className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                    <div style={{ textAlign: 'center', color: 'var(--color-gray-500)' }}>
                        <p style={{ marginBottom: 'var(--spacing-4)' }}>Patient introuvable</p>
                        <button className="btn btn-primary" onClick={() => navigate('/patients')}>Retour à la liste</button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <main className="main-content">
                {/* Header Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-6)', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
                    <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm" style={{ padding: '8px', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center' }}>
                        <ChevronLeft size={20} />
                        <span style={{ marginLeft: 'var(--spacing-2)' }}>Retour</span>
                    </button>

                    <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                        <button 
                            onClick={() => setIsQuestionsModalOpen(true)}
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '12px' }}
                        >
                            <ClipboardList size={18} />
                            {t('Aperçu des questions')}
                        </button>
                        <button 
                            onClick={() => setIsSecureLinkDrawerOpen(true)}
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '12px' }}
                        >
                            <ShieldCheck size={18} />
                            Lien Patient
                        </button>
                        <button 
                            onClick={() => setIsHistoryDrawerOpen(true)}
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '12px' }}
                        >
                            <History size={18} />
                            Historique
                        </button>
                    </div>
                </div>

                <div className="patient-review-layout">
                    {/* Left Column: Data */}
                    <div className="patient-review-main">

                        {/* 1. Patient Card */}
                        <div className="card glass-effect patient-card">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)', position: 'relative' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--spacing-4)', flexWrap: 'wrap', marginBottom: 'var(--spacing-2)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
                                            <div className="hide-mobile" style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '50%',
                                                background: 'var(--color-primary-100)',
                                                color: 'var(--color-primary-600)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 'var(--font-size-lg)',
                                                fontWeight: 'var(--font-weight-black)',
                                                flexShrink: 0
                                            }}>
                                                {patient.name?.split(' ').map(n => n?.[0]).join('') || '?'}
                                            </div>
                                            <h2 style={{ fontSize: 'var(--font-size-3xl)', margin: 0, fontWeight: 'var(--font-weight-black)' }}>{patient.name}</h2>
                                            
                                            <StatusBolt status={patient.status} showLabel={true} size={24} />
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <button onClick={() => setIsEditModalOpen(true)} style={{ background: 'transparent', border: 'none', color: 'var(--color-gray-400)', cursor: 'pointer' }}>
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={handleDeletePatient}
                                                style={{ background: 'transparent', border: 'none', color: 'var(--color-gray-400)', cursor: 'pointer' }}
                                                className="btn-hover-danger"
                                                title="Supprimer le patient"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', color: 'var(--color-gray-500)', fontSize: 'var(--font-size-md)', marginTop: 'var(--spacing-3)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
                                            <Calendar size={16} />
                                            Né(e) le {patient.birth_date ? formatDateFR(patient.birth_date) : 'N/A'}
                                            {patient.birth_date && (
                                                <span style={{ color: 'var(--color-gray-400)', marginLeft: '4px' }}>
                                                    ({calculateAge(patient.birth_date)} ans)
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Row 1: Date & Countdown */}
                                    <div style={{ display: 'flex', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-8)', flexWrap: 'wrap', alignItems: 'center' }}>
                                        <div className="patient-date-badge">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Calendar size={18} style={{ color: 'var(--color-primary-500)' }} />
                                                <span style={{ fontWeight: '700' }}>{patient.date ? formatDateFR(patient.date) : 'Date non définie'}</span>
                                            </div>
                                            <div className="separator" style={{ width: '1px', height: '16px', background: 'var(--color-primary-100)', margin: '0 4px' }} />
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Clock size={18} style={{ color: 'var(--color-primary-500)' }} />
                                                <span style={{ fontWeight: '700' }}>{patient.surgery_time || 'Non-communiquée'}</span>
                                            </div>
                                        </div>

                                        {/* J-Condition Badge */}
                                        {patient.date && (() => {
                                            const jValue = calculateDaysUntilSurgery(patient.date);
                                            const days = parseInt(jValue.replace(/[J+\-]/g, ''));
                                            const isPostOp = jValue.includes('+');
                                            const isToday = jValue === 'J-0';

                                            let badgeStyle = {
                                                padding: '10px 24px',
                                                borderRadius: '25px',
                                                fontWeight: '800',
                                                fontSize: '18px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            };

                                            if (isToday) {
                                                badgeStyle = { ...badgeStyle, background: 'var(--color-primary-600)', color: 'white' };
                                            } else if (isPostOp) {
                                                badgeStyle = { ...badgeStyle, background: '#37474F', color: 'white' };
                                            } else if (days <= 3) {
                                                badgeStyle = { ...badgeStyle, background: '#E65100', color: 'white' };
                                            } else {
                                                badgeStyle = { ...badgeStyle, background: '#37474F', color: 'white' };
                                            }

                                            return (
                                                <div style={badgeStyle}>
                                                    <Zap size={18} fill="currentColor" />
                                                    {jValue}
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Row 2: Stay Type & Operation */}
                                    <div style={{ display: 'flex', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-4)', flexWrap: 'wrap', alignItems: 'center' }}>
                                        <span className="badge" style={{
                                            background: '#F5F7FA',
                                            color: '#263238',
                                            padding: '8px 24px',
                                            border: '1px solid #CFD8DC',
                                            fontSize: '14px',
                                            fontWeight: '700',
                                            borderRadius: '20px'
                                        }}>
                                            {patient.stay_type || 'Ambulatoire'}
                                        </span>
                                        {(patient.operation || '').split(', ').filter(Boolean).map((op, i) => (
                                            <span key={i} className="badge" style={{
                                                background: 'var(--color-primary-50)',
                                                color: 'var(--color-primary-600)',
                                                padding: '8px 24px',
                                                border: '1px solid var(--color-primary-100)',
                                                fontSize: '14px',
                                                fontWeight: '700',
                                                borderRadius: '20px'
                                            }}>
                                                {op}
                                            </span>
                                        ))}
                                        <button
                                            onClick={() => setIsEditModalOpen(true)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--color-gray-400)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: '4px'
                                            }}
                                            title="Modifier l'intervention"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </div>

                                    {/* Detailed Info Grid */}
                                    <div className="patient-details-grid">
                                        {/* Item 1: Clinique */}
                                        <div>
                                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                                                <MapPin size={12} style={{ color: 'var(--color-gray-400)' }} />
                                                Clinique
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: '8px',
                                                    overflow: 'hidden',
                                                    flexShrink: 0,
                                                    border: '1px solid var(--color-gray-100)'
                                                }}>
                                                    <img src={clinicImage} alt="Clinique" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                                <div style={{ fontWeight: '700', color: 'var(--color-gray-900)', fontSize: '14px' }}>
                                                    {patient.clinic_name || 'Clinique de Vitrolles'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Item 2: Chirurgien */}
                                        <div>
                                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                                                <User size={12} style={{ color: 'var(--color-gray-400)' }} />
                                                Chirurgien
                                            </div>
                                            <div style={{ fontWeight: '700', color: 'var(--color-gray-900)', fontSize: '18px', lineHeight: '1.2' }}>
                                                {patient.surgeon_name || 'Non renseigné'}
                                            </div>
                                        </div>

                                        {/* Item 3: Téléphone */}
                                        <div>
                                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                                                <Phone size={12} style={{ color: 'var(--color-gray-400)' }} />
                                                Téléphone
                                            </div>
                                            <div style={{ fontWeight: '700', color: 'var(--color-gray-900)', fontSize: '20px' }}>
                                                {patient.phone || 'Non renseigné'}
                                            </div>
                                        </div>

                                        {/* Item 4: Email (Aligned in Row 2) */}
                                        <div>
                                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                                                <Mail size={12} style={{ color: 'var(--color-primary-400)' }} />
                                                Email
                                            </div>
                                            <div style={{ fontWeight: '700', color: 'var(--color-gray-900)', fontSize: '16px', wordBreak: 'break-all' }}>
                                                {patient.email || 'Non renseigné'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Hopital Manager DPI Card */}
                        {(patient.ipp || patient.stay_number || patient.weight || patient.height || patient.room_number || patient.referring_doctor || patient.address || patient.admission_datetime || patient.discharge_datetime) ? (
                            <div className="card glass-effect patient-card" style={{ marginTop: 'var(--spacing-6)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-6)', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: 'var(--spacing-4)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px' }}>
                                        <img src={hmIcon} alt="HM Icon" style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: '700' }}>Dossier Hopital Manager (DPI)</h3>
                                        <span style={{ fontSize: '11px', color: 'var(--color-gray-400)' }}>Informations importées automatiquement par capture d'écran</span>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-6)' }}>
                                    {/* Column 1: Identifiants & Logistique */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                                        <h4 style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: 'var(--color-primary-600)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Identifiants & Logistique
                                        </h4>
                                        {patient.ipp && (
                                            <div>
                                                <div style={{ fontSize: '11px', color: 'var(--color-gray-400)', textTransform: 'uppercase' }}>IPP Patient</div>
                                                <div style={{ fontWeight: '700', color: 'var(--color-gray-900)', fontSize: '14px', fontFamily: 'monospace' }}>{patient.ipp}</div>
                                            </div>
                                        )}
                                        {patient.stay_number && (
                                            <div>
                                                <div style={{ fontSize: '11px', color: 'var(--color-gray-400)', textTransform: 'uppercase' }}>N° Séjour</div>
                                                <div style={{ fontWeight: '700', color: 'var(--color-gray-900)', fontSize: '14px', fontFamily: 'monospace' }}>{patient.stay_number}</div>
                                            </div>
                                        )}
                                        {patient.room_number && (
                                            <div>
                                                <div style={{ fontSize: '11px', color: 'var(--color-gray-400)', textTransform: 'uppercase' }}>Chambre / Lit</div>
                                                <div style={{ fontWeight: '700', color: 'var(--color-gray-900)', fontSize: '14px' }}>{patient.room_number}</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Column 2: Paramètres Physiques & Contacts */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                                        <h4 style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: 'var(--color-primary-600)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Paramètres & Contacts
                                        </h4>
                                        {(patient.weight || patient.height) && (
                                            <div>
                                                <div style={{ fontSize: '11px', color: 'var(--color-gray-400)', textTransform: 'uppercase' }}>Taille & Poids</div>
                                                <div style={{ fontWeight: '700', color: 'var(--color-gray-900)', fontSize: '14px' }}>
                                                    {patient.height || '—'} / {patient.weight || '—'}
                                                </div>
                                            </div>
                                        )}
                                        {patient.address && (
                                            <div>
                                                <div style={{ fontSize: '11px', color: 'var(--color-gray-400)', textTransform: 'uppercase' }}>Adresse Principale</div>
                                                <div style={{ fontWeight: '700', color: 'var(--color-gray-900)', fontSize: '13px', lineHeight: '1.4' }}>{patient.address}</div>
                                            </div>
                                        )}
                                        {patient.referring_doctor && (
                                            <div>
                                                <div style={{ fontSize: '11px', color: 'var(--color-gray-400)', textTransform: 'uppercase' }}>Médecin Traitant</div>
                                                <div style={{ fontWeight: '700', color: 'var(--color-gray-900)', fontSize: '14px' }}>{patient.referring_doctor}</div>
                                                {patient.referring_doctor_phone && (
                                                    <div style={{ fontSize: '12px', color: 'var(--color-gray-500)', marginTop: '2px' }}>Tél: {patient.referring_doctor_phone}</div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Column 3: Admission & Flux */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                                        <h4 style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: 'var(--color-primary-600)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Admission & Parcours
                                        </h4>
                                        {patient.admission_datetime && (
                                            <div>
                                                <div style={{ fontSize: '11px', color: 'var(--color-gray-400)', textTransform: 'uppercase' }}>Date/Heure d'Entrée</div>
                                                <div style={{ fontWeight: '700', color: 'var(--color-gray-900)', fontSize: '13px' }}>
                                                    {new Date(patient.admission_datetime).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} à {new Date(patient.admission_datetime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        )}
                                        {patient.discharge_datetime && (
                                            <div>
                                                <div style={{ fontSize: '11px', color: 'var(--color-gray-400)', textTransform: 'uppercase' }}>Date/Heure de Sortie</div>
                                                <div style={{ fontWeight: '700', color: 'var(--color-gray-900)', fontSize: '13px' }}>
                                                    {new Date(patient.discharge_datetime).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} à {new Date(patient.discharge_datetime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        )}
                                        {(patient.entry_mode || patient.exit_mode) && (
                                            <div>
                                                <div style={{ fontSize: '11px', color: 'var(--color-gray-400)', textTransform: 'uppercase' }}>Flux Entrée / Sortie</div>
                                                <div style={{ fontWeight: '700', color: 'var(--color-gray-900)', fontSize: '12px', lineHeight: '1.4' }}>
                                                    {patient.entry_mode || '—'} <br /> <span style={{ color: 'var(--color-gray-400)', fontWeight: 'normal' }}>vers</span> <br /> {patient.exit_mode || '—'}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : null}


                        {/* 3. Clinical Data Area */}
                        <div className="card glass-effect patient-card">
                            <div className="patient-card-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
                                    <div className="card-icon card-icon-primary" style={{ background: 'var(--color-primary-50)', color: 'var(--color-primary-600)', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg viewBox="0 0 727 745" width="24" height="24" fill="currentColor">
                                            <path d="M406.946 1.41211L412.116 2.74513V238.69H524.567L525.86 245.356L317.761 561.282L316.469 324.004H201.433L200.141 320.005L406.946 1.41211ZM381.096 102.722L257.012 292.011L401.776 294.677L344.905 326.67L347.49 462.639L471.573 273.349L324.224 270.683L381.096 241.357V102.722Z" />
                                        </svg>
                                    </div>
                                    <h3>Données Cliniques</h3>
                                </div>
                                <div className="clinical-header-actions">
                                    {/* Onboarding Status & Reset Button */}
                                    {patient.onboarding_completed_at ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{
                                                fontSize: '11px',
                                                color: 'var(--color-primary-600)',
                                                background: 'var(--color-primary-50)',
                                                padding: '6px 14px',
                                                borderRadius: 'var(--radius-full)',
                                                border: '1px solid var(--color-primary-100)',
                                                fontWeight: '700',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}>
                                                <ShieldCheck size={14} />
                                                TUTO OK
                                            </div>
                                            <button 
                                                onClick={handleResetOnboarding}
                                                className="btn-icon"
                                                title="Réinitialiser le didacticiel"
                                                style={{ 
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    background: 'white',
                                                    border: '1px solid var(--color-gray-200)',
                                                    color: 'var(--color-primary-600)',
                                                    boxShadow: 'var(--shadow-sm)',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <RefreshCw size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={handleResetOnboarding}
                                            className="btn-secondary"
                                            style={{ 
                                                padding: '6px 12px',
                                                fontSize: '11px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                borderRadius: 'var(--radius-lg)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <RefreshCw size={14} />
                                            Reset Tuto
                                        </button>
                                    )}

                                    <div style={{
                                        fontSize: 'var(--font-size-xs)',
                                        color: patient.last_consulted_at ? 'var(--color-success-600)' : 'var(--color-gray-400)',
                                        background: patient.last_consulted_at ? 'var(--color-success-50)' : 'var(--color-gray-50)',
                                        padding: '6px 14px',
                                        borderRadius: 'var(--radius-full)',
                                        border: `1px solid ${patient.last_consulted_at ? 'var(--color-success-100)' : 'var(--color-gray-100)'}`,
                                        fontWeight: '500'
                                    }}>
                                        {patient.last_consulted_at ? `Connecté le ${formatDateTimeFR(patient.last_consulted_at)}` : 'Jamais connecté'}
                                    </div>

                                    <button
                                        onClick={handleDownloadSynthesis}
                                        disabled={isGeneratingPDF}
                                        className="btn-pdf-synthesis"
                                    >
                                        {isGeneratingPDF ? <RefreshCw size={14} className="animate-spin" /> : <LogoIcon width="16px" />}
                                        Synthèse PDF
                                    </button>
                                    <button
                                        onClick={handleOpenPortal}
                                        className="btn-open-portal"
                                    >
                                        <ExternalLink size={16} />
                                        Ouvrir Portail Patient
                                    </button>
                                    <button
                                        onClick={() => setIsAddQuestionModalOpen(true)}
                                        className="btn btn-primary btn-sm"
                                        style={{
                                            padding: '8px 16px',
                                            background: 'var(--color-primary-600)',
                                            fontWeight: '600',
                                            boxShadow: 'var(--shadow-sm)'
                                        }}
                                    >
                                        <Plus size={18} style={{ marginRight: '8px' }} />
                                        Ajouter une question
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
                                {/* J-18, J-7 & J-1 Section */}
                                <div>
                                    <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-400)', textTransform: 'uppercase', marginBottom: 'var(--spacing-4)', letterSpacing: '0.05em' }}>
                                        Parcours de soins & Satisfaction
                                    </div>
                                    <div className="grid-3" style={{ gap: 'var(--spacing-4)' }}>
                                        {[
                                            { id: 'welcome_ok', label: 'Activation Portale', screen: 'Bienvenue' },
                                            { id: 'anesthesia_consultation', label: 'Anesthésie', screen: 'J7' },
                                            { id: 'blood_work', label: 'Bilan sanguin', screen: 'J7' },
                                            { id: 'fasting_understood', label: 'Jeûne J-1', screen: 'J1_PreOp' },
                                            { id: 'shower_understood', label: 'Douche J-1', screen: 'J1_PreOp' },
                                            { id: 'admission_confirmed', label: 'Confirmation J-1', screen: 'J1_PreOp' }
                                        ].map(item => (
                                            <div key={item.id} className="card" style={{ padding: 'var(--spacing-4)', background: 'rgba(255,255,255,0.4)', border: '1px solid var(--color-gray-100)' }}>
                                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', marginBottom: '4px' }}>{item.label}</div>
                                                <div style={{ fontWeight: 'var(--font-weight-semibold)', color: clinicalResponses[item.screen][item.id] !== undefined ? 'var(--color-primary-600)' : 'var(--color-gray-300)', fontStyle: clinicalResponses[item.screen][item.id] === undefined ? 'italic' : 'normal' }}>
                                                    {clinicalResponses[item.screen][item.id] === true ? 'OUI' :
                                                        clinicalResponses[item.screen][item.id] === false ? 'NON' : 
                                                        (clinicalResponses[item.screen][item.id] !== undefined && clinicalResponses[item.screen][item.id] !== null ? clinicalResponses[item.screen][item.id] : 'Non renseigné')}
                                                </div>
                                                {responsesMeta[item.screen]?.[item.id]?.updated_at && (
                                                    <div style={{ fontSize: '9px', color: 'var(--color-gray-400)', marginTop: '4px', fontStyle: 'italic' }}>
                                                        le {new Date(responsesMeta[item.screen][item.id].updated_at).toLocaleDateString('fr-FR')} à {new Date(responsesMeta[item.screen][item.id].updated_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Document Uploader - Inserted between Pre-op and Post-op */}
                                <div>
                                    <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-400)', textTransform: 'uppercase', marginBottom: 'var(--spacing-4)', letterSpacing: '0.05em' }}>
                                        Ordonnance du cabinet
                                    </div>
                                    <div style={{ padding: 'var(--spacing-2)' }}>
                                        <input
                                            type="file"
                                            ref={(el) => (fileInputRef.current = el)}
                                            style={{ display: 'none' }}
                                            multiple
                                            onChange={(e) => handleFileUpload(e.target.files)}
                                        />

                                        <div
                                            className={`upload-zone ${isDragging ? 'dragging' : ''}`}
                                            onDragOver={onDragOver}
                                            onDragLeave={onDragLeave}
                                            onDrop={onDrop}
                                            onClick={() => fileInputRef.current.click()}
                                            style={{
                                                border: isDragging ? '2px dashed var(--color-primary-500)' : '2px dashed var(--color-gray-200)',
                                                background: isDragging ? 'var(--color-primary-50)' : 'rgba(255, 255, 255, 0.2)',
                                                borderRadius: 'var(--border-radius-xl)',
                                                padding: 'var(--spacing-4)',
                                                textAlign: 'center',
                                                position: 'relative',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <UploadCloud size={32} style={{ color: isDragging ? 'var(--color-primary-400)' : 'var(--color-gray-300)', marginBottom: 'var(--spacing-2)' }} />
                                            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-900)' }}>
                                                {isDragging ? 'Déposez ici' : 'Glissez-déposez les documents ici'}
                                            </div>
                                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)', marginTop: '2px' }}>(Ordonnances, Arrêt de travail, Consignes...)</div>

                                            {isUploading && (
                                                <div style={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    background: 'rgba(255,255,255,0.8)',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderRadius: 'var(--border-radius-xl)',
                                                    zIndex: 10
                                                }}>
                                                    <div className="spinner" style={{ borderTopColor: 'var(--color-primary-500)' }}></div>
                                                    <div style={{ marginTop: 'var(--spacing-2)', fontWeight: 'bold', color: 'var(--color-primary-600)', fontSize: '12px' }}>Téléchargement...</div>
                                                </div>
                                            )}
                                        </div>

                                        {documents.length > 0 && (
                                            <div style={{ display: 'grid', gap: '8px', marginTop: 'var(--spacing-4)' }}>
                                                {documents.map(doc => (
                                                    <div key={doc.id} className="glass-effect" style={{
                                                        padding: '6px 10px',
                                                        borderRadius: '8px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        border: '1px solid rgba(0,0,0,0.03)'
                                                    }}>
                                                        <div style={{
                                                            width: '28px',
                                                            height: '28px',
                                                            borderRadius: '6px',
                                                            background: 'var(--color-primary-100)',
                                                            color: 'var(--color-primary-600)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}>
                                                            <FileText size={14} />
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: '13px', fontWeight: 'var(--font-weight-medium)', wordBreak: 'break-all' }}>{doc.name}</div>
                                                            <div style={{ fontSize: '11px', color: 'var(--color-gray-400)' }}>{doc.size}</div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '2px' }}>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDownloadDocument(doc.storage_path, doc.name); }}
                                                                style={{
                                                                    background: 'transparent',
                                                                    border: 'none',
                                                                    color: 'var(--color-primary-500)',
                                                                    cursor: 'pointer',
                                                                    padding: '4px',
                                                                    borderRadius: '50%',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center'
                                                                }}
                                                                title="Télécharger"
                                                            >
                                                                <Download size={14} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); removeDocument(doc.id, doc.storage_path); }}
                                                                style={{
                                                                    background: 'transparent',
                                                                    border: 'none',
                                                                    color: 'var(--color-gray-400)',
                                                                    cursor: 'pointer',
                                                                    padding: '4px',
                                                                    borderRadius: '50%',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center'
                                                                }}
                                                                className="btn-hover-danger"
                                                                title="Supprimer"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div style={{
                                            marginTop: 'var(--spacing-4)',
                                            padding: 'var(--spacing-3)',
                                            background: 'var(--color-primary-50)',
                                            borderRadius: 'var(--border-radius-md)',
                                            color: 'var(--color-primary-700)',
                                            fontSize: '11px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--spacing-2)'
                                        }}>
                                            <AlertCircle size={14} />
                                            <span>Lien sécurisé envoyé <b>20 min</b> après le dépôt.</span>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Patient Comments Section */}
                            {(customQuestions.some(q => q.response) || clinicalResponses.J4_Satisfaction.verbatim) && (
                                <div id="patient-comments-section">
                                    <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-400)', textTransform: 'uppercase', marginBottom: 'var(--spacing-4)', letterSpacing: '0.05em' }}>
                                        Commentaires Patient
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                                        {/* Verbatim J+4 */}
                                        {clinicalResponses.J4_Satisfaction.verbatim && (
                                            <div style={{
                                                padding: 'var(--spacing-4)',
                                                background: 'white',
                                                borderRadius: '16px',
                                                border: '1px solid var(--color-primary-100)',
                                                boxShadow: '0 2px 8px rgba(109, 140, 124, 0.05)',
                                                position: 'relative'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-primary-600)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>P</div>
                                                        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-gray-900)' }}>Patient</span>
                                                        <span style={{ fontSize: '11px', color: 'var(--color-gray-400)', fontWeight: '500' }}>• Satisfaction J+4</span>
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: 'var(--color-gray-400)' }}>
                                                        {responsesMeta.J4_Satisfaction?.verbatim ? (
                                                            `${new Date(responsesMeta.J4_Satisfaction.verbatim.updated_at).toLocaleDateString('fr-FR')} à ${new Date(responsesMeta.J4_Satisfaction.verbatim.updated_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                                                        ) : ''}
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '14px', color: 'var(--color-gray-700)', lineHeight: '1.5', fontStyle: 'italic', paddingLeft: '32px' }}>
                                                    "{clinicalResponses.J4_Satisfaction.verbatim}"
                                                </div>
                                            </div>
                                        )}

                                        {/* Custom Questions Responses */}
                                        {customQuestions.filter(q => q.response).map(q => (
                                            <div key={q.id} style={{
                                                padding: 'var(--spacing-4)',
                                                background: 'white',
                                                borderRadius: '16px',
                                                border: '1px solid var(--color-primary-100)',
                                                boxShadow: '0 2px 8px rgba(109, 140, 124, 0.05)',
                                                position: 'relative'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-primary-600)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>P</div>
                                                        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-gray-900)' }}>Patient</span>
                                                        <span style={{ fontSize: '11px', color: 'var(--color-gray-400)', fontWeight: '500' }}>• Question Ponctuelle</span>
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: 'var(--color-gray-400)' }}>
                                                        {q.updated_at ? (
                                                            `${new Date(q.updated_at).toLocaleDateString('fr-FR')} à ${new Date(q.updated_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                                                        ) : ''}
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '12px', color: 'var(--color-gray-500)', marginBottom: '6px', paddingLeft: '32px', fontWeight: '600' }}>
                                                    Q: {q.question_text}
                                                </div>
                                                <div style={{ fontSize: '14px', color: 'var(--color-gray-700)', lineHeight: '1.5', fontStyle: 'italic', paddingLeft: '32px' }}>
                                                    "{q.response}"
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Custom Questions List (Admin side - remains for management) */}
                            {customQuestions.length > 0 && (
                                <div style={{ opacity: 0.8, marginTop: 'var(--spacing-4)' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-400)', textTransform: 'uppercase', marginBottom: 'var(--spacing-4)', letterSpacing: '0.05em' }}>
                                        Gestion des Questions Ponctuelle(s)
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {customQuestions.map(q => (
                                            <div key={q.id} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.2)', borderRadius: '8px', border: '1px solid var(--color-gray-50)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ fontSize: '12px', color: 'var(--color-gray-600)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {q.question_text}
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteCustomQuestion(q.id)}
                                                    style={{ background: 'transparent', border: 'none', color: 'var(--color-gray-300)', cursor: 'pointer' }}
                                                    className="btn-hover-danger"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* J+1 Section */}
                            <div>
                                <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-400)', textTransform: 'uppercase', marginBottom: 'var(--spacing-4)', letterSpacing: '0.05em' }}>
                                    Suivi Post-opératoire (J+1)
                                </div>
                                <div className="grid-3" style={{ gap: 'var(--spacing-4)' }}>
                                    {[
                                        { id: 'nausea_check', label: 'Nausées/Vomiss.' }
                                    ].map(item => (
                                        <div key={item.id} className="card" style={{ padding: 'var(--spacing-4)', background: 'rgba(255,255,255,0.4)', border: '1px solid var(--color-gray-100)' }}>
                                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', marginBottom: '4px' }}>{item.label}</div>
                                            <div style={{ fontWeight: 'var(--font-weight-semibold)', color: clinicalResponses.J1[item.id] !== undefined ? 'var(--color-primary-600)' : 'var(--color-gray-300)', fontStyle: clinicalResponses.J1[item.id] === undefined ? 'italic' : 'normal' }}>
                                                {clinicalResponses.J1[item.id] === true ? 'OUI' : 
                                                 clinicalResponses.J1[item.id] === false ? 'NON' : 
                                                 (clinicalResponses.J1[item.id] !== undefined && clinicalResponses.J1[item.id] !== null ? clinicalResponses.J1[item.id] : 'Non renseigné')}
                                            </div>
                                            {responsesMeta.J1?.[item.id]?.updated_at && (
                                                <div style={{ fontSize: '9px', color: 'var(--color-gray-400)', marginTop: '4px', fontStyle: 'italic' }}>
                                                    le {new Date(responsesMeta.J1[item.id].updated_at).toLocaleDateString('fr-FR')} à {new Date(responsesMeta.J1[item.id].updated_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Satisfaction Section */}
                            <div className="grid-2" style={{ gap: 'var(--spacing-8)' }}>
                                <div>
                                    <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-400)', textTransform: 'uppercase', marginBottom: 'var(--spacing-4)', letterSpacing: '0.05em' }}>
                                        Satisfaction (J+4)
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                                        {[
                                            { id: 'soins_qualite', label: 'Prise en charge' },
                                            { id: 'recommandation', label: 'Recommandation' }
                                        ].map(item => (
                                            <div key={item.id} className="card" style={{
                                                padding: 'var(--spacing-4)',
                                                background: 'rgba(255,255,255,0.4)',
                                                border: '1px solid var(--color-gray-100)'
                                            }}>
                                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', marginBottom: '4px' }}>{item.label}</div>
                                                <div style={{
                                                    fontWeight: 'var(--font-weight-semibold)',
                                                    color: clinicalResponses.J4_Satisfaction[item.id] !== undefined ? 'var(--color-primary-600)' : 'var(--color-gray-300)',
                                                    fontStyle: clinicalResponses.J4_Satisfaction[item.id] === undefined ? 'italic' : 'normal'
                                                }}>
                                                    {clinicalResponses.J4_Satisfaction[item.id] || 'Non renseigné'}
                                                </div>
                                                {responsesMeta.J4_Satisfaction?.[item.id]?.updated_at && (
                                                    <div style={{ fontSize: '9px', color: 'var(--color-gray-400)', marginTop: '4px', fontStyle: 'italic' }}>
                                                        le {new Date(responsesMeta.J4_Satisfaction[item.id].updated_at).toLocaleDateString('fr-FR')} à {new Date(responsesMeta.J4_Satisfaction[item.id].updated_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-400)', textTransform: 'uppercase', marginBottom: 'var(--spacing-4)', letterSpacing: '0.05em' }}>
                                        Enquête e-Satis (National)
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                                        {[
                                            { id: 'global_experience', label: 'Satisfaction Globale (1-10)' },
                                            { id: 'recommend', label: 'Recommanderait l’établissement' }
                                        ].map(item => (
                                            <div key={item.id} className="card" style={{
                                                padding: 'var(--spacing-4)',
                                                background: 'rgba(255,255,255,0.4)',
                                                border: '1px solid var(--color-gray-100)'
                                            }}>
                                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', marginBottom: '4px' }}>{item.label}</div>
                                                <div style={{
                                                    fontWeight: 'var(--font-weight-semibold)',
                                                    color: clinicalResponses.ESATIS[item.id] !== undefined ? 'var(--color-primary-600)' : 'var(--color-gray-300)',
                                                    fontStyle: clinicalResponses.ESATIS[item.id] === undefined ? 'italic' : 'normal'
                                                }}>
                                                    {clinicalResponses.ESATIS[item.id] === true ? 'OUI' : 
                                                     clinicalResponses.ESATIS[item.id] === false ? 'NON' : 
                                                     (clinicalResponses.ESATIS[item.id] !== undefined && clinicalResponses.ESATIS[item.id] !== null ? clinicalResponses.ESATIS[item.id] : 'Non renseigné')}
                                                </div>
                                                {responsesMeta.ESATIS?.[item.id]?.updated_at && (
                                                    <div style={{ fontSize: '9px', color: 'var(--color-gray-400)', marginTop: '4px', fontStyle: 'italic' }}>
                                                        le {new Date(responsesMeta.ESATIS[item.id].updated_at).toLocaleDateString('fr-FR')} à {new Date(responsesMeta.ESATIS[item.id].updated_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main >

            {/* Secure Link Drawer */}
            <Drawer 
                isOpen={isSecureLinkDrawerOpen}
                onClose={() => setIsSecureLinkDrawerOpen(false)}
                title="Accès Patient Sécurisé"
                icon={<ShieldCheck size={20} />}
            >
                <div style={{ padding: 'var(--spacing-6)' }}>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)', marginBottom: 'var(--spacing-6)' }}>
                        Générez un lien unique pour permettre au patient d'accéder à son portail sans mot de passe.
                    </p>

                    {tokenData ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                            <div style={{
                                background: 'white',
                                padding: 'var(--spacing-4)',
                                borderRadius: 'var(--border-radius-lg)',
                                border: '1px dashed var(--color-primary-200)',
                                wordBreak: 'break-all',
                                fontSize: 'var(--font-size-xs)',
                                color: 'var(--color-primary-700)',
                                fontFamily: 'monospace',
                                position: 'relative',
                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                            }}>
                                {`${window.location.origin}/patient-portal/${tokenData.token}`}
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                                <button
                                    onClick={() => copyToClipboard(`${window.location.origin}/patient-portal/${tokenData.token}`)}
                                    className="btn btn-primary btn-sm"
                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-2)' }}
                                >
                                    <Copy size={16} />
                                    Copier le lien
                                </button>
                                <button
                                    onClick={handleGenerateToken}
                                    disabled={isGeneratingToken}
                                    className="btn btn-secondary btn-sm"
                                    title="Régénérer le lien"
                                    style={{ padding: '8px' }}
                                >
                                    <RefreshCw size={16} className={isGeneratingToken ? 'animate-spin' : ''} />
                                </button>
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--color-gray-400)', textAlign: 'center' }}>
                                Lien actif • Créé le {new Date(tokenData.created_at || Date.now()).toLocaleDateString('fr-FR')}
                            </div>
                            <div style={{ marginTop: 'var(--spacing-6)', paddingTop: 'var(--spacing-6)', borderTop: '1px solid var(--color-gray-100)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
                                    <h4 style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-500)', textTransform: 'uppercase', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <History size={14} />
                                        Rappels planifiés {pendingReminders.length > 0 ? `(${pendingReminders.length})` : ''}
                                    </h4>
                                    <button
                                        onClick={() => setIsCustomSMSModalOpen(true)}
                                        className="btn btn-secondary btn-xs"
                                        style={{ fontSize: '10px', padding: '4px 8px', borderColor: 'var(--color-primary-200)', color: 'var(--color-primary-600)' }}
                                    >
                                        <Send size={12} style={{ marginRight: '4px' }} />
                                        SMS personnalisé
                                    </button>
                                </div>

                                {pendingReminders.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {pendingReminders.map(rem => (
                                            <div key={rem.id} style={{ padding: 'var(--spacing-3)', background: 'white', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-gray-100)', boxShadow: 'var(--shadow-sm)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                    <span style={{ fontWeight: 'var(--font-weight-bold)', fontSize: 'var(--font-size-sm)', color: 'var(--color-primary-700)' }}>{rem.screen}</span>
                                                    <span style={{ fontSize: '10px', color: 'var(--color-gray-400)' }}>
                                                        {new Date(rem.scheduled_for).toLocaleDateString('fr-FR')} {new Date(rem.scheduled_for).getHours()}:{String(new Date(rem.scheduled_for).getMinutes()).padStart(2, '0')}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => { setEditingReminder(rem); setIsSMSModalOpen(true); }}
                                                    className="btn btn-secondary btn-sm"
                                                    style={{ width: '100%', fontSize: '11px', padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: 'white' }}
                                                >
                                                    <Edit2 size={12} />
                                                    Gérer / Envoyer
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const mapping = {
                                                            'Bienvenue': '',
                                                            'J-7': 'j7',
                                                            'J-1': 'j1-preop',
                                                            'J-J': '',
                                                            'J+1': 'j1',
                                                            'J+4': 'j4',
                                                            'E-SATIS': 'e-satis'
                                                        };
                                                        const path = mapping[rem.screen] || '';
                                                        const url = `${window.location.origin}/patient-portal/${tokenData.token}${path ? '/' + path : ''}`;
                                                        window.open(url, '_blank');
                                                    }}
                                                    className="btn btn-primary btn-sm"
                                                    style={{ width: '100%', fontSize: '11px', padding: '4px 8px', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                                >
                                                    <Activity size={12} />
                                                    Ouvrir Questionnaire
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '11px', color: 'var(--color-gray-400)', textAlign: 'center', padding: 'var(--spacing-4)', background: 'var(--color-gray-50)', borderRadius: 'var(--border-radius-md)', border: '1px dashed var(--color-gray-200)' }}>
                                        Aucun rappel planifié.
                                    </div>
                                )}

                                <button
                                    onClick={handleRegenerateSchedule}
                                    className="btn btn-secondary"
                                    style={{ width: '100%', marginTop: 'var(--spacing-4)', fontSize: '10px', padding: 'var(--spacing-2)', border: '1px dashed var(--color-gray-300)', background: 'transparent', color: 'var(--color-gray-400)' }}
                                >
                                    <RefreshCw size={12} style={{ marginRight: '4px' }} />
                                    Regénérer le planning complet
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={handleGenerateToken}
                            disabled={isGeneratingToken}
                            className="btn btn-primary"
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-2)' }}
                        >
                            {isGeneratingToken ? <RefreshCw size={18} className="animate-spin" /> : <LinkIcon size={18} />}
                            Générer un lien d'accès
                        </button>
                    )}
                </div>
            </Drawer>

            {/* History Drawer */}
            <Drawer 
                isOpen={isHistoryDrawerOpen}
                onClose={() => setIsHistoryDrawerOpen(false)}
                title="Historique des événements"
                icon={<History size={20} />}
            >
                <div style={{ padding: 'var(--spacing-6)' }}>
                    <div className="timeline" style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '7px', top: 0, bottom: 0, width: '2px', background: 'var(--color-gray-100)' }}></div>
                        {medicalHistory.length > 0 ? (
                            medicalHistory.map((item) => {
                                const isSystemSms = item.type === 'sms_log' || item.category === 'sms';
                                return (
                                    <div key={item.id} className="timeline-item" style={{ paddingLeft: 'var(--spacing-8)', paddingBottom: 'var(--spacing-8)', position: 'relative' }}>
                                        <div style={{
                                            position: 'absolute',
                                            left: 0,
                                            top: '4px',
                                            width: '16px',
                                            height: '16px',
                                            borderRadius: '50%',
                                            background: isSystemSms ? 'var(--color-secondary-500)' : 'var(--color-primary-500)',
                                            border: '3px solid white',
                                            boxShadow: '0 0 0 1px var(--color-gray-100)',
                                            zIndex: 1
                                        }}></div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
                                                <span style={{ fontWeight: 'var(--font-weight-black)', fontSize: 'var(--font-size-md)' }}>{item.title}</span>
                                                {isSystemSms && <span className="badge" style={{ fontSize: '8px', background: 'var(--color-gray-100)', letterSpacing: '0.05em' }}>SMS ENVOYÉ</span>}
                                                {item.status && <span className={`badge badge-${item.status === 'sent' || item.status === 'delivered' ? 'success' : 'danger'}`} style={{ fontSize: '7px' }}>{item.status.toUpperCase()}</span>}
                                            </div>
                                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                                                {isSystemSms ? formatDateTimeFR(item.timestamp || item.date) : formatDateFR(item.timestamp || item.date)} • {isSystemSms ? 'Communication' : 'Événement clinique'}
                                            </div>
                                            {item.description && (
                                                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)', marginTop: '4px', background: 'var(--color-gray-50)', padding: 'var(--spacing-3)', borderRadius: 'var(--border-radius-md)', whiteSpace: 'pre-wrap' }}>
                                                    {item.description}
                                                    {isSystemSms && item.screen && (
                                                        <div style={{ marginTop: '8px', borderTop: '1px solid var(--color-gray-200)', paddingTop: '8px' }}>
                                                            <button
                                                                onClick={() => {
                                                                    const mapping = {
                                                                        'Bienvenue': '',
                                                                        'J-7': 'j7',
                                                                        'J-1': 'j1-preop',
                                                                        'J+1': 'j1',
                                                                        'J+4': 'j4',
                                                                        'E-SATIS': 'e-satis'
                                                                    };
                                                                    const path = mapping[item.screen] || '';
                                                                    const url = `${window.location.origin}/patient-portal/${tokenData.token}${path ? '/' + path : ''}`;
                                                                    window.open(url, '_blank');
                                                                }}
                                                                className="btn btn-secondary btn-xs"
                                                                style={{ fontSize: '10px', padding: '4px 8px', background: 'white' }}
                                                            >
                                                                <Activity size={10} style={{ marginRight: '4px' }} />
                                                                Ouvrir Questionnaire {item.screen}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p style={{ textAlign: 'center', color: 'var(--color-gray-400)', padding: 'var(--spacing-8)' }}>Aucun événement.</p>
                        )}
                    </div>
                </div>
            </Drawer>

            <style dangerouslySetInnerHTML={{
                __html: `
                .patient-review-layout {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: var(--spacing-8);
                }

                .patient-card {
                    padding: var(--spacing-8);
                    position: relative;
                }

                .patient-card-header {
                    margin-bottom: var(--spacing-8);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: var(--spacing-4);
                }

                .clinical-header-actions {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex-wrap: wrap;
                }

                .btn-pdf-synthesis {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    background: var(--color-primary-50);
                    border: 1.5px solid var(--color-primary-500);
                    color: var(--color-primary-700);
                    font-weight: 700;
                    font-size: var(--font-size-sm);
                    border-radius: var(--radius-lg);
                    cursor: pointer;
                    transition: all var(--transition-fast);
                    box-shadow: 0 2px 8px rgba(109, 140, 124, 0.15);
                }

                .btn-pdf-synthesis:hover {
                    background: var(--color-primary-100);
                    border-color: var(--color-primary-600);
                    color: var(--color-primary-800);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(109, 140, 124, 0.25);
                }

                .btn-pdf-synthesis:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                .btn-open-portal {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    background: white;
                    border: 1px solid var(--color-gray-300);
                    color: var(--color-gray-700);
                    font-weight: 600;
                    font-size: var(--font-size-sm);
                    border-radius: var(--radius-lg);
                    cursor: pointer;
                    transition: all var(--transition-fast);
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                }

                .btn-open-portal:hover {
                    background: var(--color-gray-50);
                    color: var(--color-gray-900);
                    border-color: var(--color-gray-400);
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }

                .patient-date-badge {
                    background: white;
                    color: var(--color-primary-700);
                    padding: 10px 24px;
                    border-radius: 25px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    border: 1px solid var(--color-primary-100);
                    box-shadow: 0 2px 8px rgba(109, 140, 124, 0.08);
                }

                .patient-details-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    column-gap: var(--spacing-8);
                    row-gap: var(--spacing-10);
                    margin-top: var(--spacing-10);
                    padding-top: var(--spacing-8);
                    border-top: 1px solid var(--color-gray-100);
                }

                @media (min-width: 768px) {
                    .patient-details-grid {
                        grid-template-columns: 1fr 1fr 1fr;
                    }
                }

                .grid-3 {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: var(--spacing-4);
                }

                @media (min-width: 640px) {
                    .grid-3 {
                        grid-template-columns: 1fr 1fr;
                    }
                }

                @media (min-width: 992px) {
                    .grid-3 {
                        grid-template-columns: 1fr 1fr 1fr;
                    }
                }

                .grid-2 {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: var(--spacing-8);
                }

                @media (min-width: 640px) {
                    .grid-2 {
                        grid-template-columns: 1fr 1fr;
                    }
                }

                @media (max-width: 768px) {
                    .patient-card {
                        padding: var(--spacing-4) !important;
                    }
                    .patient-card-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: var(--spacing-4);
                    }
                    .clinical-header-actions {
                        width: 100%;
                        justify-content: flex-start;
                        gap: 8px;
                    }
                }

                @media (max-width: 480px) {
                    .patient-date-badge {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: var(--spacing-2);
                        border-radius: 16px;
                        padding: 12px 16px;
                        width: 100%;
                    }
                    .patient-date-badge .separator {
                        display: none !important;
                    }
                }

                .drawer-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.4);
                    backdrop-filter: blur(4px);
                    z-index: 2000;
                    opacity: 0;
                    visibility: hidden;
                    display: none;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    pointer-events: none;
                }

                .drawer-overlay.open {
                    opacity: 1;
                    visibility: visible;
                    display: block;
                    pointer-events: auto;
                }

                .drawer-content {
                    position: fixed;
                    top: 0;
                    right: 0;
                    width: 100%;
                    max-width: 450px;
                    height: 100%;
                    background: white;
                    z-index: 2001;
                    box-shadow: -10px 0 40px rgba(0,0,0,0.15);
                    transform: translateX(100%);
                    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    flex-direction: column;
                }

                @media (max-width: 640px) {
                    .drawer-content {
                        max-width: 100%;
                    }
                }

                .drawer-overlay.open .drawer-content {
                    transform: translateX(0);
                }

                .drawer-header {
                    padding: var(--spacing-6) var(--spacing-8);
                    border-bottom: 1px solid var(--color-gray-100);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: var(--color-gray-50);
                }
            `}} />

            <EditPatientModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                patient={patient}
                onPatientUpdated={handlePatientUpdated}
            />

            {
                isSMSModalOpen && (
                    <EditSMSModal
                        isOpen={isSMSModalOpen}
                        onClose={() => { setIsSMSModalOpen(false); setEditingReminder(null); }}
                        patient={{ ...patient, token: tokenData?.token }}
                        reminder={editingReminder || nextReminder}
                        onSend={handleSendManualSMS}
                        onUpdate={handleUpdateReminder}
                    />
                )
            }

            <CustomSMSModal
                isOpen={isCustomSMSModalOpen}
                onClose={() => setIsCustomSMSModalOpen(false)}
                patient={patient}
                onSend={handleSendPunctualSMS}
            />

            <AddQuestionModal
                isOpen={isAddQuestionModalOpen}
                onClose={() => setIsAddQuestionModalOpen(false)}
                onSave={handleAddCustomQuestion}
            />

            <QuestionsPreviewModal
                isOpen={isQuestionsModalOpen}
                onClose={() => setIsQuestionsModalOpen(false)}
            />
            {/* Hidden Report for PDF Generation */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <div ref={reportRef}>
                    <PatientSynthesisReport
                        patient={patient}
                        clinicalResponses={clinicalResponses}
                        responsesMeta={responsesMeta}
                        smsData={medicalHistory.filter(h => h.type === 'sms_log')}
                        medicalHistory={medicalHistory.filter(h => h.type === 'history')}
                        documents={documents}
                        customQuestions={customQuestions}
                    />
                </div>
            </div>
        </div>
    );
}
