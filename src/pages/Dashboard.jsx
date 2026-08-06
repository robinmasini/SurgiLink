import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar from '../components/Sidebar';
import MobileNavbar from '../components/MobileNavbar';
import Header from '../components/Header';
import AddPatientModal from '../components/AddPatientModal';
import HMScannerModal from '../components/HMScannerModal';
import NewIntakeModal from '../components/NewIntakeModal';
import hmIcon from '../assets/hm-icon.png';
import hmDoctolibIcon from '../assets/hm-doctolib.png';
import LogoIcon from '../components/LogoIcon';
import practitionerAvatar from '../assets/practitioner-avatar.png';
import welcomeCardV4 from '../assets/welcome-card-v4.jpg';
import welcomeCardInfirmier from '../assets/welcomecard-infirmier.png';
import christopheSignature from '../assets/christophe-signature.png';
import nurseAvatar from '../assets/nurse-avatar.png';
import wppPhone from '../assets/wpp-phone.png';
import doctolibLogo from '../assets/doctolib.png';
import {
    Users,
    AlertTriangle,
    CheckCircle,
    Clock,
    Calendar,
    TrendingUp,
    Activity,
    X,
    User,
    Clipboard,
    ClipboardList,
    Mail,
    Phone,
    LogOut,
    Settings,
    Zap,
    Plus,
    Sparkles,
    Search
} from 'lucide-react';

import { supabase } from '../lib/supabase';
import { calculateDaysUntilSurgery } from '../utils/dateUtils';
import StatusBolt from '../components/StatusBolt';
import PatientStatusBadges from '../components/PatientStatusBadges';
import PatientDetailPanel from '../components/PatientDetailPanel';
import SMSAlarmsModal from '../components/SMSAlarmsModal'; // Added
import QuestionsPreviewModal from '../components/QuestionsPreviewModal';
import { consolidateDuplicatePatients, calculateGlobalProgress } from '../services/pathwayService';

