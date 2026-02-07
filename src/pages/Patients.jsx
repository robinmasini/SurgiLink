import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AddPatientModal from '../components/AddPatientModal';
import { Users, Search, Filter, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

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
    if (daysUntil === 'J-1') {
        return { color: 'var(--color-success-500)', fontWeight: 'var(--font-weight-semibold)' };
    }
    return { color: 'var(--color-primary-500)', fontWeight: 'var(--font-weight-semibold)' };
};

export default function Patients() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
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

            // Format dates to French format
            const formattedPatients = (data || []).map(patient => ({
                ...patient,
                daysUntil: patient.days_until || 'J-0',
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
                            <div key={patient.id} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/patient/${patient.id}`)}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)' }}>
                                    <div style={{
                                        width: '56px',
                                        height: '56px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, var(--color-primary-100), var(--color-primary-200))',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 'var(--font-weight-semibold)',
                                        color: 'var(--color-primary-600)',
                                        fontSize: 'var(--font-size-lg)'
                                    }}>
                                        {patient.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ marginBottom: 'var(--spacing-1)' }}>{patient.name}</h4>
                                        <span style={{ ...getDaysStyle(patient.daysUntil), fontSize: 'var(--font-size-sm)' }}>{patient.daysUntil} • {patient.operation}</span>
                                    </div>
                                </div>

                                <div style={{ marginBottom: 'var(--spacing-4)' }}>
                                    {getStatusBadge(patient.status)}
                                </div>

                                <div style={{
                                    padding: 'var(--spacing-3)',
                                    background: 'var(--color-gray-50)',
                                    borderRadius: 'var(--radius-lg)',
                                    fontSize: 'var(--font-size-sm)',
                                    color: 'var(--color-gray-600)'
                                }}>
                                    <div style={{ marginBottom: 'var(--spacing-2)' }}>📅 {patient.date}</div>
                                    <div style={{ marginBottom: 'var(--spacing-2)' }}>📱 {patient.phone}</div>
                                    <div>✉️ {patient.email}</div>
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
            </main>
        </div>
    );
}
