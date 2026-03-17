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
    Phone
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import welcomeCardInfirmier from '../assets/welcomecard-infirmier.png';
import StatusBolt from '../components/StatusBolt';

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
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
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
                setPatients(data || []);
            } catch (err) {
                console.error('Error loading patients:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadPatients();
    }, []);

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
                            <button className="btn btn-secondary hide-mobile">
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
                                    <div className="welcome-banner-welcome" style={{ marginBottom: '4px' }}>Bienvenue,</div>
                                    <div className="welcome-banner-name" style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '800', marginBottom: '4px', color: 'white' }}>
                                        ESPACE INFIRMIER
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
                            <div className="stat-card">
                                <div className="stat-card-icon" style={{ background: 'var(--color-primary-50)' }}>
                                    <Users size={24} style={{ color: 'var(--color-primary-500)' }} />
                                </div>
                                <div className="stat-card-value">{patients.length}</div>
                                <div className="stat-card-label">Patients Totaux</div>
                                <div className="stat-card-meta">Base active</div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-card-icon" style={{ background: 'var(--color-success-50)' }}>
                                    <CheckCircle size={24} style={{ color: 'var(--color-success-500)' }} />
                                </div>
                                <div className="stat-card-value">
                                    {patients.filter(p => p.progress === 100).length}
                                </div>
                                <div className="stat-card-label">Protocoles complets</div>
                                <div className="stat-card-meta">Dossiers OK</div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-card-icon" style={{ background: 'var(--color-warning-50)' }}>
                                    <AlertTriangle size={24} style={{ color: 'var(--color-warning-500)' }} />
                                </div>
                                <div className="stat-card-value">
                                    {patients.filter(p => p.status === 'alerte' || p.status === 'critique').length}
                                </div>
                                <div className="stat-card-label">Actions requises</div>
                                <div className="stat-card-meta" style={{ color: 'var(--color-danger-500)' }}>Attention requise</div>
                            </div>

                            <div className="stat-card">
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
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-gray-100)' }}>
                                <th style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', fontWeight: 'var(--font-weight-medium)', textTransform: 'uppercase' }}>Patient</th>
                                <th style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', fontWeight: 'var(--font-weight-medium)', textTransform: 'uppercase' }}>Intervention</th>
                                <th style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', fontWeight: 'var(--font-weight-medium)', textTransform: 'uppercase' }}>Statut</th>
                                <th style={{ textAlign: 'right', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', fontWeight: 'var(--font-weight-medium)', textTransform: 'uppercase' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPatients.map((patient) => (
                                <tr key={patient.id} style={{ borderBottom: '1px solid var(--color-gray-50)' }}>
                                    <td style={{ padding: 'var(--spacing-4)' }}>
                                        <div style={{ fontWeight: 'var(--font-weight-medium)' }}>{patient.name}</div>
                                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)' }}>{patient.date}</div>
                                    </td>
                                    <td style={{ padding: 'var(--spacing-4)' }}>{patient.operation}</td>
                                    <td style={{ padding: 'var(--spacing-4)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
                                            <StatusBolt status={patient.status} />
                                            <div className="progress-bar" style={{ width: '100px', flex: 1 }}>
                                                <div className="progress-fill progress-fill-primary" style={{ width: `${patient.progress}%` }}></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: 'var(--spacing-4)', textAlign: 'right' }}>
                                        <button onClick={() => navigate(`/patient/${patient.id}`)} className="btn btn-secondary btn-sm">
                                            Consulter
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main >
        </div >
    );
}
