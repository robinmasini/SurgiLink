import { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import EditPatientModal from '../components/EditPatientModal';
import PatientPreviewModal from '../components/PatientPreviewModal';
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
    Eye
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { calculateAge, formatDateFR } from '../utils/dateUtils';
import { getPatientPathwayStatus, getResponses, calculateRiskFlags } from '../services/pathwayService';
import { getDocuments, uploadDocument, deleteDocument, downloadDocument } from '../services/documentService';
import { generatePatientToken, getPatientTokens, revokeToken } from '../services/tokenService';
import LogoPremium from '../components/LogoPremium';
import { Link as LinkIcon, Copy, RefreshCw, ShieldCheck } from 'lucide-react';

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

            // Load medical history
            const { data: historyData, error: historyError } = await supabase
                .from('medical_history')
                .select('*')
                .eq('patient_id', id)
                .order('date', { ascending: false });

            if (historyError && historyError.code !== 'PGRST116') { // Ignore "not found" error
                console.error('Error loading history:', historyError);
            } else {
                setMedicalHistory(historyData || []);
            }
            // Load clinical responses
            const [responsesJ7, responsesJ2, responsesJ1, responsesSatisfaction] = await Promise.all([
                getResponses(id, 'J7'),
                getResponses(id, 'J2'),
                getResponses(id, 'J1'),
                getResponses(id, 'J2_Satisfaction')
            ]);

            setClinicalResponses({
                J7: responsesJ7,
                J2: responsesJ2,
                J1: responsesJ1,
                J2_Satisfaction: responsesSatisfaction
            });

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
        }
    }, [id]);


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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', color: 'var(--color-gray-500)', fontSize: 'var(--font-size-md)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
                                            <Calendar size={16} />
                                            Né(e) le {patient.birth_date ? formatDateFR(patient.birth_date) : 'N/A'}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-4)', flexWrap: 'wrap' }}>
                                        <span className="badge" style={{ background: 'var(--color-gray-100)', color: 'var(--color-gray-700)', padding: '6px 16px' }}>{patient.stay_type || 'Ambulatoire'}</span>
                                        <span className="badge" style={{ background: 'var(--color-primary-50)', color: 'var(--color-primary-600)', padding: '6px 16px' }}>{patient.operation}</span>
                                        <span className="badge" style={{
                                            background: '#F5F1EE',
                                            color: '#8B7355',
                                            padding: '6px 16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--spacing-2)',
                                            border: '1px solid #EADDCD'
                                        }}>
                                            <Calendar size={14} />
                                            {patient.date ? formatDateFR(patient.date) : 'Date non définie'}
                                            <span style={{ opacity: 0.3, margin: '0 2px' }}>|</span>
                                            <Clock size={14} />
                                            {patient.surgery_time || '07:30'}
                                        </span>
                                    </div>

                                    {/* Detailed Info Grid */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--spacing-6)', marginTop: 'var(--spacing-6)', paddingTop: 'var(--spacing-6)', borderTop: '1px solid var(--color-gray-100)' }}>
                                        <div>
                                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase', marginBottom: '4px' }}>Chirurgien</div>
                                            <div style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-gray-900)' }}>{patient.surgeon_name || 'Dr. Christophe DESOUCHES'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase', marginBottom: '4px' }}>Date & Heure Intervention</div>
                                            <div style={{ fontWeight: 'var(--font-weight-semibold)', color: '#8B7355', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {patient.date ? formatDateFR(patient.date) : 'Non définie'}
                                                <span style={{ color: 'var(--color-gray-300)' }}>à</span>
                                                {patient.surgery_time || '07:30'}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase', marginBottom: '4px' }}>Téléphone</div>
                                            <div style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-gray-900)' }}>{patient.phone || 'Non renseigné'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase', marginBottom: '4px' }}>Email</div>
                                            <div style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-gray-900)' }}>{patient.email || 'Non renseigné'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Documents Section */}
                        <div className="card glass-effect" style={{ padding: 'var(--spacing-8)' }}>
                            <div className="card-header" style={{ marginBottom: 'var(--spacing-6)' }}>
                                <div className="card-icon card-icon-primary" style={{ background: 'var(--color-primary-50)', color: 'var(--color-primary-600)' }}>
                                    <FileText size={20} />
                                </div>
                                <h3>Ordonnance du cabinet</h3>
                            </div>

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
                                    background: isDragging ? 'var(--color-primary-50)' : 'rgba(255, 255, 255, 0.4)',
                                    borderRadius: 'var(--border-radius-xl)',
                                    padding: 'var(--spacing-10)',
                                    textAlign: 'center',
                                    position: 'relative',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <UploadCloud size={48} style={{ color: isDragging ? 'var(--color-primary-400)' : 'var(--color-gray-300)', marginBottom: 'var(--spacing-4)' }} />
                                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-900)' }}>
                                    {isDragging ? 'Déposez les fichiers ici' : 'Glissez-déposez les documents ici'}
                                </div>
                                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-400)', marginTop: '4px' }}>(Ordonnances, Arrêt de travail, Consignes...)</div>
                                {documents.length === 0 && !isUploading && <p style={{ marginTop: 'var(--spacing-6)', color: 'var(--color-gray-400)', fontSize: 'var(--font-size-sm)' }}>Aucun document disponible.</p>}

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
                                        <div style={{ marginTop: 'var(--spacing-4)', fontWeight: 'bold', color: 'var(--color-primary-600)' }}>Téléchargement en cours...</div>
                                    </div>
                                )}
                            </div>

                            {documents.length > 0 && (
                                <div style={{ display: 'grid', gap: '12px', marginTop: 'var(--spacing-6)' }}>
                                    {documents.map(doc => (
                                        <div key={doc.id} className="glass-effect" style={{
                                            padding: '12px 16px',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            border: '1px solid rgba(0,0,0,0.03)'
                                        }}>
                                            <div style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '8px',
                                                background: 'var(--color-primary-100)',
                                                color: 'var(--color-primary-600)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <FileText size={18} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>{doc.name}</div>
                                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)' }}>{doc.size} • {new Date(doc.created_at || new Date()).toLocaleDateString('fr-FR')}</div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDownloadDocument(doc.storage_path, doc.name); }}
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: 'var(--color-primary-500)',
                                                        cursor: 'pointer',
                                                        padding: '8px',
                                                        borderRadius: '50%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                    title="Télécharger"
                                                >
                                                    <Download size={18} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); removeDocument(doc.id, doc.storage_path); }}
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: 'var(--color-gray-400)',
                                                        cursor: 'pointer',
                                                        padding: '8px',
                                                        borderRadius: '50%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                    className="btn-hover-danger"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{
                                marginTop: 'var(--spacing-6)',
                                padding: 'var(--spacing-4)',
                                background: 'var(--color-primary-50)',
                                borderRadius: 'var(--border-radius-md)',
                                color: 'var(--color-primary-700)',
                                fontSize: 'var(--font-size-sm)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-3)'
                            }}>
                                <AlertCircle size={18} />
                                <span>Un SMS contenant le lien sécurisé sera envoyé automatiquement au patient <b>20 minutes</b> après le dépôt du document.</span>
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
                                <h3>Historique</h3>
                            </div>


                            <div className="timeline" style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '7px', top: 0, bottom: 0, width: '2px', background: 'var(--color-gray-100)' }}></div>
                                {medicalHistory.filter(item => item.category === 'sms').length > 0 ? (
                                    medicalHistory.filter(item => item.category === 'sms').map((item) => (
                                        <div key={item.id} className="timeline-item" style={{ paddingLeft: 'var(--spacing-8)', paddingBottom: 'var(--spacing-8)', position: 'relative' }}>
                                            <div style={{
                                                position: 'absolute',
                                                left: 0,
                                                top: '4px',
                                                width: '16px',
                                                height: '16px',
                                                borderRadius: '50%',
                                                background: item.category === 'sms' ? 'var(--color-secondary-500)' : 'var(--color-primary-500)',
                                                border: '3px solid white',
                                                boxShadow: '0 0 0 1px var(--color-gray-100)',
                                                zIndex: 1
                                            }}></div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                                                    <span style={{ fontWeight: 'var(--font-weight-black)', fontSize: 'var(--font-size-md)' }}>{item.title}</span>
                                                    {item.category === 'sms' && <span className="badge" style={{ fontSize: '8px', background: 'var(--color-gray-100)', letterSpacing: '0.05em' }}>SYSTEME</span>}
                                                </div>
                                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                                                    {formatDateFR(item.date)} • {item.category === 'sms' ? 'SMS envoyé' : 'Intervention'}
                                                </div>
                                                {item.description && (
                                                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)', marginTop: '4px', background: 'var(--color-gray-50)', padding: 'var(--spacing-3)', borderRadius: 'var(--border-radius-md)' }}>
                                                        {item.description}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p style={{ textAlign: 'center', color: 'var(--color-gray-400)', padding: 'var(--spacing-8)' }}>Aucun événement.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <EditPatientModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                patient={patient}
                onPatientUpdated={handlePatientUpdated}
            />

            <PatientPreviewModal
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                patient={patient}
                onResponseSaved={handleModalResponseSaved}
                onStatusChange={loadPatientData}
            />

        </div>
    );
}
