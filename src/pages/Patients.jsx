import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AddPatientModal from '../components/AddPatientModal';
import EditPatientModal from '../components/EditPatientModal';
import { Users, Search, Filter, Plus, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { calculateDaysUntilSurgery } from '../utils/dateUtils';

const getStatusBadge = (status) => {
    switch (status) {
        case 'ready':
            return <span className="badge badge-success">Prêt</span>;
        case 'incomplete':
            return <span className="badge badge-warning">Protocole incomplet</span>;
        case 'postop':
            return <span className="badge badge-info">Suivi post-op</span>;
        case 'pending':
            return <span className="badge badge-primary">En cours</span>;
        default:
            return null;
    }
};

const getDaysStyle = (daysUntil) => {
    if (daysUntil.startsWith('J+')) {
        return { color: 'var(--color-info-500)', fontWeight: 'var(--font-weight-semibold)' };
    }
    if (daysUntil === 'J-1' || daysUntil === 'J-0') {
        return { color: 'var(--color-success-500)', fontWeight: 'var(--font-weight-semibold)' };
    }
    return { color: 'var(--color-primary-500)', fontWeight: 'var(--font-weight-semibold)' };
};

export default function Patients() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientsList, setPatientsList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load patients from Supabase
    useEffect(() => {
        loadPatients();
    }, []);

    const loadPatients = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Format dates and calculate days until surgery
            const formattedPatients = (data || []).map(patient => ({
                ...patient,
                daysUntil: calculateDaysUntilSurgery(patient.date),
                date: patient.date ? new Date(patient.date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                }) : 'Non définie'
            }));

            setPatientsList(formattedPatients);
        } catch (err) {
            console.error('Error loading patients:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePatientAdded = (newPatient) => {
        // Reload patients to get the freshest data
        loadPatients();
    };

    const handlePatientUpdated = (updatedPatient) => {
        // Reload patients to get the freshest data
        loadPatients();
    };

    const handleEditClick = (e, patient) => {
        e.stopPropagation(); // Prevent navigation to patient details
        setSelectedPatient(patient);
        setIsEditModalOpen(true);
    };

    const handleDeletePatient = async (e, patientId, patientName) => {
        e.stopPropagation(); // Prevent navigation
        if (!confirm(`Supprimer le patient ${patientName} ? Cette action supprimera également tout son historique et ses documents.`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('patients')
                .delete()
                .eq('id', patientId);

            if (error) throw error;

            alert('Patient supprimé');
            setPatientsList(prev => prev.filter(p => p.id !== patientId));
        } catch (err) {
            console.error('Error deleting patient:', err);
            alert(`Erreur: ${err.message}`);
        }
    };

    const filteredPatients = patientsList.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.operation.toLowerCase().includes(searchTerm.toLowerCase())
    );


    return (
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <main className="main-content">
                <Header
                    title="Patients"
                    subtitle="Gestion et suivi de vos patients"
                />

                {/* Search and Filters */}
                <div style={{ display: 'flex', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search
                            size={18}
                            style={{
                                position: 'absolute',
                                left: '14px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--color-gray-400)'
                            }}
                        />
                        <input
                            type="text"
                            className="input"
                            placeholder="Rechercher un patient..."
                            style={{ paddingLeft: '44px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-secondary" onClick={() => alert('Filtres bientôt disponibles')}>
                        <Filter size={16} />
                        Filtres
                    </button>
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                        <Plus size={16} />
                        Nouveau patient
                    </button>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-12)', color: 'var(--color-gray-400)' }}>
                        <div className="spinner" style={{ margin: '0 auto var(--spacing-4)' }}></div>
                        <p>Chargement des patients...</p>
                    </div>
                )}

                {/* Error State */}
                {error && !isLoading && (
                    <div className="card" style={{ padding: 'var(--spacing-6)', textAlign: 'center', border: '1px solid var(--color-danger-200)', background: 'var(--color-danger-50)' }}>
                        <p style={{ color: 'var(--color-danger-600)', marginBottom: 'var(--spacing-4)' }}>
                            ❌ Erreur lors du chargement des patients
                        </p>
                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)', marginBottom: 'var(--spacing-4)' }}>
                            {error}
                        </p>
                        <button className="btn btn-primary" onClick={loadPatients}>Réessayer</button>
                    </div>
                )}

                {/* Patients Grid */}
                {!isLoading && !error && (
                    <div className="grid-3">
                        {filteredPatients.length > 0 ? filteredPatients.map((patient) => (
                            <div
                                key={patient.id}
                                className="card glass-effect animate-scale"
                                style={{
                                    cursor: 'pointer',
                                    padding: 'var(--spacing-5)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'all 0.3s ease',
                                    height: '100%'
                                }}
                                onClick={() => navigate(`/patient/${patient.id}`)}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, var(--color-primary-100), var(--color-primary-200))',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 'var(--font-weight-black)',
                                        color: 'var(--color-primary-600)',
                                        fontSize: 'var(--font-size-md)',
                                        flexShrink: 0
                                    }}>
                                        {patient.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h4 style={{
                                            marginBottom: 'var(--spacing-1)',
                                            fontSize: 'var(--font-size-lg)',
                                            fontWeight: 'var(--font-weight-black)',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}>{patient.name}</h4>
                                        <div style={{ ...getDaysStyle(patient.daysUntil), fontSize: 'var(--font-size-xs)' }}>{patient.daysUntil} • {patient.operation}</div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: 'var(--spacing-4)' }}>
                                    {getStatusBadge(patient.status)}
                                </div>

                                <div style={{
                                    padding: 'var(--spacing-4)',
                                    background: 'var(--color-gray-50)',
                                    borderRadius: 'var(--radius-lg)',
                                    fontSize: 'var(--font-size-sm)',
                                    color: 'var(--color-gray-600)',
                                    flex: 1,
                                    marginBottom: 'var(--spacing-4)'
                                }}>
                                    <div style={{ marginBottom: 'var(--spacing-2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        📅 {patient.date}
                                    </div>
                                    <div style={{ marginBottom: 'var(--spacing-2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        📱 {patient.phone}
                                    </div>
                                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        ✉️ {patient.email}
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    gap: 'var(--spacing-2)',
                                    borderTop: '1px solid var(--color-gray-100)',
                                    paddingTop: 'var(--spacing-4)',
                                    marginTop: 'auto'
                                }}>
                                    <button
                                        onClick={(e) => handleEditClick(e, patient)}
                                        className="btn btn-secondary btn-sm"
                                        style={{ flex: 1, height: '36px' }}
                                    >
                                        <Edit2 size={14} style={{ marginRight: '6px' }} />
                                        Modifier
                                    </button>
                                    <button
                                        onClick={(e) => handleDeletePatient(e, patient.id, patient.name)}
                                        className="btn btn-secondary btn-sm btn-hover-danger"
                                        style={{ width: '36px', height: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        title="Supprimer"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--spacing-12)', color: 'var(--color-gray-400)' }}>
                                <Users size={48} style={{ marginBottom: 'var(--spacing-4)', opacity: 0.2 }} />
                                <p style={{ marginBottom: 'var(--spacing-4)' }}>
                                    {searchTerm ? 'Aucun patient ne correspond à votre recherche.' : 'Aucun patient pour le moment.'}
                                </p>
                                {!searchTerm && (
                                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                                        <Plus size={16} />
                                        Créer votre premier patient
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <AddPatientModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onPatientAdded={handlePatientAdded}
                />

                <EditPatientModal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setSelectedPatient(null);
                    }}
                    patient={selectedPatient}
                    onPatientUpdated={handlePatientUpdated}
                />
            </main>
        </div>
    );
}
