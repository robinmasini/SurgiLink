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
    Filter,
    ChevronRight,
    AlertCircle,
    Plus,
    Activity,
    ClipboardCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AddPatientModal from '../components/AddPatientModal';
import practitionerAvatar from '../assets/practitioner-avatar.png';

export default function Dashboard() {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        setIsLoading(true);
        if (!supabase) {
            setIsLoading(false);
            return;
        }

        try {
            // Get user profile
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (!profileError && profileData) {
                    setProfile(profileData);
                } else {
                    // Fallback based on email if profile fetch fails
                    const email = session.user.email;
                    if (email === 'christophe.desouches@gmail.com') {
                        setProfile({
                            full_name: 'Dr. Christophe DESOUCHES',
                            role: 'practitioner'
                        });
                    } else if (email === 'infirmier.desouches@gmail.com') {
                        setProfile({
                            full_name: 'Infirmier Cabinet',
                            role: 'nurse'
                        });
                    } else {
                        setProfile({
                            full_name: email.split('@')[0].toUpperCase(),
                            role: 'practitioner'
                        });
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
        { label: 'Total Patients', value: patients.length, icon: Users, color: 'var(--color-primary-500)' },
        { label: 'En attente J-7', value: patients.filter(p => p.status === 'PENDING').length, icon: Clock, color: 'var(--color-warning-500)' },
        { label: 'Urgent/Vigilance', value: patients.filter(p => ['VIGILANCE', 'URGENT'].includes(p.risk_status)).length, icon: AlertCircle, color: 'var(--color-danger-500)' },
        { label: 'Complétés', value: patients.filter(p => p.progress === 100).length, icon: ClipboardCheck, color: 'var(--color-success-500)' },
    ];

    const filteredPatients = patients.filter(p =>
        p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.intervention?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="layout">
            <Sidebar />
            <main className="main-content">
                <Header
                    title={profile?.role === 'nurse' ? "Espace Infirmier" : "Espace Praticien"}
                    subtitle={profile?.full_name ? `Cabinet de ${profile.full_name}` : "Chargement..."}
                    actions={
                        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
                            <Plus size={18} />
                            <span>Ajouter un patient</span>
                        </button>
                    }
                />

                <div className="dashboard-mobile-profile">
                    <div className="mobile-profile-card">
                        <img src={practitionerAvatar} alt={profile?.full_name || "Utilisateur"} className="mobile-profile-img" />
                        <div className="mobile-profile-info">
                            <h3>{profile?.full_name || "Utilisateur"}</h3>
                            <p>{profile?.role === 'practitioner' ? 'Praticien' : 'Infirmier Cabinet'}</p>
                        </div>
                    </div>
                </div>

                <div className="stats-grid">
                    {stats.map((stat, i) => (
                        <div key={i} className="stat-card fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                            <div className="stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                                <stat.icon size={24} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-label">{stat.label}</span>
                                <span className="stat-value">{stat.value}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="section-card">
                    <div className="section-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                            <Activity size={20} color="var(--color-primary-500)" />
                            <h2>Activité récente</h2>
                        </div>
                        <div className="search-bar">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Rechercher un patient..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Patient</th>
                                    <th>Intervention</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Risque</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan="6" align="center">Chargement...</td></tr>
                                ) : filteredPatients.length === 0 ? (
                                    <tr><td colSpan="6" align="center">Aucun patient trouvé</td></tr>
                                ) : (
                                    filteredPatients.slice(0, 5).map((patient) => (
                                        <tr key={patient.id} onClick={() => navigate(`/patient/${patient.id}`)} style={{ cursor: 'pointer' }}>
                                            <td>
                                                <div className="patient-cell">
                                                    <div className="patient-avatar">
                                                        {patient.full_name?.charAt(0)}
                                                    </div>
                                                    <span className="patient-name">{patient.full_name}</span>
                                                </div>
                                            </td>
                                            <td>{patient.intervention}</td>
                                            <td>{new Date(patient.surgery_date).toLocaleDateString()}</td>
                                            <td>
                                                <span className={`status-badge status-${patient.status?.toLowerCase()}`}>
                                                    {patient.status}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`risk-badge risk-${patient.risk_status?.toLowerCase() || 'normal'}`}>
                                                    {patient.risk_status || 'NORMAL'}
                                                </span>
                                            </td>
                                            <td><ChevronRight size={18} color="var(--color-gray-400)" /></td>
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
