import { useState, useEffect } from 'react';
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
    ShieldCheck,
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
import { getDocuments, uploadDocument, deleteDocument } from '../services/documentService';
import LogoPremium from '../components/LogoPremium';

export default function PatientReview() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [medicalHistory, setMedicalHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingHistory, setIsAddingHistory] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [clinicalResponses, setClinicalResponses] = useState({
        J7: {},
        J2: {},
        J1: {},
        J2_Satisfaction: {}
    });
    const [riskStatus, setRiskStatus] = useState('SAIN'); // SAIN, VIGILANCE, CRITIQUE
    const [activeTab, setActiveTab] = useState('overview'); // Not used but kept for logic if needed
    const [historyCategory, setHistoryCategory] = useState('all'); // 'all', 'intervention', 'sms'
    const [newHistoryEntry, setNewHistoryEntry] = useState({
        date: new Date().toISOString().split('T')[0],
        title: '',
        description: '',
        category: 'intervention'
    });
    const [documents, setDocuments] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = { current: null }; // Will be assigned by ref prop

    useEffect(() => {
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

                if (hasHardRisk) setRiskStatus('CRITIQUE');
                else if (hasSoftRisk) setRiskStatus('VIGILANCE');
                else setRiskStatus('SAIN');

                // Calculate display progress
                let progress = 0;
                if (Object.keys(responsesJ7).length > 0) progress += 25;
                if (Object.keys(responsesJ2).length > 0) progress += 25;
                if (Object.keys(responsesJ1).length > 0) progress += 25;
                // J+2 placeholder
                setPatient(prev => ({ ...prev, displayProgress: progress }));

                // Load documents
                const docData = await getDocuments(id);
                setDocuments(docData);

            } catch (err) {
                console.error('Error loading patient:', err);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            loadPatientData();
        }
    }, [id]);

    const handleAddHistoryEntry = async () => {
        if (!newHistoryEntry.date || !newHistoryEntry.title) {
            alert('Veuillez remplir au moins la date et le titre.');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('medical_history')
                .insert([{
                    patient_id: id,
                    date: newHistoryEntry.date,
                    title: newHistoryEntry.title,
                    description: newHistoryEntry.description,
                    category: historyCategory
                }])
                .select();

            if (error) throw error;

            // Add to local state
            setMedicalHistory([data[0], ...medicalHistory]);
            setIsAddingHistory(false);
            setNewHistoryEntry({ date: '', title: '', description: '', category: historyCategory });
        } catch (err) {
            console.error('Error adding history entry:', err);
            alert(`Erreur: ${err.message}`);
        }
    };

    const handleFileUpload = async (files) => {
        setIsLoading(true);
        try {
            for (const file of Array.from(files)) {
                const { success, data, error } = await uploadDocument(id, file);
                if (success) {
                    setDocuments(prev => [data, ...prev]);
                } else {
                    alert(`Erreur lors de l'envoi de ${file.name}: ${error}`);
                }
            }
        } finally {
            setIsLoading(false);
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

    const handleDeleteHistoryEntry = async (historyId) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('medical_history')
                .delete()
                .eq('id', historyId);

            if (error) throw error;

            // Remove from local state
            setMedicalHistory(medicalHistory.filter(item => item.id !== historyId));
        } catch (err) {
            console.error('Error deleting history entry:', err);
            alert(`Erreur: ${err.message}`);
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
                                    background: riskStatus === 'CRITIQUE' ? 'var(--color-danger-50)' : riskStatus === 'VIGILANCE' ? 'var(--color-warning-50)' : 'var(--color-success-50)',
                                    color: riskStatus === 'CRITIQUE' ? 'var(--color-danger-600)' : riskStatus === 'VIGILANCE' ? 'var(--color-warning-600)' : 'var(--color-success-600)',
                                    padding: '8px 20px',
                                    borderRadius: '100px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-2)',
                                    fontWeight: 'var(--font-weight-bold)',
                                    fontSize: 'var(--font-size-sm)',
                                    border: `1px solid ${riskStatus === 'CRITIQUE' ? 'var(--color-danger-100)' : riskStatus === 'VIGILANCE' ? 'var(--color-warning-100)' : 'var(--color-success-100)'}`
                                }}>
                                    <div style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: 'currentColor'
                                    }}></div>
                                    Score : {riskStatus}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-6)', position: 'relative' }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    background: 'var(--color-primary-100)',
                                    color: 'var(--color-primary-600)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 'var(--font-size-3xl)',
                                    fontWeight: 'var(--font-weight-black)'
                                }}>
                                    {patient.name?.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-2)' }}>
                                        <h2 style={{ fontSize: 'var(--font-size-3xl)', margin: 0, fontWeight: 'var(--font-weight-black)' }}>{patient.name}</h2>
                                        <button onClick={() => setIsEditModalOpen(true)} style={{ background: 'transparent', border: 'none', color: 'var(--color-gray-400)', cursor: 'pointer' }}>
                                            <Edit2 size={18} />
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
                                {documents.length === 0 && <p style={{ marginTop: 'var(--spacing-6)', color: 'var(--color-gray-400)', fontSize: 'var(--font-size-sm)' }}>Aucun document disponible.</p>}
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
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeDocument(doc.id, doc.storage_path); }}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: 'var(--color-gray-400)',
                                                    cursor: 'pointer',
                                                    padding: '8px',
                                                    borderRadius: '50%'
                                                }}
                                                className="btn-hover-danger"
                                            >
                                                <Trash2 size={16} />
                                            </button>
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
                                <button className="btn btn-secondary btn-xs" style={{ color: 'var(--color-orange-600)', background: 'var(--color-orange-50)', border: 'none', padding: '6px 12px' }}>
                                    <Edit2 size={14} style={{ marginRight: '6px' }} />
                                    Corriger
                                </button>
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

                    {/* Right Column: History */}
                    <div className="card glass-effect" style={{ height: 'fit-content', padding: 'var(--spacing-8)', position: 'sticky', top: 'var(--spacing-8)' }}>
                        <div className="card-header" style={{ marginBottom: 'var(--spacing-8)' }}>
                            <div className="card-icon card-icon-primary" style={{ background: 'var(--color-purple-50)', color: 'var(--color-purple-600)' }}>
                                <History size={20} />
                            </div>
                            <h3>Historique</h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-8)' }}>
                            <button
                                className="btn btn-primary btn-sm"
                                style={{ justifyContent: 'center', width: '100%', borderRadius: 'var(--border-radius-lg)' }}
                                onClick={() => setIsAddingHistory(true)}
                            >
                                <Plus size={16} />
                                Ajouter un événement
                            </button>
                        </div>

                        {/* History Entry Form */}
                        {isAddingHistory && (
                            <div className="card" style={{ marginBottom: 'var(--spacing-8)', background: 'rgba(255,255,255,0.8)', border: '1px solid var(--color-primary-100)', padding: 'var(--spacing-6)' }}>
                                <div style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: 'var(--color-gray-400)', textTransform: 'uppercase', marginBottom: '4px' }}>Catégorie</label>
                                        <div style={{ display: 'flex', gap: '2px', background: 'var(--color-gray-50)', padding: '2px', borderRadius: '6px' }}>
                                            <button onClick={() => setHistoryCategory('intervention')} style={{ flex: 1, padding: '6px', border: 'none', borderRadius: '4px', background: historyCategory === 'intervention' || historyCategory === 'all' ? 'white' : 'transparent', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: historyCategory === 'intervention' || historyCategory === 'all' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}>Intervention</button>
                                            <button onClick={() => setHistoryCategory('sms')} style={{ flex: 1, padding: '6px', border: 'none', borderRadius: '4px', background: historyCategory === 'sms' ? 'white' : 'transparent', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: historyCategory === 'sms' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}>SMS</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: 'var(--color-gray-400)', textTransform: 'uppercase', marginBottom: '4px' }}>Date</label>
                                        <input type="date" className="input" style={{ fontSize: '13px', padding: '8px' }} value={newHistoryEntry.date} onChange={(e) => setNewHistoryEntry({ ...newHistoryEntry, date: e.target.value })} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: 'var(--color-gray-400)', textTransform: 'uppercase', marginBottom: '4px' }}>Titre</label>
                                        <input className="input" style={{ fontSize: '13px', padding: '8px' }} placeholder="Titre..." value={newHistoryEntry.title} onChange={(e) => setNewHistoryEntry({ ...newHistoryEntry, title: e.target.value })} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: 'var(--color-gray-400)', textTransform: 'uppercase', marginBottom: '4px' }}>Détails</label>
                                        <textarea className="input" style={{ fontSize: '13px', padding: '8px' }} rows={2} placeholder="Description..." value={newHistoryEntry.description} onChange={(e) => setNewHistoryEntry({ ...newHistoryEntry, description: e.target.value })} />
                                    </div>
                                    <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                                        <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => setIsAddingHistory(false)}>Annuler</button>
                                        <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={handleAddHistoryEntry}>Enregistrer</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="timeline" style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '7px', top: 0, bottom: 0, width: '2px', background: 'var(--color-gray-100)' }}></div>
                            {medicalHistory.length > 0 ? (
                                medicalHistory.map((item) => (
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
                                        <button
                                            onClick={() => handleDeleteHistoryEntry(item.id)}
                                            style={{ position: 'absolute', top: 0, right: 0, background: 'transparent', border: 'none', color: 'var(--color-gray-200)', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p style={{ textAlign: 'center', color: 'var(--color-gray-400)', padding: 'var(--spacing-8)' }}>Aucun événement.</p>
                            )}
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
            />

        </div>
    );
}
