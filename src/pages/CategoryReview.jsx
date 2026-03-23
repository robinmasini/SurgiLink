import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Users,
    CheckCircle,
    AlertTriangle,
    Calendar,
    ChevronLeft,
    Search,
    Filter,
    Phone,
    Plus
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import welcomeCardInfirmier from '../assets/welcomecard-infirmier.png';
import StatusBolt from '../components/StatusBolt';
import AddPatientModal from '../components/AddPatientModal';
import { calculateDaysUntilSurgery } from '../utils/dateUtils';

const categoryConfigs = {
    'active': { title: 'Patients Actifs', icon: <Users size={24} />, color: 'var(--color-primary-500)', bg: 'var(--color-primary-50)' },
    'complete': { title: 'Protocoles Complets', icon: <CheckCircle size={24} />, color: 'var(--color-success-500)', bg: 'var(--color-success-50)' },
    'required': { title: 'Actions Requises', icon: <AlertTriangle size={24} />, color: 'var(--color-warning-500)', bg: 'var(--color-warning-50)' },
    'weekly': { title: 'Interventions de la Semaine', icon: <Calendar size={24} />, color: 'var(--color-info-500)', bg: 'var(--color-info-50)' }
};

export default function CategoryReview() {
    const { category } = useParams();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [patients, setPatients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const config = categoryConfigs[category] || categoryConfigs['active'];

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const loadPatients = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('patients')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Format patients same as Dashboard.jsx
                const formatted = (data || []).map(patient => ({
                    ...patient,
                    daysUntil: calculateDaysUntilSurgery(patient.date),
                    displayDate: patient.date ? new Date(patient.date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                    }) : 'Non définie'
                }));

                setPatients(formatted);
            } catch (err) {
                console.error('Error loading patients:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadPatients();
    }, []);

    const handlePatientAdded = () => {
        // Trigger reload by re-running the effect or manually calling the function if exported
        window.location.reload(); // Simple way to ensure everything stays in sync
    };

    // Filtering logic
    const filteredPatients = patients.filter(p => {
        const matchesCategory = (() => {
            if (category === 'complete') return p.progress === 100;
            if (category === 'required') return p.status === 'alerte' || p.status === 'critique';
            if (category === 'weekly') {
                if (!p.date) return false;
                const now = new Date();
                const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1));
                startOfWeek.setHours(0, 0, 0, 0);

                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(endOfWeek.getDate() + 6);
                endOfWeek.setHours(23, 59, 59, 999);

                const surgeryDate = new Date(p.date);
                return surgeryDate >= startOfWeek && surgeryDate <= endOfWeek;
            }
            return true; // 'active' or any other show all
        })();

        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.operation.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesCategory && matchesSearch;
    });

    return (
        <div style={{ display: 'flex' }} data-mobile={isMobile}>
            <Sidebar />
            <main className="main-content" data-mobile={isMobile}>
                {category === 'active' ? (
                    <Header
                        title="Tableau de Bord"
                        subtitle="Vue d'ensemble de vos patients et indicateurs clés"
                        hideTitleMobile={true}
                        actions={
                            <button className="btn btn-secondary hide-mobile" onClick={() => window.location.href = 'tel:0491550000'}>
                                <Phone size={18} />
                                Appeler le Cabinet
                            </button>
                        }
                    />
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
                        <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm" style={{ padding: '8px' }}>
                            <ChevronLeft size={20} />
                        </button>
                        <Header
                            title={`Revue : ${config.title}`}
                            subtitle={`Liste détaillée des patients dans la catégorie ${config.title}`}
                        />
                    </div>
                )}

                {category === 'active' && (
                    <div className="dashboard-grid-top">
                        {/* Welcome Banner */}
                        <div className="welcome-banner fade-in">
                            <div className="welcome-banner-content">
                                <div></div>
                                <div>
                                    <div className="welcome-banner-welcome">Bienvenue,</div>
                                    <div className="welcome-banner-name" style={{
                                        fontSize: 'var(--font-size-2xl)',
                                        fontWeight: '800',
                                        marginBottom: 'var(--spacing-3)',
                                        color: 'white',
                                        minHeight: '80px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        textTransform: 'none'
                                    }}>
                                        Espace infirmier
                                    </div>
                                    <div className="welcome-banner-greeting">Ravi de vous revoir !</div>
                                    <div className="welcome-banner-instruction">Consultez votre Espace Suivi</div>
                                </div>
                                <div>
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
                                src={welcomeCardInfirmier}
                                alt="Espace Infirmier"
                                className="welcome-banner-image"
                            />
                        </div>

                        {isMobile && (
                            <button
                                className="mobile-call-btn"
                                onClick={() => window.location.href = 'tel:0491550000'}
                                style={{ marginTop: '0' }}
                            >
                                <Phone size={18} />
                                Appeler le Cabinet
                            </button>
                        )}

                        {/* Stats Grid - Matching Dashboard dimensions */}
                        <div className="stat-grid">
                            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/patients')}>
                                <div className="stat-card-icon" style={{ background: 'var(--color-primary-50)' }}>
                                    <Users size={24} style={{ color: 'var(--color-primary-500)' }} />
                                </div>
                                <div className="stat-card-value">{patients.length}</div>
                                <div className="stat-card-label">Patients Totaux</div>
                                <div className="stat-card-meta">Base active</div>
                            </div>

                            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/review/complete')}>
                                <div className="stat-card-icon" style={{ background: 'var(--color-success-50)' }}>
                                    <CheckCircle size={24} style={{ color: 'var(--color-success-500)' }} />
                                </div>
                                <div className="stat-card-value">
                                    {patients.filter(p => p.progress === 100).length}
                                </div>
                                <div className="stat-card-label">Protocoles complets</div>
                                <div className="stat-card-meta">Dossiers OK</div>
                            </div>

                            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/review/required')}>
                                <div className="stat-card-icon" style={{ background: 'var(--color-warning-50)' }}>
                                    <AlertTriangle size={24} style={{ color: 'var(--color-warning-500)' }} />
                                </div>
                                <div className="stat-card-value">
                                    {patients.filter(p => p.status === 'alerte' || p.status === 'critique').length}
                                </div>
                                <div className="stat-card-label">Actions requises</div>
                                <div className="stat-card-meta" style={{ color: 'var(--color-danger-500)' }}>Attention requise</div>
                            </div>

                            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/review/weekly')}>
                                <div className="stat-card-icon" style={{ background: 'var(--color-info-50)' }}>
                                    <Calendar size={24} style={{ color: 'var(--color-info-500)' }} />
                                </div>
                                <div className="stat-card-value">
                                    {patients.filter(p => {
                                        if (!p.date) return false;
                                        const now = new Date();
                                        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1));
                                        startOfWeek.setHours(0, 0, 0, 0);
                                        const endOfWeek = new Date(startOfWeek);
                                        endOfWeek.setDate(endOfWeek.getDate() + 6);
                                        endOfWeek.setHours(23, 59, 59, 999);
                                        const surgeryDate = new Date(p.date);
                                        return surgeryDate >= startOfWeek && surgeryDate <= endOfWeek;
                                    }).length}
                                </div>
                                <div className="stat-card-label">Interventions / Sem.</div>
                                <div className="stat-card-meta">Semaine en cours</div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="card glass-effect" style={{ marginBottom: 'var(--spacing-6)' }}>
                    <div style={{ display: 'flex', gap: 'var(--spacing-4)' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)' }} />
                            <input
                                className="input"
                                placeholder="Rechercher un patient..."
                                style={{ paddingLeft: '40px' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="btn btn-secondary" onClick={() => alert('Filtres bientôt disponibles')}>
                            <Filter size={18} />
                            Filtres
                        </button>
                    </div>
                </div>

                <div className="card">
                    <div className="section-header-mobile">
                        <div>
                            <h3 style={{ marginBottom: 'var(--spacing-1)' }}>Patients en suivi</h3>
                            <p style={{ fontSize: 'var(--font-size-sm)' }} className="hide-mobile">Liste des patients avec leur statut actuel</p>
                        </div>
                        <div className="section-actions-mobile">
                            <button className="btn-outline-mobile" onClick={() => navigate('/patients')}>
                                Voir tout
                            </button>
                            <button className="btn-primary-mobile" onClick={() => setIsModalOpen(true)}>
                                <Plus size={18} /> Ajouter un patient
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
                                <th className="hide-mobile" style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', fontWeight: 'var(--font-weight-medium)', textTransform: 'uppercase' }}>Progression</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPatients.map((patient) => (
                                <tr
                                    key={patient.id}
                                    style={{ borderBottom: '1px solid var(--color-gray-50)', cursor: 'pointer' }}
                                    className="table-row-hover"
                                    onClick={() => navigate(`/patient/${patient.id}`)}
                                >
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
                                                {patient.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 'var(--font-weight-medium)' }}>{patient.name}</div>
                                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-600)', fontWeight: 'var(--font-weight-semibold)' }}>{patient.daysUntil}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: 'var(--spacing-4)', fontSize: 'var(--font-size-sm)' }}>{patient.operation}</td>
                                    <td style={{ padding: 'var(--spacing-4)', fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>{patient.displayDate}</td>
                                    <td style={{ padding: 'var(--spacing-4)' }}>
                                        <StatusBolt status={patient.status} showLabel={true} />
                                    </td>
                                    <td className="hide-mobile" style={{ padding: 'var(--spacing-4)' }}>
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
                    onSuccess={handlePatientAdded}
                />
            </main >
        </div >
    );
}
