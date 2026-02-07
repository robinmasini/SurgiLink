import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
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
    X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { calculateAge, formatDateFR } from '../utils/dateUtils';

export default function PatientReview() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [medicalHistory, setMedicalHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingHistory, setIsAddingHistory] = useState(false);
    const [newHistoryEntry, setNewHistoryEntry] = useState({
        date: '',
        title: '',
        description: ''
    });

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
                    description: newHistoryEntry.description
                }])
                .select();

            if (error) throw error;

            // Add to local state
            setMedicalHistory([data[0], ...medicalHistory]);
            setIsAddingHistory(false);
            setNewHistoryEntry({ date: '', title: '', description: '' });
        } catch (err) {
            console.error('Error adding history entry:', err);
            alert(`Erreur: ${err.message}`);
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
                    <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm" style={{ padding: '8px' }}>
                        <ChevronLeft size={20} />
                    </button>
                    <Header
                        title={`Revue Patient : ${patient.name}`}
                        subtitle="Historique complet et suivi clinique"
                    />
                    <button
                        onClick={handleDeletePatient}
                        className="btn btn-danger btn-sm"
                        style={{ marginLeft: 'auto' }}
                        title="Supprimer ce patient"
                    >
                        <X size={16} />
                        Supprimer
                    </button>
                </div>

                <div className="grid-3" style={{ marginBottom: 'var(--spacing-8)' }}>
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
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>Téléphone</div>
                                <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>{patient.phone || 'Non renseigné'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>Email</div>
                                <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>{patient.email || 'Non renseigné'}</div>
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

                    {/* Next Steps Card */}
                    <div className="card glass-effect">
                        <div className="card-header">
                            <div className="card-icon card-icon-warning">
                                <Clock size={20} />
                            </div>
                            <h3>Prochaines Étapes</h3>
                        </div>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                            <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', fontSize: 'var(--font-size-sm)' }}>
                                <ShieldCheck size={16} color="var(--color-success-500)" />
                                Questionnaire pré-opératoire
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', fontSize: 'var(--font-size-sm)' }}>
                                <ShieldCheck size={16} color="var(--color-success-500)" />
                                Consultation anesthésie
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', fontSize: 'var(--font-size-sm)', opacity: 0.5 }}>
                                <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--color-gray-300)' }}></div>
                                Admission clinique (J-0)
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Surgical History / Traceability */}
                <div className="card">
                    <div className="card-header" style={{ marginBottom: 'var(--spacing-6)' }}>
                        <div className="card-icon card-icon-primary" style={{ background: 'var(--color-purple-50)', color: 'var(--color-purple-600)' }}>
                            <History size={20} />
                        </div>
                        <div>
                            <h3 style={{ marginBottom: '4px' }}>Historique de Traçabilité</h3>
                            <p style={{ fontSize: 'var(--font-size-sm)' }}>Registre des interventions et consultations précédentes</p>
                        </div>
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setIsAddingHistory(!isAddingHistory)}
                            style={{ marginLeft: 'auto' }}
                        >
                            <Plus size={16} />
                            Ajouter une entrée
                        </button>
                    </div>

                    {/* Add History Entry Modal/Form */}
                    {isAddingHistory && (
                        <div className="card" style={{ marginBottom: 'var(--spacing-6)', background: 'var(--color-primary-50)', border: '1px solid var(--color-primary-200)' }}>
                            <div style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-500)', marginBottom: '4px', textTransform: 'uppercase' }}>Date</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={newHistoryEntry.date}
                                        onChange={(e) => setNewHistoryEntry({ ...newHistoryEntry, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-500)', marginBottom: '4px', textTransform: 'uppercase' }}>Titre</label>
                                    <input
                                        className="input"
                                        placeholder="Ex: Consultation pré-opératoire"
                                        value={newHistoryEntry.title}
                                        onChange={(e) => setNewHistoryEntry({ ...newHistoryEntry, title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-500)', marginBottom: '4px', textTransform: 'uppercase' }}>Description</label>
                                    <textarea
                                        className="input"
                                        rows={3}
                                        placeholder="Détails de l'entrée..."
                                        value={newHistoryEntry.description}
                                        onChange={(e) => setNewHistoryEntry({ ...newHistoryEntry, description: e.target.value })}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'flex-end' }}>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setIsAddingHistory(false);
                                            setNewHistoryEntry({ date: '', title: '', description: '' });
                                        }}
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleAddHistoryEntry}
                                    >
                                        Enregistrer
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="timeline">
                        {medicalHistory.length > 0 ? medicalHistory.map((item) => (
                            <div key={item.id} className="timeline-item">
                                <div className="timeline-dot"></div>
                                <div className="timeline-content glass-effect" style={{ position: 'relative' }}>
                                    <button
                                        onClick={() => handleDeleteHistoryEntry(item.id)}
                                        style={{
                                            position: 'absolute',
                                            top: 'var(--spacing-3)',
                                            right: 'var(--spacing-3)',
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: 'var(--color-gray-400)',
                                            padding: '4px',
                                            borderRadius: '4px',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.background = 'var(--color-danger-50)';
                                            e.target.style.color = 'var(--color-danger-600)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.background = 'transparent';
                                            e.target.style.color = 'var(--color-gray-400)';
                                        }}
                                        title="Supprimer cette entrée"
                                    >
                                        <X size={16} />
                                    </button>
                                    <div className="timeline-date">{formatDateFR(item.date)}</div>
                                    <div className="timeline-title">{item.title}</div>
                                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>{item.description}</div>
                                </div>
                            </div>
                        )) : (
                            <div style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--color-gray-400)' }}>
                                <History size={48} style={{ marginBottom: 'var(--spacing-4)', opacity: 0.2 }} />
                                <p style={{ marginBottom: 'var(--spacing-4)' }}>Aucune entrée d'historique pour le moment.</p>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setIsAddingHistory(true)}
                                >
                                    <Plus size={16} />
                                    Ajouter la première entrée
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
