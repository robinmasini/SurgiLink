import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import wppPhone from '../assets/wpp-phone.png';
import { useNavigate } from 'react-router-dom';
import doctolibLogo from '../assets/doctolib.png';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AddPatientModal from '../components/AddPatientModal';
import NewIntakeModal from '../components/NewIntakeModal';
import {
    Users,
    Search,
    Plus,
    Clock,
    Phone,
    CheckCircle2,
    ClipboardList,
    CalendarOff,
    CalendarClock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { calculateDaysUntilSurgery } from '../utils/dateUtils';
import StatusBolt from '../components/StatusBolt';
import PatientStatusBadges from '../components/PatientStatusBadges';
import PatientDetailPanel from '../components/PatientDetailPanel';
import { consolidateDuplicatePatients, calculateGlobalProgress } from '../services/pathwayService';

export default function Patients() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('Tous');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);
    const [allPatients, setAllPatients] = useState([]);
    const [patients, setPatients] = useState([]);
    const [responses, setResponses] = useState({});
    const [intakeResponses, setIntakeResponses] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPatientId, setSelectedPatientId] = useState(null);
    const [nextReminders, setNextReminders] = useState({});

    const tabs = ['J-18', 'J-7', 'J-1', 'Jour J', 'J+1', 'J+4', 'ESATIS', 'Tous', 'Nouveaux patients', 'Fiches', 'Archivés'];
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 1024);
        };
        window.addEventListener('resize', handleResize);
        loadPatients();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        filterPatients();
    }, [allPatients, activeTab, searchTerm]);

    const filterPatients = () => {
        let filtered = [...allPatients];

        if (activeTab === 'Archivés') {
            filtered = filtered.filter(p => p.status === 'archived');
        } else if (activeTab === 'Fiches') {
            // Patients avec fiche de renseignements en attente (pas encore d'intervention)
            filtered = filtered.filter(p => p.status === 'intake' || (!p.date && p.status !== 'archived'));
        } else if (activeTab === 'Nouveaux patients') {
            filtered = filtered.filter(p => p.status === 'intake');
        } else if (activeTab === 'Tous') {
            filtered = filtered.filter(p => p.status !== 'archived' && p.status !== 'intake');
        } else {
            filtered = filtered.filter(p => p.status !== 'intake').filter(p => {
                const daysUntil = calculateDaysUntilSurgery(p.date);
                let tabDate = activeTab === 'Jour J' ? 'J-0' : activeTab;
                if (activeTab === 'ESATIS') {
                    tabDate = 'J+4';
                }
                return daysUntil === tabDate;
            });
        }

        if (searchTerm) {
            const term = (searchTerm || '').toLowerCase();
            filtered = filtered.filter(p =>
                ((p?.name || '').toLowerCase()).includes(term) ||
                ((p?.operation || '').toLowerCase()).includes(term)
            );
        }

        setPatients(filtered);
    };

    const loadPatients = async () => {
        setIsLoading(true);
        try {
            const { data: rawPatientsData, error: allPatientsError } = await supabase
                .from('patients')
                .select('*')
                .order('date', { ascending: false });

            if (allPatientsError) throw allPatientsError;
            if (!rawPatientsData) return;

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

            // Group by normalized name to deduplicate and keep the most complete/active intervention
            const patientGroups = {};
            (allPatientsData || []).forEach(p => {
                const normName = (p.name || '').trim().toLowerCase();
                if (!normName) return;
                if (!patientGroups[normName]) {
                    patientGroups[normName] = [];
                }
                patientGroups[normName].push(p);
            });

            const uniquePatientsData = Object.values(patientGroups).map(group => {
                if (group.length === 1) return group[0];
                // If multiple records exist for same name, pick the one with a date & operation, or the latest
                const withDate = group.find(p => p.date && p.operation && p.operation !== 'Non renseigné');
                if (withDate) return withDate;
                const withOp = group.find(p => p.operation && p.operation !== 'Non renseigné');
                if (withOp) return withOp;
                return group[0];
            });

            // Sort descending by created_at so newest patients are at the top
            uniquePatientsData.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

            const formattedPatients = uniquePatientsData.map(patient => ({
                ...patient,
                daysUntil: calculateDaysUntilSurgery(patient.date),
                formattedDate: patient.date ? new Date(patient.date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                }) : 'Non définie'
            }));

            setAllPatients(formattedPatients);

            // Consolidate duplicate records in DB in background
            consolidateDuplicatePatients();

            if (formattedPatients.length > 0) {
                // Fetch responses for all patient IDs (including potential duplicates)
                const allIdsToFetch = (allPatientsData || []).map(p => p.id);
                const idToName = {};
                (allPatientsData || []).forEach(p => { idToName[p.id] = (p.name || '').trim().toLowerCase(); });
                const nameToPrimaryId = {};
                formattedPatients.forEach(p => { nameToPrimaryId[(p.name || '').trim().toLowerCase()] = p.id; });

                const [respDataRes, intakeDataRes] = await Promise.all([
                    supabase.from('pathway_responses').select('*').in('patient_id', allIdsToFetch),
                    supabase.from('intake_form_responses').select('patient_id, id_card_recto, cni_in_person').in('patient_id', allIdsToFetch)
                ]);

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

                // Fetch next pending reminders for each patient
                const { data: remindersData, error: remindersError } = await supabase
                    .from('reminder_queue')
                    .select('patient_id, screen, scheduled_for')
                    .in('patient_id', formattedPatients.map(p => p.id))
                    .eq('status', 'pending')
                    .order('scheduled_for', { ascending: true });

                if (!remindersError && remindersData) {
                    const remindersMap = {};
                    remindersData.forEach(r => {
                        if (!remindersMap[r.patient_id]) {
                            remindersMap[r.patient_id] = r;
                        }
                    });
                    setNextReminders(remindersMap);
                }
            }
        } catch (err) {
            console.error('Error loading patients:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectPatient = (patientId) => {
        setSelectedPatientId(patientId);
    };

    const handlePatientAdded = () => {
        loadPatients();
    };

    const getStatusBadge = (status) => {
        return <StatusBolt status={status} showLabel={true} />;
    };

    return (
        <div className="dashboard-layout" data-mobile={isMobile} style={{ minHeight: '100vh', background: 'white' }}>
            <Sidebar />
            <main className="main-content" data-mobile={isMobile}>
                <Header
                    title={t('Liste des patients')}
                    subtitle={t('Total: {{count}} patients au cabinet', { count: allPatients.length })}
                    actions={
                        <>
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
                                    fontWeight: '700',
                                    boxShadow: 'var(--shadow-sm)'
                                }}
                            >
                                <ClipboardList size={16} />
                                <span>Nouveau(elle) patient(e)</span>
                            </button>
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
                                {t('Appeler la Clinique')}
                            </button>
                            <button
                                onClick={() => window.open('https://pro.doctolib.fr/signin', '_blank')}
                                className="hide-mobile"
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
                            >
                                <img src={doctolibLogo} alt="Doctolib" style={{ height: '18px', objectFit: 'contain' }} />
                                <span>{t('Planning')}</span>
                            </button>
                            <button
                                className="btn btn-primary hide-mobile"
                                onClick={() => setIsModalOpen(true)}
                                style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', height: '42px', justifyContent: 'center' }}
                            >
                                <Plus size={18} /> <span>Ajouter une intervention</span>
                            </button>
                        </>
                    }
                    mobileActions={
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setIsIntakeModalOpen(true)}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 'var(--spacing-2)',
                                    borderRadius: '12px',
                                    height: '42px',
                                    fontWeight: '700',
                                    background: 'var(--color-success-50)',
                                    color: 'var(--color-success-600)',
                                    border: '1px solid var(--color-success-200)',
                                    boxShadow: 'var(--shadow-sm)',
                                    fontSize: '13px'
                                }}
                            >
                                <ClipboardList size={16} />
                                Nouveau(elle) patient(e)
                            </button>
                            <button
                                className="btn btn-secondary"
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 'var(--spacing-2)',
                                    borderRadius: '12px',
                                    height: '42px',
                                    fontWeight: '700',
                                    background: 'white',
                                    color: 'var(--color-primary-600)',
                                    border: '1px solid var(--color-primary-100)',
                                    boxShadow: 'var(--shadow-sm)',
                                    fontSize: '13px'
                                }}
                                onClick={() => window.location.href = 'tel:0491550000'}
                            >
                                <Phone size={18} />
                                {t('Appeler la Clinique')}
                            </button>
                            <button
                                onClick={() => window.open('https://pro.doctolib.fr/signin', '_blank')}
                                style={{
                                    width: '100%',
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
                                    boxShadow: 'var(--shadow-sm)',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <img src={doctolibLogo} alt="Doctolib" style={{ height: '18px', objectFit: 'contain' }} />
                                <span>{t('Planning')}</span>
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setIsModalOpen(true)}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 'var(--spacing-2)',
                                    borderRadius: '12px',
                                    height: '42px',
                                    fontWeight: '700',
                                    background: 'white',
                                    color: 'var(--color-primary-600)',
                                    border: '1px solid var(--color-primary-100)',
                                    boxShadow: 'var(--shadow-sm)',
                                }}
                            >
                                <Plus size={18} /> {t('Ajouter une intervention')}
                            </button>
                        </div>
                    }
                />

                {/* Sub Header / Search & Tabs */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
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


                </div>

                <div className="dashboard-content-split" style={{
                    display: 'grid',
                    gridTemplateColumns: selectedPatientId ? '1fr 380px' : '1fr',
                    gap: 'var(--spacing-6)',
                    alignItems: 'start',
                    transition: 'all 0.3s'
                }}>
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: 'var(--spacing-4)', borderBottom: '1px solid var(--color-gray-100)', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
                            <h3 style={{ fontSize: 'var(--font-size-lg)', margin: 0 }}>{t('Patients')} ({patients.length})</h3>
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
                                Filtre : plus récent
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--color-gray-100)', background: 'var(--color-gray-50)' }}>
                                        <th style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: '11px', color: 'var(--color-gray-500)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('Patient')}</th>
                                        <th className="hide-mobile" style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: '11px', color: 'var(--color-gray-500)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('Retours patient')}</th>
                                        <th className="hide-tablet" style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: '11px', color: 'var(--color-gray-500)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('Étape')}</th>
                                        <th className="hide-mobile" style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: '11px', color: 'var(--color-gray-500)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('Planification SMS')}</th>
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
                                                {t('Aucun patient trouvé.')}
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
                                                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                             <div style={{ fontWeight: '600', color: 'var(--color-gray-900)' }}>{patient.name}</div>
                                                             {patient.status === 'intake' && (
                                                                  <>
                                                                      {/* Pill verte : fiche en cours */}
                                                                      <div style={{
                                                                          display: 'inline-flex', alignItems: 'center', gap: '3px',
                                                                          color: 'var(--color-primary-600)', fontWeight: '700', fontSize: '9px',
                                                                          background: 'var(--color-primary-50)', padding: '2px 7px',
                                                                          borderRadius: '5px', border: '1px solid var(--color-primary-200)',
                                                                          lineHeight: '1', whiteSpace: 'nowrap'
                                                                      }}>
                                                                          <ClipboardList size={9} />
                                                                          Fiche en cours
                                                                      </div>
                                                                      {/* Pill orange : date à renseigner */}
                                                                      <div style={{
                                                                          display: 'inline-flex', alignItems: 'center', gap: '3px',
                                                                          color: '#D97706', fontWeight: '700', fontSize: '9px',
                                                                          background: '#FEF3C7', padding: '2px 7px',
                                                                          borderRadius: '5px', border: '1px solid #FDE68A',
                                                                          lineHeight: '1', whiteSpace: 'nowrap'
                                                                      }}>
                                                                          <CalendarClock size={9} />
                                                                          Date à renseigner
                                                                      </div>
                                                                  </>
                                                              )}
                                                             {(patient.last_consulted_at || (responses[patient.id] && responses[patient.id].length > 0)) && patient.status !== 'intake' && (
                                                                  <div style={{
                                                                      display: 'inline-flex',
                                                                      alignItems: 'center',
                                                                      gap: '2px',
                                                                      color: 'var(--color-success-600)',
                                                                      fontWeight: '700',
                                                                      fontSize: '9px',
                                                                      background: 'var(--color-success-50)',
                                                                      padding: '2px 6px',
                                                                      borderRadius: '4px',
                                                                      border: '1px solid var(--color-success-100)',
                                                                      lineHeight: '1',
                                                                      whiteSpace: 'nowrap'
                                                                  }}>
                                                                      <CheckCircle2 size={10} />
                                                                      {t('Tuto OK')}
                                                                  </div>
                                                              )}
                                                             {!patient.date && patient.status !== 'intake' && (
                                                                 <div style={{
                                                                     display: 'inline-flex',
                                                                     alignItems: 'center',
                                                                     gap: '3px',
                                                                     color: 'var(--color-success-600)',
                                                                     fontWeight: '700',
                                                                     fontSize: '9px',
                                                                     background: 'var(--color-success-50)',
                                                                     padding: '2px 7px',
                                                                     borderRadius: '5px',
                                                                     border: '1px solid var(--color-success-100)',
                                                                     lineHeight: '1',
                                                                     whiteSpace: 'nowrap'
                                                                 }}>
                                                                     <CheckCircle2 size={9} />
                                                                     À jour
                                                                 </div>
                                                             )}
                                                             {!patient.date && patient.status !== 'intake' && patient.stay_type !== 'Consultation' && (
                                                                 <div style={{
                                                                     display: 'inline-flex',
                                                                     alignItems: 'center',
                                                                     gap: '3px',
                                                                     color: 'var(--color-danger-600)',
                                                                     fontWeight: '700',
                                                                     fontSize: '9px',
                                                                     background: 'var(--color-danger-50)',
                                                                     padding: '2px 7px',
                                                                     borderRadius: '5px',
                                                                     border: '1px solid var(--color-danger-100)',
                                                                     lineHeight: '1',
                                                                     whiteSpace: 'nowrap'
                                                                 }}>
                                                                     <CalendarOff size={9} />
                                                                     Date d'intervention inconnue
                                                                 </div>
                                                             )}
                                                         </div>
                                                         <div style={{ fontSize: '11px', color: patient.status === 'intake' ? '#9CA3AF' : 'var(--color-gray-500)' }}>
                                                             {patient.status === 'intake' ? '—' : patient.operation}
                                                             {isMobile && (
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start', marginTop: '8px' }}>
                                                                    {!patient.date && patient.status === 'intake' && (
                                                                        <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A', fontWeight: '700', fontSize: '11px' }}>Date à renseigner</span>
                                                                    )}
                                                                    <PatientStatusBadges
                                                                        responses={responses[patient.id] || responses[String(patient.id)] || responses[(patient.name || '').trim().toLowerCase()] || []}
                                                                        daysUntil={patient.date ? patient.daysUntil : ''}
                                                                        hasDate={!!patient.date}
                                                                        patientStatus={patient.status}
                                                                        intakeData={intakeResponses[patient.id] || intakeResponses[String(patient.id)] || intakeResponses[(patient.name || '').trim().toLowerCase()]}
                                                                        lastConsultedAt={patient.last_consulted_at}
                                                                    />
                                                                </div>
                                                            )}
                                                         </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="hide-mobile" style={{ padding: 'var(--spacing-3) var(--spacing-4)' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                        {!patient.date && patient.status !== 'intake' && (
                                                            <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--color-danger-50)', color: 'var(--color-danger-600)', border: '1px solid var(--color-danger-100)', fontWeight: '700', fontSize: '11px' }}>Date d'intervention inconnue</span>
                                                        )}
                                                    </div>
                                                    {!patient.date && patient.status === 'intake' && (
                                                        <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A', fontWeight: '700', fontSize: '11px' }}>Date à renseigner</span>
                                                    )}
                                                    <PatientStatusBadges
                                                        responses={responses[patient.id] || responses[String(patient.id)] || responses[(patient.name || '').trim().toLowerCase()] || []}
                                                        daysUntil={patient.date ? patient.daysUntil : ''}
                                                        hasDate={!!patient.date}
                                                        patientStatus={patient.status}
                                                        intakeData={intakeResponses[patient.id] || intakeResponses[String(patient.id)] || intakeResponses[(patient.name || '').trim().toLowerCase()]}
                                                        lastConsultedAt={patient.last_consulted_at}
                                                    />
                                                </div>
                                            </td>
                                            <td className="hide-tablet" style={{ padding: 'var(--spacing-3) var(--spacing-4)' }}>
                                                <span
                                                    className={
                                                        !patient.date ? '' :
                                                        patient.daysUntil === 'J-1' ? 'deadline-red' :
                                                            patient.daysUntil === 'J-7' || patient.daysUntil === 'J-18' ? 'deadline-green' :
                                                                 (patient.daysUntil || '').includes('J+') ? 'deadline-orange' : 'deadline-green'
                                                    }
                                                    style={{ fontSize: '11px', fontWeight: '700' }}
                                                >
                                                    {patient.date ? patient.daysUntil : '—'}
                                                </span>
                                            </td>
                                            <td className="hide-mobile" style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontSize: '11px', color: 'var(--color-gray-500)' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    {nextReminders[patient.id] ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary-700)', fontWeight: '600' }}>
                                                                <Clock size={12} />
                                                                <span>{nextReminders[patient.id].screen}</span>
                                                            </div>
                                                            <div style={{ fontSize: '10px', color: 'var(--color-gray-600)' }}>
                                                                {new Date(nextReminders[patient.id].scheduled_for).toLocaleDateString('fr-FR', {
                                                                    day: 'numeric',
                                                                    month: 'short'
                                                                })} à {new Date(nextReminders[patient.id].scheduled_for).toLocaleTimeString('fr-FR', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-gray-400)' }}>
                                                            <CheckCircle2 size={12} />
                                                            <span>Aucun rappel à venir</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            {!selectedPatientId && (
                                                <>
                                                     <td className="hide-tablet" style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontSize: '11px', color: patient.status === 'intake' ? '#D97706' : 'var(--color-gray-600)' }}>
                                                         {patient.status === 'intake' ? (
                                                             <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#D97706', fontWeight: '700',
                                                                 background: '#FEF3C7', padding: '3px 8px', borderRadius: '6px', border: '1px solid #FDE68A' }}>
                                                                 <CalendarClock size={11} /> Date à renseigner
                                                             </span>
                                                         ) : patient.formattedDate}
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
                <NewIntakeModal
                    isOpen={isIntakeModalOpen}
                    onClose={() => setIsIntakeModalOpen(false)}
                    onSuccess={() => { setIsIntakeModalOpen(false); loadPatients(); }}
                />
            </main>
        </div>
    );
}
