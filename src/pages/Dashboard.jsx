import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import MobileNavbar from '../components/MobileNavbar';
import Header from '../components/Header';
import AddPatientModal from '../components/AddPatientModal';
import practitionerAvatar from '../assets/practitioner-avatar.png';
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
    Phone,
    LogOut
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { calculateDaysUntilSurgery } from '../utils/dateUtils';
import StatusBolt from '../components/StatusBolt';
import PatientStatusBadges from '../components/PatientStatusBadges';
import PatientDetailPanel from '../components/PatientDetailPanel';

export default function Dashboard() {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [allPatients, setAllPatients] = useState([]);
    const [patients, setPatients] = useState([]);
    const [responses, setResponses] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPatientId, setSelectedPatientId] = useState(null);
    const [activeTab, setActiveTab] = useState('Tous');
    const [stats, setStats] = useState({
        active: 0,
        complete: 0,
        required: 0,
        weekly: 0,
        recentActive: 0
    });
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

    const tabs = ['J-10', 'J-7', 'J-2', 'J-1', 'Jour J', 'J+1', 'J+4', 'Tous', 'Archivés'];

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        loadPatients();
    }, []);

    useEffect(() => {
        filterPatients();
    }, [allPatients, activeTab]);

    const filterPatients = () => {
        let filtered = [...allPatients];

        if (activeTab === 'Archivés') {
            filtered = filtered.filter(p => p.status === 'archived');
        } else if (activeTab === 'Tous') {
            filtered = filtered.filter(p => p.status !== 'archived');
        } else {
            filtered = filtered.filter(p => {
                const daysUntil = calculateDaysUntilSurgery(p.date);
                const tabDate = activeTab === 'Jour J' ? 'J-0' : activeTab;
                return daysUntil === tabDate;
            });
        }

        setPatients(filtered);
    };

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
            const requiredCount = allPatients.filter(p => p.status === 'alerte' || p.status === 'critique').length;
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

            const formattedPatients = allPatients.map(patient => ({
                ...patient,
                daysUntil: calculateDaysUntilSurgery(patient.date),
                formattedDate: patient.date ? new Date(patient.date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                }) : 'Non définie'
            }));

            setAllPatients(formattedPatients);

            // Fetch responses for these patients to show pastilles
            if (formattedPatients.length > 0) {
                const { data: respData } = await supabase
                    .from('pathway_responses')
                    .select('*')
                    .in('patient_id', formattedPatients.map(p => p.id));

                const respMap = {};
                (respData || []).forEach(r => {
                    if (!respMap[r.patient_id]) respMap[r.patient_id] = [];
                    respMap[r.patient_id].push(r);
                });
                setResponses(respMap);
            }
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
        return <StatusBolt status={status} showLabel={true} />;
    };


    return (
        <div className="dashboard-layout" data-mobile={isMobile}>
            <Sidebar />
            <main className="main-content" data-mobile={isMobile}>
                <Header
                    title="Tableau de Bord"
                    subtitle="Vue d'ensemble de vos patients et indicateurs clés"
                    hideTitleMobile={true}
                    actions={
                        <button
                            className="btn btn-secondary hide-mobile"
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

                <div className="dashboard-grid-top" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 'var(--spacing-6)' }}>

                    {isMobile && (
                        <>
                            <div className="mobile-profile-card-new">
                                <div className="mobile-profile-left">
                                    <img src={practitionerAvatar} alt="Dr. Christophe Desouches" className="mobile-profile-img" />
                                </div>
                                <div className="mobile-profile-right">
                                    <div className="mobile-profile-identity">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                                            <h3>DESOUCHES CHRISTOPHE</h3>
                                            <button
                                                className="logout-icon-btn"
                                                onClick={async () => {
                                                    await supabase.auth.signOut();
                                                    navigate('/login');
                                                }}
                                                style={{ background: 'transparent', border: 'none', color: 'var(--color-danger-500)', padding: 0, cursor: 'pointer' }}
                                            >
                                                <LogOut size={18} />
                                            </button>
                                        </div>
                                        <div className="badge-admin">ADMIN PRO</div>
                                        <span className="profile-role">Praticien</span>
                                    </div>
                                    <div className="mobile-profile-metier">
                                        <span className="metier-label">CORPS DE MÉTIER</span>
                                        <span className="metier-value">CHIRURGIE ESTHÉTIQUE</span>
                                        <span className="metier-value">PLASTIQUE RECONSTRUCTRICE</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                className="mobile-call-btn"
                                onClick={() => window.location.href = 'tel:0491550000'}
                            >
                                <Phone size={18} />
                                Appeler la Clinique
                            </button>
                        </>
                    )}

                    {/* Stats Cards Grid */}
                    <div className="stat-grid" style={{ gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)' }}>
                        <div className="stat-card" style={{ cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => navigate('/patients')}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-3)' }}>
                                <div className="stat-card-icon" style={{ background: 'var(--color-primary-50)', marginBottom: 0 }}>
                                    <Users size={24} style={{ color: 'var(--color-primary-500)' }} />
                                </div>
                                <span className="badge badge-primary">Actif</span>
                            </div>
                            <div className="stat-card-value" style={{ fontSize: 'var(--font-size-3xl)' }}>{stats.active}</div>
                            <div className="stat-card-label" style={{ fontWeight: '600', color: 'var(--color-gray-500)' }}>Patients actifs</div>
                            <div className="stat-card-meta" style={{ color: 'var(--color-primary-600)', fontWeight: '600' }}>+{stats.recentActive} cette semaine</div>
                        </div>

                        <div className="stat-card" style={{
                            cursor: 'pointer',
                            background: stats.active > 0 && (stats.complete / stats.active) < 0.8 ? 'var(--color-warning-50)' : 'white',
                            borderColor: stats.active > 0 && (stats.complete / stats.active) < 0.8 ? 'var(--color-warning-200)' : 'var(--color-gray-100)',
                            transition: 'all 0.3s'
                        }} onClick={() => navigate('/review/complete')}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-3)' }}>
                                <div className="stat-card-icon" style={{ background: 'var(--color-success-50)', marginBottom: 0 }}>
                                    <CheckCircle size={24} style={{ color: 'var(--color-success-500)' }} />
                                </div>
                                {stats.active > 0 && (stats.complete / stats.active) < 0.8 && (
                                    <span className="badge badge-warning">À améliorer</span>
                                )}
                            </div>
                            <div className="stat-card-value" style={{ fontSize: 'var(--font-size-3xl)' }}>{stats.complete}</div>
                            <div className="stat-card-label" style={{ fontWeight: '600', color: 'var(--color-gray-500)' }}>Protocoles complets</div>
                            <div className="stat-card-meta" style={{ color: 'var(--color-success-600)', fontWeight: '600' }}>
                                {stats.active > 0 ? Math.round((stats.complete / stats.active) * 100) : 0}% de conformité
                            </div>
                        </div>

                        <div className="stat-card" style={{
                            cursor: 'pointer',
                            background: stats.required > 0 ? 'var(--color-danger-50)' : 'white',
                            borderColor: stats.required > 0 ? 'var(--color-danger-100)' : 'var(--color-gray-100)',
                            transition: 'all 0.3s'
                        }} onClick={() => navigate('/review/required')}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-3)' }}>
                                <div className="stat-card-icon" style={{ background: 'var(--color-danger-50)', marginBottom: 0 }}>
                                    <AlertTriangle size={24} style={{ color: 'var(--color-danger-500)' }} />
                                </div>
                                {stats.required > 0 && (
                                    <span className="badge badge-danger badge-pulse">Priorité</span>
                                )}
                            </div>
                            <div className="stat-card-value" style={{ fontSize: 'var(--font-size-3xl)', color: stats.required > 0 ? 'var(--color-danger-600)' : 'inherit' }}>{stats.required}</div>
                            <div className="stat-card-label" style={{ fontWeight: '600', color: 'var(--color-gray-500)' }}>Actions requises</div>
                            <div className="stat-card-meta" style={{ color: stats.required > 0 ? 'var(--color-danger-600)' : 'var(--color-success-600)', fontWeight: '600' }}>
                                {stats.required > 0 ? "Attention immédiate" : "Tout est sécurisé"}
                            </div>
                        </div>

                        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/review/weekly')}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-3)' }}>
                                <div className="stat-card-icon" style={{ background: 'var(--color-info-50)', marginBottom: 0 }}>
                                    <Calendar size={24} style={{ color: 'var(--color-info-500)' }} />
                                </div>
                                <span className="badge badge-info">Planning</span>
                            </div>
                            <div className="stat-card-value" style={{ fontSize: 'var(--font-size-3xl)' }}>{stats.weekly}</div>
                            <div className="stat-card-label" style={{ fontWeight: '600', color: 'var(--color-gray-500)' }}>Interventions / 7j</div>
                            <div className="stat-card-meta" style={{ color: 'var(--color-info-600)', fontWeight: '600' }}>
                                {stats.weekly > 0 ? "Suivi planifié" : "Aucune écheance"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Risk Assessment Section - New */}
                {allPatients.filter(p => (p.daysUntil === 'J-1' || p.daysUntil === 'J-0') && p.status !== 'ready').length > 0 && (
                    <div className="card fade-in" style={{
                        background: 'linear-gradient(135deg, #FFF5F5 0%, #FFF 100%)',
                        border: '1px solid #FEB2B2',
                        marginBottom: 'var(--spacing-6)',
                        padding: 'var(--spacing-4)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    background: '#FEE2E2',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#EF4444'
                                }}>
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <h4 style={{ color: '#9B1C1C', marginBottom: '2px' }}>Alerte : Créneaux à risque détectés</h4>
                                    <p style={{ fontSize: 'var(--font-size-sm)', color: '#C53030' }}>
                                        {allPatients.filter(p => (p.daysUntil === 'J-1' || p.daysUntil === 'J-0') && p.status !== 'ready').length} patients n'ont pas validé leur protocole pré-opératoire.
                                    </p>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '10px', color: '#C53030', fontWeight: '700', textTransform: 'uppercase' }}>Impact financier potentiel</div>
                                <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: '800', color: '#EF4444' }}>
                                    -{allPatients.filter(p => (p.daysUntil === 'J-1' || p.daysUntil === 'J-0') && p.status !== 'ready').length * 2450}€
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Action Bar & Risk Banner */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
                    <div className="tabs" style={{ display: 'flex', gap: 'var(--spacing-2)', overflowX: 'auto', paddingBottom: 'var(--spacing-2)' }}>
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    padding: 'var(--spacing-2) var(--spacing-4)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-gray-100)',
                                    background: activeTab === tab ? 'var(--color-primary-500)' : 'white',
                                    color: activeTab === tab ? 'white' : 'var(--color-gray-600)',
                                    fontSize: 'var(--font-size-sm)',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => setIsModalOpen(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}
                    >
                        <Plus size={18} /> Ajouter un patient
                    </button>
                </div>

                <div className="dashboard-content-split" style={{
                    display: 'grid',
                    gridTemplateColumns: selectedPatientId ? '1fr 380px' : '1fr',
                    gap: 'var(--spacing-6)',
                    alignItems: 'start',
                    transition: 'all 0.3s'
                }}>
                    {/* Patients List */}
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: 'var(--spacing-4)', borderBottom: '1px solid var(--color-gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: 'var(--font-size-lg)' }}>Liste des patients</h3>
                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)' }}>
                                {patients.length} patient{patients.length > 1 ? 's' : ''}
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--color-gray-100)', background: 'var(--color-gray-50)' }}>
                                        <th style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: '11px', color: 'var(--color-gray-500)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Patient</th>
                                        <th style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: '11px', color: 'var(--color-gray-500)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Retours patient</th>
                                        <th className="hide-tablet" style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: '11px', color: 'var(--color-gray-500)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Étape</th>
                                        <th className="hide-mobile" style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: '11px', color: 'var(--color-gray-500)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SMS Envoyé</th>
                                        {!selectedPatientId && (
                                            <>
                                                <th className="hide-tablet" style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: '11px', color: 'var(--color-gray-500)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                                                <th style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: '11px', color: 'var(--color-gray-500)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Statut</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan="6" style={{ padding: 'var(--spacing-12)', textAlign: 'center', color: 'var(--color-gray-400)' }}>
                                                Chargement des patients...
                                            </td>
                                        </tr>
                                    ) : patients.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" style={{ padding: 'var(--spacing-12)', textAlign: 'center', color: 'var(--color-gray-400)' }}>
                                                Aucun patient trouvé pour cette catégorie.
                                            </td>
                                        </tr>
                                    ) : patients.map((patient) => (
                                        <tr
                                            key={patient.id}
                                            style={{
                                                borderBottom: '1px solid var(--color-gray-50)',
                                                cursor: 'pointer',
                                                background: selectedPatientId === patient.id ? 'var(--color-primary-50)' : 'transparent',
                                                borderLeft: selectedPatientId === patient.id ? '4px solid var(--color-primary-500)' : 'none'
                                            }}
                                            className="table-row-hover"
                                            onClick={() => setSelectedPatientId(patient.id === selectedPatientId ? null : patient.id)}
                                        >
                                            <td style={{ padding: 'var(--spacing-3) var(--spacing-4)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                                                    <div style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '50%',
                                                        background: 'var(--color-primary-100)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: 'var(--font-size-sm)',
                                                        fontWeight: 'var(--font-weight-bold)',
                                                        color: 'var(--color-primary-700)'
                                                    }}>
                                                        {patient.name.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '600', color: 'var(--color-gray-900)' }}>{patient.name}</div>
                                                        <div style={{ fontSize: '11px', color: 'var(--color-gray-500)' }}>{patient.operation}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: 'var(--spacing-3) var(--spacing-4)' }}>
                                                <PatientStatusBadges
                                                    responses={responses[patient.id] || []}
                                                    daysUntil={patient.daysUntil}
                                                    patientStatus={patient.status}
                                                />
                                            </td>
                                            <td className="hide-tablet" style={{ padding: 'var(--spacing-3) var(--spacing-4)' }}>
                                                <span
                                                    className={
                                                        patient.daysUntil === 'J-1' || patient.daysUntil === 'J-2' ? 'deadline-red' :
                                                            patient.daysUntil === 'J-7' || patient.daysUntil === 'J-10' ? 'deadline-green' :
                                                                patient.daysUntil.includes('J+') ? 'deadline-orange' : 'deadline-green'
                                                    }
                                                    style={{ fontSize: '11px', fontWeight: '700' }}
                                                >
                                                    {patient.daysUntil}
                                                </span>
                                            </td>
                                            <td className="hide-mobile" style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontSize: '11px', color: 'var(--color-gray-500)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
                                                    <Clock size={12} />
                                                    {patient.daysUntil === 'J-0' ? 'Intervention du jour' : 'Consulté'}
                                                </div>
                                            </td>
                                            {!selectedPatientId && (
                                                <>
                                                    <td className="hide-tablet" style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontSize: '11px', color: 'var(--color-gray-600)' }}>
                                                        {patient.formattedDate}
                                                    </td>
                                                    <td style={{ padding: 'var(--spacing-3) var(--spacing-4)' }}>
                                                        {getStatusBadge(patient.status)}
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Side Detail Panel (Phase 3) */}
                    {selectedPatientId && (
                        <PatientDetailPanel
                            patient={patients.find(p => p.id === selectedPatientId)}
                            responses={responses[selectedPatientId] || []}
                            onClose={() => setSelectedPatientId(null)}
                        />
                    )}
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
