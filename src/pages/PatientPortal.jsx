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

export default function PatientPortal() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [patient, setPatient] = useState(null);
    const [activeTab, setActiveTab] = useState('info'); // 'info', 'questionnaires', 'tracker'
    const [medicalHistory, setMedicalHistory] = useState([]);

    useEffect(() => {
        loadPatientData();
    }, [token]);

    const loadPatientData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Validate token and get patient ID
            const validation = await validateToken(token);

            if (!validation.valid) {
                setError(validation.error || 'Lien invalid');
                setLoading(false);
                return;
            }

            // Load patient data
            const { data: patientData, error: patientError } = await supabase
                .from('patients')
                .select('*')
                .eq('id', validation.patientId)
                .single();

            if (patientError) throw patientError;
            setPatient(patientData);

            // Load medical history
            const { data: historyData, error: historyError } = await supabase
                .from('medical_history')
                .select('*')
                .eq('patient_id', validation.patientId)
                .order('date', { ascending: false });

            if (!historyError) {
                setMedicalHistory(historyData || []);
            }

        } catch (err) {
            console.error('Error loading patient data:', err);
            setError('Erreur lors du chargement de vos données');
        } finally {
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

                {/* Navigation Tabs */}
                <div className="card glass-effect" style={{ marginBottom: 'var(--spacing-4)', padding: 'var(--spacing-2)' }}>
                    <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`btn ${activeTab === 'info' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ flex: 1 }}
                        >
                            <User size={18} />
                            Mes Informations
                        </button>
                        <button
                            onClick={() => setActiveTab('questionnaires')}
                            className={`btn ${activeTab === 'questionnaires' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ flex: 1 }}
                        >
                            <FileText size={18} />
                            Questionnaires
                        </button>
                        <button
                            onClick={() => setActiveTab('tracker')}
                            className={`btn ${activeTab === 'tracker' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ flex: 1 }}
                        >
                            <TrendingUp size={18} />
                            Mon Suivi
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'info' && (
                    <div className="fade-in">
                        <div className="grid-3" style={{ marginBottom: 'var(--spacing-6)' }}>
                            {/* Patient Info Card */}
                            <div className="card glass-effect">
                                <div className="card-header">
                                    <div className="card-icon card-icon-primary">
                                        <User size={20} />
                                    </div>
                                    <h3>Informations Générales</h3>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                                    <div>
                                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>Nom Complet</div>
                                        <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>{patient.name}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>Date de Naissance</div>
                                        <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                                            {patient.birth_date ? (
                                                <>
                                                    {formatDateFR(patient.birth_date)}
                                                    {calculateAge(patient.birth_date) && (
                                                        <span style={{ color: 'var(--color-gray-500)', marginLeft: 'var(--spacing-2)' }}>
                                                            ({calculateAge(patient.birth_date)} ans)
                                                        </span>
                                                    )}
                                                </>
                                            ) : 'Non renseignée'}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>Intervention Prévue</div>
                                        <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>{patient.operation}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>Date d'intervention</div>
                                        <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                                            {patient.date ? formatDateFR(patient.date) : 'Non définie'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Status Card */}
                            <div className="card glass-effect">
                                <div className="card-header">
                                    <div className="card-icon card-icon-success">
                                        <Activity size={20} />
                                    </div>
                                    <h3>État du Protocole</h3>
                                </div>
                                <div style={{ textAlign: 'center', padding: 'var(--spacing-4)' }}>
                                    <div style={{ fontSize: 'var(--font-size-4xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary-500)' }}>
                                        {patient.progress || 0}%
                                    </div>
                                    <div className="progress-bar" style={{ margin: 'var(--spacing-4) 0' }}>
                                        <div className="progress-fill progress-fill-primary" style={{ width: `${patient.progress || 0}%` }}></div>
                                    </div>
                                    <div className="badge badge-success">Conformité validée</div>
                                </div>
                            </div>

                            {/* Clinic Appointment Card */}
                            <ClinicAppointmentCard
                                clinicName={patient.clinic_name}
                                appointmentDatetime={patient.appointment_datetime}
                            />
                        </div>

                        {/* Medical History */}
                        {medicalHistory.length > 0 && (
                            <div className="card glass-effect">
                                <div className="card-header">
                                    <div className="card-icon card-icon-primary" style={{ background: 'var(--color-purple-50)', color: 'var(--color-purple-600)' }}>
                                        <Calendar size={20} />
                                    </div>
                                    <h3>Historique Médical</h3>
                                </div>
                                <div className="timeline">
                                    {medicalHistory.slice(0, 5).map((item) => (
                                        <div key={item.id} className="timeline-item">
                                            <div className="timeline-dot"></div>
                                            <div className="timeline-content glass-effect">
                                                <div className="timeline-date">{formatDateFR(item.date)}</div>
                                                <div className="timeline-title">{item.title}</div>
                                                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>{item.description}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'questionnaires' && (
                    <div className="card glass-effect fade-in">
                        <div className="card-header">
                            <div className="card-icon card-icon-primary">
                                <FileText size={20} />
                            </div>
                            <h3>Mes Questionnaires</h3>
                        </div>
                        <p style={{ color: 'var(--color-gray-600)', marginBottom: 'var(--spacing-6)' }}>
                            Complétez les questionnaires pour optimiser votre prise en charge.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                            <Link
                                to={`/patient-portal/${token}/j7`}
                                className="card glass-effect"
                                style={{ textDecoration: 'none', display: 'block', transition: 'transform 0.2s', cursor: 'pointer' }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
                                    <div style={{ fontSize: 'var(--font-size-4xl)' }}>📋</div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ marginBottom: 'var(--spacing-1)' }}>J-7 : Préparation</h4>
                                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>
                                            Checklist avant votre intervention
                                        </p>
                                    </div>
                                    <div className="badge badge-info">À compléter</div>
                                </div>
                            </Link>

                            <Link
                                to={`/patient-portal/${token}/j2`}
                                className="card glass-effect"
                                style={{ textDecoration: 'none', display: 'block', transition: 'transform 0.2s', cursor: 'pointer' }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
                                    <div style={{ fontSize: 'var(--font-size-4xl)' }}>📄</div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ marginBottom: 'var(--spacing-1)' }}>J-2 : Consignes</h4>
                                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>
                                            Dernières instructions préopératoires
                                        </p>
                                    </div>
                                    <div className="badge badge-info">À compléter</div>
                                </div>
                            </Link>

                            <div
                                className="card glass-effect"
                                style={{ opacity: 0.6, cursor: 'not-allowed' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
                                    <div style={{ fontSize: 'var(--font-size-4xl)' }}>✅</div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ marginBottom: 'var(--spacing-1)' }}>J+1 : Suivi Post-op</h4>
                                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>
                                            Rempli par notre équipe lors de l'appel
                                        </p>
                                    </div>
                                    <div className="badge badge-secondary">Équipe médicale uniquement</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'tracker' && (
                    <div className="card glass-effect fade-in">
                        <div className="card-header">
                            <div className="card-icon card-icon-primary">
                                <TrendingUp size={20} />
                            </div>
                            <h3>Mon Suivi d'Opération</h3>
                        </div>
                        <p style={{ color: 'var(--color-gray-600)', marginBottom: 'var(--spacing-6)' }}>
                            Suivez votre parcours ambulatoire étape par étape.
                        </p>
                        {/* TODO: Integrate PatientPathwayTracker in read-only mode */}
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
                            <TrendingUp size={64} style={{ margin: '0 auto var(--spacing-4)', color: 'var(--color-primary-300)' }} />
                            <p style={{ color: 'var(--color-gray-500)' }}>
                                Votre suivi d'opération sera disponible ici prochainement.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
