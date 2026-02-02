import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AddPatientModal from '../components/AddPatientModal';
import {
    Users,
    AlertTriangle,
    CheckCircle,
    Clock,
    Calendar,
    TrendingUp,
    Activity,
    X,
    Plus,
    User,
    Clipboard,
    Mail,
    Phone
} from 'lucide-react';

// Initial data preserved as default state
const initialPatients = [
    {
        id: 1,
        name: 'Thomas Dupont',
        operation: 'Arthroscopie Épaule',
        date: '21 Jan 2026',
        status: 'ready',
        daysUntil: 'J-1',
        progress: 100
    },
    {
        id: 2,
        name: 'Marie Laurent',
        operation: 'Chirurgie Pied',
        date: '22 Jan 2026',
        status: 'postop',
        daysUntil: 'J+2',
        progress: 60
    },
    {
        id: 3,
        name: 'Alain Bernard',
        operation: 'Cataracte',
        date: '27 Jan 2026',
        status: 'incomplete',
        daysUntil: 'J-7',
        progress: 40
    },
    {
        id: 4,
        name: 'Paul Martin',
        operation: 'Ligamentoplastie Genou',
        date: '19 Jan 2026',
        status: 'postop',
        daysUntil: 'J+1',
        progress: 30
    },
    {
        id: 5,
        name: 'Sophie Petit',
        operation: 'Rhinoplastie',
        date: '28 Jan 2026',
        status: 'pending',
        daysUntil: 'J-8',
        progress: 20
    },
];

export default function Dashboard() {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [patients, setPatients] = useState(initialPatients);

    const handlePatientAdded = (newPatient) => {
        // Map Supabase fields to the UI format if needed
        const formattedPatient = {
            id: newPatient.id,
            name: newPatient.name,
            operation: newPatient.operation,
            date: newPatient.date,
            status: newPatient.status || 'pending',
            daysUntil: newPatient.days_until || 'J-0',
            progress: newPatient.progress || 0
        };
        setPatients([formattedPatient, ...patients]);
    };

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


    return (
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <main className="main-content">
                <Header
                    title="Tableau de Bord"
                    subtitle="Vue d'ensemble de vos patients et indicateurs clés"
                />

                {/* Welcome Banner */}
                <div className="welcome-banner fade-in">
                    <div className="welcome-banner-content">
                        <div className="welcome-banner-welcome">Bienvenue,</div>
                        <div className="welcome-banner-name">Christophe DESOUCHES</div>

                        <div className="welcome-banner-greeting">Ravi de vous revoir !</div>
                        <div className="welcome-banner-instruction">Consultez votre Espace Praticien</div>

                        <div style={{ marginTop: '3rem' }}>
                            <div className="welcome-banner-date-label">Date d'aujourd'hui</div>
                            <div className="welcome-banner-date-value">
                                {new Date().toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                }).replace(/^\w/, (c) => c.toUpperCase())}
                            </div>
                        </div>
                    </div>

                    <img
                        src="/welcome-card.png"
                        alt="Espace Opératoire"
                        className="welcome-banner-image"
                    />
                </div>

                {/* Stats Cards */}
                <div className="grid-4" style={{ marginBottom: 'var(--spacing-8)' }}>
                    <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/review/active')}>
                        <div className="stat-card-icon" style={{ background: 'var(--color-primary-50)' }}>
                            <Users size={24} style={{ color: 'var(--color-primary-500)' }} />
                        </div>
                        <div className="stat-card-value">12</div>
                        <div className="stat-card-label">Patients actifs</div>
                        <div className="stat-card-meta">+3 cette semaine</div>
                    </div>

                    <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/review/complete')}>
                        <div className="stat-card-icon" style={{ background: 'var(--color-success-50)' }}>
                            <CheckCircle size={24} style={{ color: 'var(--color-success-500)' }} />
                        </div>
                        <div className="stat-card-value">8</div>
                        <div className="stat-card-label">Protocoles complets</div>
                        <div className="stat-card-meta">67% de conformité</div>
                    </div>

                    <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/review/required')}>
                        <div className="stat-card-icon" style={{ background: 'var(--color-warning-50)' }}>
                            <AlertTriangle size={24} style={{ color: 'var(--color-warning-500)' }} />
                        </div>
                        <span className="badge badge-danger stat-card-badge">Priorité</span>
                        <div className="stat-card-value">3</div>
                        <div className="stat-card-label">Actions requises</div>
                        <div className="stat-card-meta" style={{ color: 'var(--color-danger-500)' }}>Attention requise</div>
                    </div>

                    <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/review/weekly')}>
                        <div className="stat-card-icon" style={{ background: 'var(--color-info-50)' }}>
                            <Calendar size={24} style={{ color: 'var(--color-info-500)' }} />
                        </div>
                        <div className="stat-card-value">5</div>
                        <div className="stat-card-label">Interventions cette semaine</div>
                        <div className="stat-card-meta">Prochain: Demain</div>
                    </div>
                </div>

                {/* Patients List */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
                        <div>
                            <h3 style={{ marginBottom: 'var(--spacing-1)' }}>Patients en suivi</h3>
                            <p style={{ fontSize: 'var(--font-size-sm)' }}>Liste des patients avec leur statut actuel</p>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                            <button className="btn btn-secondary" onClick={() => navigate('/patients')}>
                                Voir tout
                            </button>
                            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                                <Plus size={16} />
                                Ajouter un patient
                            </button>
                        </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-gray-100)' }}>
                                <th style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', fontWeight: 'var(--font-weight-medium)', textTransform: 'uppercase' }}>Patient</th>
                                <th style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', fontWeight: 'var(--font-weight-medium)', textTransform: 'uppercase' }}>Intervention</th>
                                <th style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', fontWeight: 'var(--font-weight-medium)', textTransform: 'uppercase' }}>Date</th>
                                <th style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', fontWeight: 'var(--font-weight-medium)', textTransform: 'uppercase' }}>Statut</th>
                                <th style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', fontWeight: 'var(--font-weight-medium)', textTransform: 'uppercase' }}>Progression</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patients.map((patient) => (
                                <tr key={patient.id} style={{ borderBottom: '1px solid var(--color-gray-50)', cursor: 'pointer' }} className="table-row-hover" onClick={() => navigate(`/patient/${patient.id}`)}>
                                    <td style={{ padding: 'var(--spacing-4)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%',
                                                background: 'var(--color-primary-50)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 'var(--font-size-xs)',
                                                fontWeight: 'var(--font-weight-bold)',
                                                color: 'var(--color-primary-600)'
                                            }}>
                                                {patient.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 'var(--font-weight-medium)' }}>{patient.name}</div>
                                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>{patient.daysUntil}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: 'var(--spacing-4)', fontSize: 'var(--font-size-sm)' }}>{patient.operation}</td>
                                    <td style={{ padding: 'var(--spacing-4)', fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>{patient.date}</td>
                                    <td style={{ padding: 'var(--spacing-4)' }}>{getStatusBadge(patient.status)}</td>
                                    <td style={{ padding: 'var(--spacing-4)' }}>
                                        <div className="progress-bar">
                                            <div className={`progress-fill ${patient.progress === 100 ? 'progress-fill-success' : 'progress-fill-primary'}`} style={{ width: `${patient.progress}%` }}></div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <AddPatientModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onPatientAdded={handlePatientAdded}
                />
            </main>
        </div>
    );
}
