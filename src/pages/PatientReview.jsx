import { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import EditPatientModal from '../components/EditPatientModal';
import PatientPreviewModal from '../components/PatientPreviewModal';
import EditSMSModal from '../components/EditSMSModal';
import CustomSMSModal from '../components/CustomSMSModal';
import ClinicAppointmentCard from '../components/ClinicAppointmentCard';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Calendar,
    User,
    Clipboard,
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
    ShieldCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { calculateAge, calculateDaysUntilSurgery, formatDateFR, formatDateTimeFR } from '../utils/dateUtils';
import { getPatientPathwayStatus, getResponses, calculateRiskFlags } from '../services/pathwayService';
import { getDocuments, uploadDocument, deleteDocument, downloadDocument } from '../services/documentService';
import { generatePatientToken, getPatientTokens, revokeToken } from '../services/tokenService';
import { sendManualReminder, getNextPendingReminder, getPendingReminders, sendOverrideSMS, updateReminder, sendPunctualSMS } from '../services/reminderService';
import LogoPremium from '../components/LogoPremium';
import clinicImage from '../assets/clinic.png';

export default function PatientReview() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [medicalHistory, setMedicalHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [clinicalResponses, setClinicalResponses] = useState({
        J7: {},
        J2: {},
        J1: {},
        J2_Satisfaction: {}
    });
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
            const [riskJ7, riskJ2, riskJ1] = await Promise.all([
                calculateRiskFlags(id, 'J7'),
                calculateRiskFlags(id, 'J2'),
                calculateRiskFlags(id, 'J1')
            ]);

            const hasHardRisk = riskJ7.hard.length > 0 || riskJ2.hard.length > 0 || riskJ1.hard.length > 0;
            const hasSoftRisk = riskJ7.soft.length > 0 || riskJ2.soft.length > 0 || riskJ1.soft.length > 0;

            if (hasHardRisk) setRiskStatus('URGENT');
            else if (hasSoftRisk) setRiskStatus('VIGILANCE');
            else setRiskStatus('NORMAL');

            setPatient({
                ...patientData,
                displayProgress: patientData.progress || 0
            });

            // Load history (unified)
            await loadHistoryData(id);

            // Load documents
            const docData = await getDocuments(parseInt(id));
            setDocuments(docData);

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

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Lien copié dans le presse-papier !');
    };

    useEffect(() => {
        if (id) {
            loadPatientData();
            loadTokenData();
            loadNextReminder();
        }
    }, [id]);

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

    const handleRegenerateSchedule = async () => {
        if (!confirm('Cela va supprimer tous les rappels en attente et les remplacer par le nouveau planning complet (Bienvenue J-10 à J+2). Continuer ?')) return;

        try {
            // 1. Delete pending
            await supabase.from('reminder_queue').delete().eq('patient_id', id).eq('status', 'pending');

            // 2. Re-schedule
            const { scheduleTimeBasedReminders } = await import('../services/reminderService');
            await scheduleTimeBasedReminders(id, patient.date);

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
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
                    <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm" style={{ padding: '8px', border: 'none', background: 'transparent' }}>
                        <ChevronLeft size={20} />
                        <span style={{ marginLeft: 'var(--spacing-2)' }}>Retour</span>
                    </button>

                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--spacing-3)' }}>
                        <button
                            onClick={() => setIsPreviewModalOpen(true)}
                            className="btn btn-secondary btn-sm"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-2)',
                                background: 'var(--color-primary-50)',
                                color: 'var(--color-primary-600)',
                                border: '1px solid var(--color-primary-100)',
                                fontWeight: '600'
                            }}
                        >
                            <Eye size={18} />
                            Vue Patient
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) 1fr', gap: 'var(--spacing-8)' }}>
                    {/* Left Column: Data */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>

                        {/* 1. Patient Card */}
                        <div className="card glass-effect" style={{ padding: 'var(--spacing-8)', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: 'var(--spacing-6)', right: 'var(--spacing-8)' }}>
                                <div style={{
                                    background: riskStatus === 'URGENT' ? 'var(--color-danger-50)' : riskStatus === 'VIGILANCE' ? 'var(--color-warning-50)' : 'var(--color-success-50)',
                                    color: riskStatus === 'URGENT' ? 'var(--color-danger-600)' : riskStatus === 'VIGILANCE' ? 'var(--color-warning-600)' : 'var(--color-success-600)',
                                    padding: '8px 20px',
                                    borderRadius: '100px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-2)',
                                    fontWeight: 'var(--font-weight-bold)',
                                    fontSize: 'var(--font-size-sm)',
                                    border: `1px solid ${riskStatus === 'URGENT' ? 'var(--color-danger-100)' : riskStatus === 'VIGILANCE' ? 'var(--color-warning-100)' : 'var(--color-success-100)'}`
                                }}>
                                    <div style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: 'currentColor'
                                    }}></div>
                                    Facteur de risques : {riskStatus}
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)', position: 'relative' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-2)' }}>
                                        <div style={{
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
                                        <div style={{
                                            background: '#FAF7F5',
                                            color: '#6D4C41',
                                            padding: '10px 24px',
                                            borderRadius: '25px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            border: '1px solid #D7C4B0',
                                            boxShadow: '0 2px 8px rgba(215, 196, 176, 0.15)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Calendar size={18} style={{ color: '#6D4C41' }} />
                                                <span style={{ fontWeight: '700', color: '#6D4C41' }}>{patient.date ? formatDateFR(patient.date) : 'Date non définie'}</span>
                                            </div>
                                            <div style={{ width: '1px', height: '16px', background: '#D7C4B0', margin: '0 4px' }} />
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Clock size={18} style={{ color: '#6D4C41' }} />
                                                <span style={{ fontWeight: '700', color: '#6D4C41' }}>{patient.surgery_time || 'Non-communiquée'}</span>
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
                                    <div style={{ display: 'flex', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-4)', flexWrap: 'wrap' }}>
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
                                        <span className="badge" style={{
                                            background: '#FDF7F2',
                                            color: '#8D6E63',
                                            padding: '8px 24px',
                                            border: '1px solid #EEDDCC',
                                            fontSize: '14px',
                                            fontWeight: '700',
                                            borderRadius: '20px'
                                        }}>
                                            {patient.operation}
                                        </span>
                                    </div>

                                    {/* Detailed Info Grid */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr 1fr',
                                        columnGap: 'var(--spacing-8)',
                                        rowGap: 'var(--spacing-10)',
                                        marginTop: 'var(--spacing-10)',
                                        paddingTop: 'var(--spacing-8)',
                                        borderTop: '1px solid var(--color-gray-100)'
                                    }}>
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
                                                {patient.surgeon_name || 'Christophe DESOUCHES'}
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

                                        {/* Item 4: Date & Heure Intervention (Aligned in Row 2) */}
                                        <div>
                                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                                                <Calendar size={12} style={{ color: 'var(--color-gray-400)' }} />
                                                Date & Heure Intervention
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <div style={{
                                                    background: '#FAF7F5',
                                                    color: '#8B7355',
                                                    padding: '4px 12px',
                                                    borderRadius: '6px',
                                                    fontSize: '13px',
                                                    fontWeight: '700',
                                                    width: 'fit-content',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    border: '1px solid #EEDDCC'
                                                }}>
                                                    <Calendar size={14} />
                                                    {patient.date ? formatDateFR(patient.date) : 'Non définie'}
                                                </div>
                                                <div style={{
                                                    background: '#FAF7F5',
                                                    color: '#8B7355',
                                                    padding: '4px 12px',
                                                    borderRadius: '6px',
                                                    fontSize: '13px',
                                                    fontWeight: '700',
                                                    width: 'fit-content',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    border: '1px solid #EEDDCC'
                                                }}>
                                                    <Clock size={14} />
                                                    {patient.surgery_time || 'Non-communiquée'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Item 5: Email (Aligned in Row 2) */}
                                        <div>
                                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                                                <Mail size={12} style={{ color: 'var(--color-gray-400)' }} />
                                                Email
                                            </div>
                                            <div style={{ fontWeight: '700', color: 'var(--color-gray-900)', fontSize: '16px' }}>
                                                {patient.email || 'Non renseigné'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* 3. Clinical Data Area */}
                        <div className="card glass-effect" style={{ padding: 'var(--spacing-8)' }}>
                            <div className="card-header" style={{ marginBottom: 'var(--spacing-8)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
                                    <div className="card-icon card-icon-primary" style={{ background: 'var(--color-primary-50)', color: 'var(--color-primary-600)', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg viewBox="0 0 727 745" width="24" height="24" fill="currentColor">
                                            <path d="M406.946 1.41211L412.116 2.74513V238.69H524.567L525.86 245.356L317.761 561.282L316.469 324.004H201.433L200.141 320.005L406.946 1.41211ZM381.096 102.722L257.012 292.011L401.776 294.677L344.905 326.67L347.49 462.639L471.573 273.349L324.224 270.683L381.096 241.357V102.722Z" />
                                        </svg>
                                    </div>
                                    <h3>Données Cliniques</h3>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
                                    <div style={{
                                        fontSize: 'var(--font-size-xs)',
                                        color: patient.last_consulted_at ? 'var(--color-success-600)' : 'var(--color-gray-400)',
                                        background: patient.last_consulted_at ? 'var(--color-success-50)' : 'var(--color-gray-50)',
                                        padding: '4px 12px',
                                        borderRadius: 'var(--radius-full)',
                                        border: `1px solid ${patient.last_consulted_at ? 'var(--color-success-100)' : 'var(--color-gray-100)'}`,
                                        fontWeight: '500'
                                    }}>
                                        {patient.last_consulted_at ? (
                                            `Consulté le ${new Date(patient.last_consulted_at).toLocaleDateString('fr-FR')} à ${new Date(patient.last_consulted_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} par ${patient.name}`
                                        ) : (
                                            "Non encore consulté par le patient"
                                        )}
                                    </div>
                                    <button className="btn btn-secondary btn-xs" style={{ color: 'var(--color-orange-600)', background: 'var(--color-orange-50)', border: 'none', padding: '6px 12px' }}>
                                        <Edit2 size={14} style={{ marginRight: '6px' }} />
                                        Corriger
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
                                {/* J-7 & J-2 Section */}
                                <div>
                                    <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-400)', textTransform: 'uppercase', marginBottom: 'var(--spacing-4)', letterSpacing: '0.05em' }}>
                                        Bilan Pré-opératoire (J-7 & J-2)
                                    </div>
                                    <div className="grid-3" style={{ gap: 'var(--spacing-4)' }}>
                                        {[
                                            { id: 'anesthesia_consultation', label: 'consult_anesth' },
                                            { id: 'blood_work', label: 'bilan_cardio' },
                                            { id: 'companion_confirmed', label: 'accompagnant' },
                                            { id: 'hair_removal_cream', label: 'test_creme' },
                                            { id: 'fasting_understood', label: 'jeune_ok' },
                                            { id: 'shower_planned', label: 'douche_ok' },
                                            { id: 'no_razor', label: 'epilation_method' }
                                        ].map(item => (
                                            <div key={item.id} className="card" style={{ padding: 'var(--spacing-4)', background: 'rgba(255,255,255,0.4)', border: '1px solid var(--color-gray-100)' }}>
                                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', marginBottom: '4px' }}>{item.label}</div>
                                                <div style={{ fontWeight: 'var(--font-weight-semibold)', color: (clinicalResponses.J7[item.id] !== undefined || clinicalResponses.J2[item.id] !== undefined) ? 'var(--color-primary-600)' : 'var(--color-gray-300)', fontStyle: (clinicalResponses.J7[item.id] === undefined && clinicalResponses.J2[item.id] === undefined) ? 'italic' : 'normal' }}>
                                                    {clinicalResponses.J7[item.id] === true || clinicalResponses.J2[item.id] === true ? 'OUI' :
                                                        clinicalResponses.J7[item.id] === false || clinicalResponses.J2[item.id] === false ? 'NON' : 'Non renseigné'}
                                                </div>
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
                                                            <div style={{ fontSize: '13px', fontWeight: 'var(--font-weight-medium)' }}>{doc.name}</div>
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

                                {/* J+1 Section */}
                                <div>
                                    <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-400)', textTransform: 'uppercase', marginBottom: 'var(--spacing-4)', letterSpacing: '0.05em' }}>
                                        Suivi Post-opératoire (J+1)
                                    </div>
                                    <div className="grid-3" style={{ gap: 'var(--spacing-4)' }}>
                                        {[
                                            { id: 'has_pain', label: 'douleur' },
                                            { id: 'fever_infection', label: 'fievre' },
                                            { id: 'bleeding', label: 'pansement_tache' },
                                            { id: 'ponv_check', label: 'nausees' },
                                            { id: 'urine_ok', label: 'urine_ok' },
                                            { id: 'pain_medication', label: 'medocs_pris' },
                                            { id: 'urgency', label: 'urgence_vitale' }
                                        ].map(item => (
                                            <div key={item.id} className="card" style={{ padding: 'var(--spacing-4)', background: 'rgba(255,255,255,0.4)', border: '1px solid var(--color-gray-100)' }}>
                                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', marginBottom: '4px' }}>{item.label}</div>
                                                <div style={{ fontWeight: 'var(--font-weight-semibold)', color: clinicalResponses.J1[item.id] !== undefined ? 'var(--color-primary-600)' : 'var(--color-gray-300)', fontStyle: clinicalResponses.J1[item.id] === undefined ? 'italic' : 'normal' }}>
                                                    {clinicalResponses.J1[item.id] === true ? 'OUI' : clinicalResponses.J1[item.id] === false ? 'NON' : 'Non renseigné'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Satisfaction Section */}
                                <div>
                                    <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-400)', textTransform: 'uppercase', marginBottom: 'var(--spacing-4)', letterSpacing: '0.05em' }}>
                                        Satisfaction (J+2)
                                    </div>
                                    <div className="grid-2" style={{ gap: 'var(--spacing-4)' }}>
                                        <div className="card" style={{ padding: 'var(--spacing-4)', background: 'rgba(255,255,255,0.4)', border: '1px solid var(--color-gray-100)' }}>
                                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', marginBottom: '4px' }}>nps</div>
                                            <div style={{
                                                fontWeight: 'var(--font-weight-semibold)',
                                                color: clinicalResponses.J2_Satisfaction?.nps !== undefined ? 'var(--color-primary-600)' : 'var(--color-gray-300)',
                                                fontStyle: clinicalResponses.J2_Satisfaction?.nps === undefined ? 'italic' : 'normal'
                                            }}>
                                                {clinicalResponses.J2_Satisfaction?.nps !== undefined ? `${clinicalResponses.J2_Satisfaction.nps}/10` : 'Non renseigné'}
                                            </div>
                                        </div>
                                        <div className="card" style={{ padding: 'var(--spacing-4)', background: 'rgba(255,255,255,0.4)', border: '1px solid var(--color-gray-100)' }}>
                                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', marginBottom: '4px' }}>commentaire</div>
                                            <div style={{
                                                fontWeight: 'var(--font-weight-semibold)',
                                                color: clinicalResponses.J2_Satisfaction?.commentaire ? 'var(--color-primary-600)' : 'var(--color-gray-300)',
                                                fontStyle: !clinicalResponses.J2_Satisfaction?.commentaire ? 'italic' : 'normal',
                                                fontSize: 'var(--font-size-sm)'
                                            }}>
                                                {clinicalResponses.J2_Satisfaction?.commentaire || 'Non renseigné'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 4. Protocol Progress */}
                        <div className="card glass-effect" style={{ padding: 'var(--spacing-8)' }}>
                            <div className="card-header" style={{ marginBottom: 'var(--spacing-6)' }}>
                                <div className="card-icon card-icon-success">
                                    <Activity size={20} />
                                </div>
                                <h3>État du Protocole</h3>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 'var(--font-size-4xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary-500)', marginBottom: 'var(--spacing-2)' }}>
                                    {patient.displayProgress || patient.progress || 0}%
                                </div>
                                <div className="progress-bar" style={{ height: '12px', background: 'var(--color-gray-100)', borderRadius: '6px', overflow: 'hidden', marginBottom: 'var(--spacing-4)' }}>
                                    <div className="progress-fill progress-fill-primary" style={{ width: `${patient.displayProgress || patient.progress || 0}%`, height: '100%', transition: 'width 0.5s ease' }}></div>
                                </div>
                                <div className="badge badge-success" style={{ padding: '8px 20px', borderRadius: '20px' }}>Protocole en cours d'exécution</div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: history & Secure Link */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
                        {/* Secure Link Card */}
                        <div className="card glass-effect" style={{ padding: 'var(--spacing-8)', border: '1px solid var(--color-primary-100)' }}>
                            <div className="card-header" style={{ marginBottom: 'var(--spacing-6)' }}>
                                <div className="card-icon card-icon-primary" style={{ background: 'var(--color-primary-50)', color: 'var(--color-primary-600)' }}>
                                    <ShieldCheck size={20} />
                                </div>
                                <h3>Accès Patient Sécurisé</h3>
                            </div>

                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)', marginBottom: 'var(--spacing-6)' }}>
                                Générez un lien unique pour permettre au patient d'accéder à son portail sans mot de passe.
                            </p>

                            {tokenData ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                                    <div style={{
                                        background: 'var(--color-gray-50)',
                                        padding: 'var(--spacing-4)',
                                        borderRadius: 'var(--border-radius-lg)',
                                        border: '1px dashed var(--color-gray-200)',
                                        wordBreak: 'break-all',
                                        fontSize: 'var(--font-size-xs)',
                                        color: 'var(--color-primary-700)',
                                        fontFamily: 'monospace',
                                        position: 'relative'
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
                                            onClick={() => window.open(`${window.location.origin}/patient-portal/${tokenData.token}`, '_blank')}
                                            className="btn btn-secondary btn-sm"
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px' }}
                                            title="Ouvrir le lien"
                                        >
                                            <Eye size={16} />
                                            Ouvrir
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
                                                    <div key={rem.id} style={{ padding: 'var(--spacing-3)', background: 'var(--color-gray-50)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-gray-200)' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                            <span style={{ fontWeight: 'var(--font-weight-bold)', fontSize: 'var(--font-size-sm)', color: 'var(--color-purple-700)' }}>{rem.screen}</span>
                                                            <span style={{ fontSize: '10px', color: 'var(--color-gray-500)' }}>
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

                        {/* History Card */}
                        <div className="card glass-effect" style={{ height: 'fit-content', padding: 'var(--spacing-8)' }}>
                            <div className="card-header" style={{ marginBottom: 'var(--spacing-8)' }}>
                                <div className="card-icon card-icon-primary" style={{ background: 'var(--color-purple-50)', color: 'var(--color-purple-600)' }}>
                                    <History size={20} />
                                </div>
                                <h3>Historique des événements</h3>
                            </div>


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
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
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
                    </div>
                </div>
            </main >

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

            <PatientPreviewModal
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                patient={patient}
                onResponseSaved={handleModalResponseSaved}
                onStatusChange={loadPatientData}
            />

        </div >
    );
}