export default function Dashboard() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false); // Renamed from isModalOpen
    const [isAlarmsModalOpen, setIsAlarmsModalOpen] = useState(false); // Added
    const [isHMScannerOpen, setIsHMScannerOpen] = useState(false);
    const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);
    const [isQuestionsPreviewOpen, setIsQuestionsPreviewOpen] = useState(false);
    const [allPatients, setAllPatients] = useState([]);
    const [patients, setPatients] = useState([]);
    const [responses, setResponses] = useState({});
    const [intakeResponses, setIntakeResponses] = useState({});
    const [financialImpactUnit, setFinancialImpactUnit] = useState(2450);
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
    const [profile, setProfile] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
    const [searchTerm, setSearchTerm] = useState('');

    const tabs = ['J-18', 'J-7', 'J-1', 'Jour J', 'J+1', 'J+4', 'ESATIS', 'Tous', 'Nouveaux patients', 'Archivés'];

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fixSettings = async () => {
            try {
                const { data, error } = await supabase
                    .from('app_settings')
                    .select('*')
                    .eq('key', 'reminder_offsets')
                    .maybeSingle();

                if (data && data.value) {
                    const value = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
                    if (value.welcome !== -18) {
                        console.log("[SettingsAutoFix] welcome offset is currently", value.welcome, ". Updating to -18...");
                        const updatedValue = { ...value, welcome: -18 };
                        await supabase
                            .from('app_settings')
                            .update({ value: updatedValue })
                            .eq('key', 'reminder_offsets');
                        console.log("[SettingsAutoFix] Updated welcome offset successfully.");
                    }
                }
            } catch (e) {
                console.warn("[SettingsAutoFix] failed:", e);
            }
        };
        fixSettings();
        loadDashboard(); // Renamed from loadPatients
    }, []);

    useEffect(() => {
        filterPatients();
    }, [allPatients, activeTab, searchTerm]);

    const filterPatients = () => {
        let filtered = [...allPatients];

        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(p => 
                (p.name && p.name.toLowerCase().includes(lowerSearch)) ||
                (p.operation && p.operation.toLowerCase().includes(lowerSearch)) ||
                (p.phone && p.phone.includes(searchTerm))
            );
        }

        if (activeTab === 'Archivés') {
            filtered = filtered.filter(p => p.status === 'archived');
        } else if (activeTab === 'Tous') {
            filtered = filtered.filter(p => p.status !== 'archived');
        } else if (activeTab === 'Nouveaux patients') {
            filtered = filtered.filter(p => p.status === 'intake');
        } else {
            filtered = filtered.filter(p => {
                const daysUntil = calculateDaysUntilSurgery(p.date);
                let tabDate = activeTab === 'Jour J' ? 'J-0' : activeTab;
                if (activeTab === 'ESATIS') {
                    tabDate = 'J+4';
                }
                return daysUntil === tabDate;
            });
        }

        setPatients(filtered);
    };

    const loadDashboard = async () => { // Renamed from loadPatients
        let isMounted = true;
        setIsLoading(true);
        try {
            // 0. Get current session and profile
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
                return;
            }

            const { data: curProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();

            const userRole = curProfile?.role || (session.user.email?.toLowerCase().includes('infirmier') ? 'nurse' : 'practitioner');
            const practitionerId = curProfile?.practitioner_id || (userRole === 'nurse' ? 'c512fc61-e751-4ea3-872e-8a04fee4da12' : session.user.id);

            // Fetch patients based on role and affiliation
            let query = supabase.from('patients').select('*');

            if (userRole === 'nurse') {
                // Nurse sees patients of their affiliated practitioner
                query = query.eq('user_id', practitionerId);
            } else {
                // Practitioner sees their own patients
                query = query.eq('user_id', session.user.id);
            }

            const { data: rawPatientsData, error: allPatientsError } = await query;

            if (allPatientsError) throw allPatientsError;
            if (!isMounted || !rawPatientsData) return;

            const allPatientsData = [...rawPatientsData];

            // Recalculate progress for all patients to ensure live date status is accurate
            await Promise.all(allPatientsData.map(async (p) => {
                try {
                    const res = await calculateGlobalProgress(p.id);
                    if (res && typeof res === 'object') {
                        if (res.status) p.status = res.status;
                        if (res.progress !== undefined) p.progress = res.progress;
                    }
                } catch (e) {
                    console.warn('Error updating patient progress:', e);
                }
            }));

            // Calculate stats
            const now = new Date();
            const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1));
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);

            const activeCount = allPatientsData.length;
            const completeCount = allPatientsData.filter(p => p.progress === 100).length;
            const requiredCount = allPatientsData.filter(p => p.status === 'alerte' || p.status === 'critique').length;
            const weeklyCount = allPatientsData.filter(p => {
                if (!p.date) return false;
                const surgeryDate = new Date(p.date);
                return surgeryDate >= startOfWeek && surgeryDate <= endOfWeek;
            }).length;

            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const recentActiveCount = allPatientsData.filter(p => new Date(p.created_at) >= oneWeekAgo).length;

            if (isMounted) {
                setStats({
                    active: activeCount,
                    complete: completeCount,
                    required: requiredCount,
                    weekly: weeklyCount,
                    recentActive: recentActiveCount
                });

                // Deduplicate by normalized name
                const patientGroups = {};
                (allPatientsData || []).forEach(p => {
                    const normName = (p.name || '').trim().toLowerCase();
                    if (!normName) return;
                    if (!patientGroups[normName]) patientGroups[normName] = [];
                    patientGroups[normName].push(p);
                });

                const uniquePatientsData = Object.values(patientGroups).map(group => {
                    if (group.length === 1) return group[0];
                    const withDate = group.find(p => p.date && p.operation && p.operation !== 'Non renseigné');
                    if (withDate) return withDate;
                    const withOp = group.find(p => p.operation && p.operation !== 'Non renseigné');
                    if (withOp) return withOp;
                    return group[0];
                });

                let formattedPatients = uniquePatientsData.map(patient => ({
                    ...patient,
                    daysUntil: calculateDaysUntilSurgery(patient.date),
                    formattedDate: patient.date ? new Date(patient.date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                    }) : 'Non définie'
                }));

                // Apply Nurse Visibility Rule: Only J+1, J+2, etc.
                if (userRole === 'nurse') {
                    formattedPatients = formattedPatients.filter(p => {
                        const days = parseInt(p.daysUntil.replace('J', '')) || 0;
                        // J+1, J+2... means days < 0 in our calculateDaysUntilSurgery logic
                        return p.daysUntil.startsWith('J+');
                    });
                }

                // Background cleanup of duplicate records in DB
                consolidateDuplicatePatients();

                // Fetch responses & intake form responses for all patient IDs (including duplicates)
                const allIdsToFetch = (allPatientsData || []).map(p => p.id);
                const idToName = {};
                (allPatientsData || []).forEach(p => { idToName[p.id] = (p.name || '').trim().toLowerCase(); });
                const nameToPrimaryId = {};
                formattedPatients.forEach(p => { nameToPrimaryId[(p.name || '').trim().toLowerCase()] = p.id; });

                const [respDataRes, intakeDataRes] = await Promise.all([
                    supabase.from('pathway_responses').select('*').in('patient_id', allIdsToFetch),
                    supabase.from('intake_form_responses').select('patient_id, id_card_recto, cni_in_person').in('patient_id', allIdsToFetch)
                ]);

                if (isMounted) {
                    const respMap = {};
                    (respDataRes.data || []).forEach(r => {
                        const pName = idToName[r.patient_id];
                        const targetId = nameToPrimaryId[pName] || r.patient_id;
                        [targetId, String(targetId), pName].forEach(key => {
                            if (key !== undefined && key !== null) {
                                if (!respMap[key]) respMap[key] = [];
                                respMap[key].push(r);
                            }
                        });
                    });
                    setResponses(respMap);

                    const intakeMap = {};
                    (intakeDataRes.data || []).forEach(r => {
                        const pName = idToName[r.patient_id];
                        const targetId = nameToPrimaryId[pName] || r.patient_id;
                        [targetId, String(targetId), pName].forEach(key => {
                            if (key !== undefined && key !== null) {
                                if (!intakeMap[key] || r.id_card_recto || r.cni_in_person) {
                                    intakeMap[key] = r;
                                }
                            }
                        });
                    });
                    setIntakeResponses(intakeMap);
                }

                // 4. Fetch financial impact unit
                try {
                    const { data: settingsData } = await supabase
                        .from('app_settings')
                        .select('value')
                        .eq('key', 'financial_impact_unit')
                        .maybeSingle();

                    if (settingsData?.value) {
                        setFinancialImpactUnit(parseInt(settingsData.value) || 2450);
                    }
                } catch (e) {
                    console.warn('Error fetching financial impact setting:', e);
                }

                if (isMounted) {
                    formattedPatients.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
                    setAllPatients(formattedPatients);

                    // Profile for mobile
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session && isMounted) {
                        const { data: profileData, error: profileError } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', session.user.id)
                            .single();

                        if (isMounted) {
                            if (profileData && !profileError) {
                                setProfile(profileData);
                            } else {
                                // Fallback based on email
                                const email = session.user.email?.toLowerCase() || '';
                                if (email.includes('infirmier') || email.includes('nurse')) {
                                    setProfile({
                                        full_name: 'Dr. Christophe DESOUCHES',
                                        role: 'nurse',
                                        practitioner_id: 'c512fc61-e751-4ea3-872e-8a04fee4da12'
                                    });
                                } else {
                                    setProfile({
                                        full_name: 'Dr. Christophe DESOUCHES',
                                        role: 'practitioner'
                                    });
                                }
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Error loading patients:', err);
        } finally {
            if (isMounted) setIsLoading(false);
        }
        return () => { isMounted = false; };
    };

    const getStatusBadge = (status) => {
        return <StatusBolt status={status} showLabel={true} />;
    };


    return (
        <div 
        className="dashboard-layout"
            data-mobile={isMobile}
        >
            <Sidebar />
            <main className="main-content" data-mobile={isMobile}>
                <Header
                    title={t("Tableau de Bord")}
                    subtitle={t("Vue d'ensemble de vos patients et indicateurs clés")}
                    hideTitleMobile={true}
                    hideQuestionsPreviewMobile={true}
                    actions={
                        <>
                            <button className="btn btn-secondary hide-mobile" onClick={() => setIsAlarmsModalOpen(true)} style={{ borderRadius: '12px', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <LogoIcon width="16px" />
                                <span>{t('Alarme')}</span>
                            </button>
                            <button
                                className="btn btn-secondary hide-mobile"
                                onClick={() => setIsIntakeModalOpen(true)}
                                style={{
                                    borderRadius: '12px',
                                    padding: '10px 20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: 'var(--color-success-50)',
                                    color: 'var(--color-success-600)',
                                    border: '1px solid var(--color-success-200)',
                                    fontWeight: '700'
                                }}
                            >
                                <ClipboardList size={16} />
                                <span>Nouveau(elle) patient(e)</span>
                            </button>
                            <button 
                                className="btn btn-secondary hide-mobile" 
                                onClick={() => setIsHMScannerOpen(true)} 
                                style={{ 
                                    borderRadius: '12px', 
                                    padding: '10px 20px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '8px',
                                    background: 'rgba(15, 112, 183, 0.1)',
                                    color: '#0F70B7',
                                    border: '1px solid rgba(15, 112, 183, 0.2)',
                                    fontWeight: '700'
                                }}
                            >
                                <img src={hmDoctolibIcon} alt="HM / Doctolib" style={{ height: '22px', width: 'auto', objectFit: 'contain' }} />
                                <span>Scanner patient(e)</span>
                            </button>
                             <div className="hide-mobile" style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center' }}>
                                <button
                                    onClick={() => window.open('https://pro.doctolib.fr/signin', '_blank')}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 'var(--spacing-2)',
                                        borderRadius: '12px',
                                        height: '42px',
                                        fontWeight: '700',
                                        background: '#0098e4',
                                        color: 'white',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '0 20px',
                                        boxShadow: 'var(--shadow-sm)',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.background = '#0082c3';
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.background = '#0098e4';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <img src={doctolibLogo} alt="Doctolib" style={{ height: '18px', objectFit: 'contain' }} />
                                    <span>{t('Planning')}</span>
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setIsAddModalOpen(true)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', height: '42px', justifyContent: 'center' }}
                                >
                                    <Plus size={18} /> Ajouter une intervention
                                </button>
                            </div>
                        </>
                    }
                />

                {/* Welcome Banner Removed from Dashboard as requested */}


                <div className="dashboard-grid-top" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 'var(--spacing-4)' }}>

                    {isMobile && (
                        <>
                            {/* Responsive mobile buttons row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '4px' }}>
                                <button 
                                    className="btn btn-secondary" 
                                    onClick={() => setIsAlarmsModalOpen(true)} 
                                    style={{ 
                                        borderRadius: '12px', 
                                        padding: '10px 14px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        gap: '8px',
                                        fontSize: '13px',
                                        fontWeight: '700',
                                        background: 'white',
                                        border: '1px solid var(--color-gray-200)',
                                        boxShadow: 'var(--shadow-sm)'
                                    }}
                                >
                                    <LogoIcon width="16px" />
                                    <span>{t('Alarme')}</span>
                                </button>
                                <button 
                                    className="btn btn-secondary" 
                                    onClick={() => setIsHMScannerOpen(true)} 
                                    style={{ 
                                        borderRadius: '12px', 
                                        padding: '10px 14px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        gap: '8px',
                                        background: 'rgba(15, 112, 183, 0.08)',
                                        color: '#0F70B7',
                                        border: '1px solid rgba(15, 112, 183, 0.15)',
                                        fontWeight: '700',
                                        fontSize: '13px',
                                        boxShadow: 'var(--shadow-sm)'
                                    }}
                                >
                                    <img src={hmDoctolibIcon} alt="HM / Doctolib" style={{ height: '20px', width: 'auto', objectFit: 'contain' }} />
                                    <span>Scanner patient(e)</span>
                                </button>
                            </div>

                            {/* Mobile Nouveau(elle) patient(e) */}
                            <button
                                className="btn btn-secondary"
                                onClick={() => setIsIntakeModalOpen(true)}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 'var(--spacing-2)',
                                    marginBottom: 'var(--spacing-2)',
                                    borderRadius: '12px',
                                    height: '42px',
                                    fontWeight: '700',
                                    background: 'var(--color-success-50)',
                                    color: 'var(--color-success-600)',
                                    border: '1px solid var(--color-success-200)',
                                    boxShadow: 'var(--shadow-sm)',
                                    fontSize: '13px',
                                }}
                            >
                                <ClipboardList size={16} />
                                Nouveau(elle) patient(e)
                            </button>

                            {/* Mobile Raccourci Doctolib Button */}
                            <button
                                onClick={() => window.open('https://pro.doctolib.fr/signin', '_blank')}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 'var(--spacing-2)',
                                    marginBottom: 'var(--spacing-2)',
                                    borderRadius: '12px',
                                    height: '42px',
                                    fontWeight: '700',
                                    background: '#0098e4',
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer',
                                    boxShadow: 'var(--shadow-sm)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = '#0082c3';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = '#0098e4';
                                }}
                            >
                                <img src={doctolibLogo} alt="Doctolib" style={{ height: '18px', objectFit: 'contain' }} />
                                <span>{t('Planning')}</span>
                            </button>

                            {/* Mobile Ajouter une intervention Button */}
                            <button
                                className="btn btn-secondary"
                                onClick={() => setIsAddModalOpen(true)}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 'var(--spacing-2)',
                                    marginBottom: 'var(--spacing-2)',
                                    borderRadius: '12px',
                                    height: '42px',
                                    fontWeight: '700',
                                    background: 'white',
                                    color: 'var(--color-primary-600)',
                                    border: '1px solid var(--color-primary-100)',
                                    boxShadow: 'var(--shadow-sm)'
                                }}
                            >
                                <Plus size={18} /> {t('Ajouter une intervention')}
                            </button>

                            {/* Mobile Questions Preview Button */}
                            <button
                                onClick={() => setIsQuestionsPreviewOpen(true)}
                                className="btn btn-secondary"
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 'var(--spacing-2)',
                                    padding: '10px 16px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--color-primary-100)',
                                    background: 'white',
                                    color: 'var(--color-primary-600)',
                                    fontSize: 'var(--font-size-sm)',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: 'var(--shadow-sm)',
                                    height: '42px',
                                    marginBottom: 'var(--spacing-2)'
                                }}
                            >
                                <Clipboard size={16} />
                                <span>{t('Aperçu')}</span>
                            </button>

                            <button
                                className="mobile-call-btn"
                                onClick={() => window.location.href = 'tel:0491550000'}
                            >
                                <Phone size={18} />
                                {t('Appeler la Clinique')}
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
                        }} onClick={() => navigate('/patients')}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-3)' }}>
                                <div className="stat-card-icon" style={{ background: 'var(--color-success-50)', marginBottom: 0 }}>
                                    <CheckCircle size={24} style={{ color: 'var(--color-success-500)' }} />
                                </div>
                                {stats.active > 0 && (stats.complete / stats.active) < 0.8 && (
                                    <span className="badge badge-warning">{t('À améliorer')}</span>
                                )}
                            </div>
                            <div className="stat-card-value" style={{ fontSize: 'var(--font-size-3xl)' }}>{stats.complete}</div>
                            <div className="stat-card-label" style={{ fontWeight: '600', color: 'var(--color-gray-500)' }}>{t('Protocoles complets')}</div>
                            <div className="stat-card-meta" style={{ color: 'var(--color-success-600)', fontWeight: '600' }}>
                                {stats.active > 0 ? Math.round((stats.complete / stats.active) * 100) : 0}% {t('de conformité')}
                            </div>
                        </div>

                        <div className="stat-card" style={{
                            cursor: 'pointer',
                            background: stats.required > 0 ? 'var(--color-danger-50)' : 'white',
                            borderColor: stats.required > 0 ? 'var(--color-danger-100)' : 'var(--color-gray-100)',
                            transition: 'all 0.3s'
                        }} onClick={() => navigate('/patients')}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-3)' }}>
                                <div className="stat-card-icon" style={{ background: 'var(--color-danger-50)', marginBottom: 0 }}>
                                    <AlertTriangle size={24} style={{ color: 'var(--color-danger-500)' }} />
                                </div>
                                {stats.required > 0 && (
                                    <span className="badge badge-danger badge-pulse">{t('Priorité')}</span>
                                )}
                            </div>
                            <div className="stat-card-value" style={{ fontSize: 'var(--font-size-3xl)', color: stats.required > 0 ? 'var(--color-danger-600)' : 'inherit' }}>{stats.required}</div>
                            <div className="stat-card-label" style={{ fontWeight: '600', color: 'var(--color-gray-500)' }}>{t('Actions requises')}</div>
                            <div className="stat-card-meta" style={{ color: stats.required > 0 ? 'var(--color-danger-600)' : 'var(--color-success-600)', fontWeight: '600' }}>
                                {stats.required > 0 ? t("Attention immédiate") : t("Tout est sécurisé")}
                            </div>
                        </div>

                        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/patients')}>
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
                        marginBottom: 'var(--spacing-4)',
                        padding: 'var(--spacing-4)',
                        cursor: 'pointer'
                    }} onClick={() => setIsAlarmsModalOpen(true)}>
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
                                    <h4 style={{ color: '#9B1C1C', marginBottom: '2px' }}>{t('Alerte : Créneaux à risque détectés')}</h4>
                                    <p style={{ fontSize: 'var(--font-size-sm)', color: '#C53030' }}>
                                        {allPatients.filter(p => (p.daysUntil === 'J-1' || p.daysUntil === 'J-0') && p.status !== 'ready').length} {t("patients n'ont pas validé leur protocole pré-opératoire.")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Action Bar & Risk Banner */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
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
                    {/* The "Ajouter un patient" button is now in the Header actions */}
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
                        <div style={{ padding: 'var(--spacing-4)', borderBottom: '1px solid var(--color-gray-100)', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--spacing-3)' }}>
                                <h3 style={{ fontSize: 'var(--font-size-lg)', margin: 0 }}>{t('Liste des patients')}</h3>
                                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)' }}>
                                    {patients.length} {t('patient(s)')}
                                </div>
                            </div>
                            <div style={{ position: 'relative', flex: 1, maxWidth: '400px', minWidth: '200px' }}>
                                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)' }} />
                                <input
                                    type="text"
                                    placeholder={t('Rechercher un patient...')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px 10px 40px',
                                        borderRadius: 'var(--radius-lg)',
                                        border: '1px solid var(--color-gray-200)',
                                        fontSize: 'var(--font-size-sm)',
                                        outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }}
                                />
                            </div>
                            <div style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--color-gray-500)', fontWeight: '600', padding: '6px 12px', background: 'var(--color-gray-50)', borderRadius: '6px', border: '1px solid var(--color-gray-200)' }}>
                                {t('Filtre : plus récent')}
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--color-gray-100)', background: 'var(--color-gray-50)' }}>
                                        <th style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: '11px', color: 'var(--color-gray-500)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('Patient')}</th>
                                        <th className="hide-mobile" style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: '11px', color: 'var(--color-gray-500)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('Retours patient')}</th>
                                        <th className="hide-tablet" style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: '11px', color: 'var(--color-gray-500)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('Étape')}</th>
                                        <th className="hide-mobile" style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: '11px', color: 'var(--color-gray-500)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('SMS Envoyé')}</th>
                                        {!selectedPatientId && (
                                            <>
                                                <th className="hide-tablet" style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: '11px', color: 'var(--color-gray-500)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('Date')}</th>
                                                <th style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: '11px', color: 'var(--color-gray-500)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('Statut')}</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan="6" style={{ padding: 'var(--spacing-12)', textAlign: 'center', color: 'var(--color-gray-400)' }}>
                                                {t('Chargement des patients...')}
                                            </td>
                                        </tr>
                                    ) : patients.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" style={{ padding: 'var(--spacing-12)', textAlign: 'center', color: 'var(--color-gray-400)' }}>
                                                {t('Aucun patient trouvé pour cette catégorie.')}
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
                                                    <div 
                                                        className="hide-mobile"
                                                        style={{
                                                            width: '36px',
                                                            height: '36px',
                                                            borderRadius: '50%',
                                                            background: 'var(--color-primary-100)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: 'var(--font-size-sm)',
                                                            fontWeight: 'var(--font-weight-bold)',
                                                            color: 'var(--color-primary-700)',
                                                            flexShrink: 0
                                                        }}
                                                    >
                                                        {patient.name.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '600', color: 'var(--color-gray-900)' }}>{patient.name}</div>
                                                        <div style={{ fontSize: '11px', color: 'var(--color-gray-500)' }}>{patient.operation}</div>
                                                         {isMobile && (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start', marginTop: '8px' }}>
                                                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                                    {!patient.date && patient.status !== 'intake' && (
                                                                        <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--color-success-50)', color: 'var(--color-success-600)', border: '1px solid var(--color-success-200)', fontWeight: '700', fontSize: '11px' }}>À jour ✓</span>
                                                                    )}
                                                                    {!patient.date && patient.status !== 'intake' && patient.stay_type !== 'Consultation' && (
                                                                        <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--color-danger-50)', color: 'var(--color-danger-600)', border: '1px solid var(--color-danger-100)', fontWeight: '700', fontSize: '11px' }}>Date d'intervention inconnue</span>
                                                                    )}
                                                                </div>
                                                                {!patient.date && patient.status === 'intake' && (
                                                                    <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A', fontWeight: '700', fontSize: '11px' }}>Date à renseigner</span>
                                                                )}
                                                                <PatientStatusBadges
                                                                    responses={responses[patient.id] || []}
                                                                    daysUntil={patient.daysUntil}
                                                                    patientStatus={patient.status}
                                                                    intakeData={intakeResponses[patient.id]}
                                                                    lastConsultedAt={patient.last_consulted_at}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="hide-mobile" style={{ padding: 'var(--spacing-3) var(--spacing-4)' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                        {!patient.date && patient.status !== 'intake' && (
                                                            <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--color-success-50)', color: 'var(--color-success-600)', border: '1px solid var(--color-success-200)', fontWeight: '700', fontSize: '11px' }}>À jour ✓</span>
                                                        )}
                                                        {!patient.date && patient.status !== 'intake' && patient.stay_type !== 'Consultation' && (
                                                            <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--color-danger-50)', color: 'var(--color-danger-600)', border: '1px solid var(--color-danger-100)', fontWeight: '700', fontSize: '11px' }}>Date d'intervention inconnue</span>
                                                        )}
                                                    </div>
                                                    {!patient.date && patient.status === 'intake' && (
                                                        <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A', fontWeight: '700', fontSize: '11px' }}>Date à renseigner</span>
                                                    )}
                                                    <PatientStatusBadges
                                                        responses={responses[patient.id] || responses[String(patient.id)] || responses[(patient.name || '').trim().toLowerCase()] || []}
                                                        daysUntil={patient.daysUntil}
                                                        patientStatus={patient.status}
                                                        intakeData={intakeResponses[patient.id] || intakeResponses[String(patient.id)] || intakeResponses[(patient.name || '').trim().toLowerCase()]}
                                                        lastConsultedAt={patient.last_consulted_at}
                                                    />
                                                </div>
                                            </td>
                                            <td className="hide-tablet" style={{ padding: 'var(--spacing-3) var(--spacing-4)' }}>
                                                <span
                                                    className={
                                                        patient.daysUntil === 'J-1' ? 'deadline-red' :
                                                            patient.daysUntil === 'J-7' || patient.daysUntil === 'J-18' ? 'deadline-green' :
                                                                (patient.daysUntil || '').includes('J+') ? 'deadline-orange' : 'deadline-green'
                                                    }
                                                    style={{ fontSize: '11px', fontWeight: '700' }}
                                                >
                                                    {patient.daysUntil}
                                                </span>
                                            </td>
                                            <td className="hide-mobile" style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontSize: '11px', color: 'var(--color-gray-500)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
                                                    <Clock size={12} />
                                                    {patient.daysUntil === 'J-0' ? t('Intervention du jour') : t('Consulté')}
                                                </div>
                                            </td>
                                            {!selectedPatientId && (
                                                <>
                                                    <td className="hide-tablet" style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontSize: '11px', color: 'var(--color-gray-600)' }}>
                                                        {patient.formattedDate}
                                                    </td>
                                                    <td style={{ padding: 'var(--spacing-3) var(--spacing-4)' }}>
                                                        {selectedPatientId === patient.id ? (
                                                            <div style={{ width: '24px', height: '24px' }}></div>
                                                        ) : (
                                                            getStatusBadge(patient.status)
                                                        )}
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
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={loadDashboard}
                />
                <HMScannerModal
                    isOpen={isHMScannerOpen}
                    onClose={() => setIsHMScannerOpen(false)}
                    onSuccess={loadDashboard}
                />
                <SMSAlarmsModal
                    isOpen={isAlarmsModalOpen}
                    onClose={() => setIsAlarmsModalOpen(false)}
                    onSuccess={loadDashboard}
                />
                <QuestionsPreviewModal
                    isOpen={isQuestionsPreviewOpen}
                    onClose={() => setIsQuestionsPreviewOpen(false)}
                />
                <NewIntakeModal
                    isOpen={isIntakeModalOpen}
                    onClose={() => setIsIntakeModalOpen(false)}
                    onSuccess={() => { setIsIntakeModalOpen(false); loadDashboard(); }}
                />

            </main>
        </div>
    );
}
