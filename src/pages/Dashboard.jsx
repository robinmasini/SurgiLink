import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AddPatientModal from '../components/AddPatientModal';
import christopheSignature from '../assets/christophe-signature.png';
import welcomeCardV4 from '../assets/welcome-card-v4.jpg';
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
import { supabase } from '../lib/supabase';
import { calculateDaysUntilSurgery } from '../utils/dateUtils';

export default function Dashboard() {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [patients, setPatients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        active: 0,
        complete: 0,
        required: 0,
        weekly: 0,
        recentActive: 0
    });

    useEffect(() => {
        loadPatients();
    }, []);

    const loadPatients = async () => {
        setIsLoading(true);
        try {
            // Fetch all patients to calculate stats (if dataset is small)
            // Or fetch separate counts for better performance if dataset grows
            const { data: allPatients, error: allPatientsError } = await supabase
                .from('patients')
                .select('*');

            if (allPatientsError) throw allPatientsError;

            // Calculate stats
            const now = new Date();
            const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1));
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);

            const activeCount = allPatients.length;
            const completeCount = allPatients.filter(p => p.progress === 100).length;
            const requiredCount = allPatients.filter(p => p.status === 'incomplete').length;
            const weeklyCount = allPatients.filter(p => {
                if (!p.date) return false;
                const surgeryDate = new Date(p.date);
                return surgeryDate >= startOfWeek && surgeryDate <= endOfWeek;
            }).length;

            // Calculate "recent active" (+X cette semaine)
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const recentActiveCount = allPatients.filter(p => new Date(p.created_at) >= oneWeekAgo).length;

            setStats({
                active: activeCount,
                complete: completeCount,
                required: requiredCount,
                weekly: weeklyCount,
                recentActive: recentActiveCount
            });

            // Format 5 most recent patients for display
            const recentPatients = allPatients
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 5);

            const formattedPatients = recentPatients.map(patient => ({
                ...patient,
                daysUntil: calculateDaysUntilSurgery(patient.date),
                date: patient.date ? new Date(patient.date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                }) : 'Non définie'
            }));

            setPatients(formattedPatients);
        } catch (err) {
            console.error('Error loading patients:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePatientAdded = (newPatient) => {
        loadPatients(); // Reload patients
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
                    actions={
                        <button
                            className="btn btn-secondary"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-2)',
                                background: 'white',
                                color: 'var(--color-primary-600)',
                                border: '1px solid var(--color-primary-100)',
                                fontWeight: '600',
                                boxShadow: 'var(--shadow-sm)'
                            }}
                            onClick={() => window.location.href = 'tel:0491550000'}
                        >
                            <Phone size={18} />
                            Appeler la Clinique
                        </button>
                    }
                />


                {/* Dashboard Top Section: Banner + Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-6)', marginBottom: 'var(--spacing-8)' }}>
                    {/* Welcome Banner */}
                    <div className="welcome-banner fade-in">
                        <div className="welcome-banner-content">
                            {/* Top Section - Empty for spacing */}
                            <div>
                            </div>

                            {/* Middle Section */}
                            <div>
                                <div className="welcome-banner-welcome">Bonjour,</div>
                                <a
                                    href="https://www.desouches-chirurgien-esthetique.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="welcome-banner-signature-link"
                                >
                                    <img src={christopheSignature} alt="Christophe DESOUCHES" className="welcome-banner-signature" />
                                </a>
                                <div className="welcome-banner-greeting">Ravi de vous revoir !</div>
                                <div className="welcome-banner-instruction">Consultez votre Espace Praticien</div>
                            </div>

                            {/* Bottom Section - Date */}
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
                            src={welcomeCardV4}
                            alt="Espace Opératoire"
                            className="welcome-banner-image"
                        />
                    </div>

                    {/* Stats Cards Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
                        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/review/active')}>
                            <div className="stat-card-icon" style={{ background: 'var(--color-primary-50)' }}>
                                <Users size={24} style={{ color: 'var(--color-primary-500)' }} />
                            </div>
                            <div className="stat-card-value">{stats.active}</div>
                            <div className="stat-card-label">Patients actifs</div>
                            <div className="stat-card-meta">+{stats.recentActive} cette semaine</div>
                        </div>

                        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/review/complete')}>
                            <div className="stat-card-icon" style={{ background: 'var(--color-success-50)' }}>
                                <CheckCircle size={24} style={{ color: 'var(--color-success-500)' }} />
                            </div>
                            <div className="stat-card-value">{stats.complete}</div>
                            <div className="stat-card-label">Protocoles complets</div>
                            <div className="stat-card-meta">{stats.active > 0 ? Math.round((stats.complete / stats.active) * 100) : 0}% de conformité</div>
                        </div>

                        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/review/required')}>
                            <div className="stat-card-icon" style={{ background: 'var(--color-warning-50)' }}>
                                <AlertTriangle size={24} style={{ color: 'var(--color-warning-500)' }} />
                            </div>
                            <span className="badge badge-danger stat-card-badge">Priorité</span>
                            <div className="stat-card-value">{stats.required}</div>
                            <div className="stat-card-label">Actions requises</div>
                            <div className="stat-card-meta" style={{ color: 'var(--color-danger-500)' }}>
                                {stats.required > 0 ? "Attention requise" : "Tout est à jour"}
                            </div>
                        </div>

                        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/review/weekly')}>
                            <div className="stat-card-icon" style={{ background: 'var(--color-info-50)' }}>
                                <Calendar size={24} style={{ color: 'var(--color-info-500)' }} />
                            </div>
                            <div className="stat-card-value">{stats.weekly}</div>
                            <div className="stat-card-label">Interventions cette semaine</div>
                            <div className="stat-card-meta">
                                {stats.weekly > 0 ? "Suivi en cours" : "Aucune prévue"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Patients List */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
                        <div>
                            <h3 style={{ marginBottom: 'var(--spacing-1)' }}>Patients en suivi</h3>
                            <p style={{ fontSize: 'var(--font-size-sm)' }}>Liste des patients avec leur statut actuel</p>
                        </div>
                        <div className="card-header-actions" style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
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
                                                <div className={
                                                    patient.daysUntil === 'J-1' ? 'deadline-red' :
                                                        (patient.daysUntil === 'J+1' || patient.daysUntil === 'J+2') ? 'deadline-orange' :
                                                            (patient.daysUntil === 'J-7' || patient.daysUntil === 'J-8') ? 'deadline-green' :
                                                                ''
                                                } style={{ fontSize: 'var(--font-size-xs)' }}>{patient.daysUntil}</div>
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
