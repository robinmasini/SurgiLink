import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import MobileNavbar from '../components/MobileNavbar';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import {
    Users,
    Calendar,
    Clock,
    Search,
    Plus,
    Activity,
    ClipboardCheck,
    AlertTriangle,
    CheckCircle2,
    CalendarDays,
    PhoneCall,
    Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AddPatientModal from '../components/AddPatientModal';

export default function Dashboard() {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [profile, setProfile] = useState(null);
    const [activeFilter, setActiveFilter] = useState('Tous');

    const filters = ['J-10', 'J-7', 'J-2', 'J-1', 'Jour J', 'J+1', 'J+4', 'Tous', 'Archivés'];

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        setIsLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (profileData) {
                    setProfile(profileData);
                } else {
                    // Fallback
                    const email = session.user.email;
                    if (email === 'christophe.desouches@gmail.com') {
                        setProfile({ full_name: 'DESOUCHES CHRISTOPHE', role: 'practitioner' });
                    }
                }
            }

            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPatients(data || []);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const stats = [
        {
            label: 'PATIENTS ACTIFS',
            value: patients.length,
            icon: Users,
            variant: 'blue',
            badge: 'Actif',
            footer: '+2 cette semaine'
        },
        {
            label: 'PROTOCOLES COMPLETS',
            value: 0,
            icon: CheckCircle2,
            variant: 'green',
            badge: 'À améliorer',
            footer: '0% de conformité'
        },
        {
            label: 'ACTIONS REQUISES',
            value: 8,
            icon: AlertTriangle,
            variant: 'red',
            badge: 'Priorité',
            footer: 'Attention immédiate'
        },
        {
            label: 'INTERVENTIONS / 7J',
            value: 1,
            icon: CalendarDays,
            variant: 'cyan',
            badge: 'Planning',
            footer: 'Suivi planifié'
        },
    ];

    return (
        <div className="layout">
            <Sidebar />
            <main className="main-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-8)' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0 }}>Tableau de Bord</h1>
                        <p style={{ color: 'var(--color-gray-500)', fontSize: '14px' }}>Vue d'ensemble de vos patients et indicateurs clés</p>
                    </div>
                    <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px' }}>
                        <PhoneCall size={18} />
                        <span>Appeler la Clinique</span>
                    </button>
                </div>

                <div className="stats-grid">
                    {stats.map((stat, i) => (
                        <div key={i} className={`stat-card-premium stat-card-${stat.variant}`}>
                            <div className="stat-card-header">
                                <div className="stat-card-icon-wrapper">
                                    <stat.icon size={20} />
                                </div>
                                <span className="stat-card-badge">{stat.badge}</span>
                            </div>
                            <div className="stat-card-main">
                                <span className="stat-card-value">{stat.value}</span>
                                <span className="stat-card-label">{stat.label}</span>
                            </div>
                            <div className="stat-card-footer">
                                {stat.footer}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="alert-banner-premium">
                    <div className="alert-banner-content">
                        <div className="alert-icon-wrapper">
                            <AlertTriangle size={20} />
                        </div>
                        <div className="alert-text">
                            <h3>Alerte : Créneaux à risque détectés</h3>
                            <p>1 patients n'ont pas validé leur protocole pré-opératoire.</p>
                        </div>
                    </div>
                    <div className="alert-financial">
                        <span className="financial-label">IMPACT FINANCIER POTENTIEL</span>
                        <span className="financial-value">-2450€</span>
                    </div>
                </div>

                <div className="filter-bar-premium">
                    <div className="filter-pills">
                        {filters.map(f => (
                            <button
                                key={f}
                                className={`filter-pill ${activeFilter === f ? 'active' : ''}`}
                                onClick={() => setActiveFilter(f)}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)} style={{ borderRadius: '12px', padding: '10px 24px' }}>
                        <Plus size={18} />
                        <span>Ajouter un patient</span>
                    </button>
                </div>

                <div className="section-card">
                    <div className="section-header">
                        <h2 style={{ fontSize: '18px', fontWeight: '800' }}>Liste des patients</h2>
                        <span style={{ fontSize: '12px', color: 'var(--color-gray-400)' }}>{patients.length} patients</span>
                    </div>

                    <div className="table-container">
                        <table className="patient-table-premium">
                            <thead>
                                <tr>
                                    <th>PATIENT</th>
                                    <th>RETOURS PATIENT</th>
                                    <th>ÉTAPE</th>
                                    <th>SMS ENVOYÉ</th>
                                    <th>DATE</th>
                                    <th>STATUT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan="6" align="center">Chargement...</td></tr>
                                ) : (
                                    patients.slice(0, 5).map((patient) => (
                                        <tr key={patient.id} onClick={() => navigate(`/patient/${patient.id}`)} style={{ cursor: 'pointer' }}>
                                            <td>
                                                <div className="patient-info-cell">
                                                    <div className="patient-avatar-mini">
                                                        {patient.full_name?.split(' ').map(n => n[0]).join('') || '??'}
                                                    </div>
                                                    <div className="patient-details-mini">
                                                        <span className="patient-name-mini">{patient.full_name}</span>
                                                        <span className="patient-op-mini">{patient.intervention}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="feedback-tags">
                                                    <span className="feedback-tag red">Douleur signalée</span>
                                                    <span className="feedback-tag gray">Gonflement important</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="step-label">J+15</span>
                                            </td>
                                            <td>
                                                <div className="sms-status">
                                                    <Check size={14} color="#10B981" />
                                                    <span>Consulté</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{ fontSize: '13px', fontWeight: '600' }}>11 févr. 2024</span>
                                            </td>
                                            <td>
                                                <div className="risk-status-text">
                                                    <Activity size={14} />
                                                    <span>VIGILANCE PRIORITAIRE</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
            <MobileNavbar />
            <AddPatientModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={loadDashboard}
            />
        </div>
    );
}
