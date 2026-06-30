import { useState, useEffect } from 'react';
import wppPhone from '../assets/wpp-phone.png';
import { useNavigate } from 'react-router-dom';
import doctolibLogo from '../assets/doctolib.png';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AddPatientModal from '../components/AddPatientModal';
import {
    Users,
    Search,
    Plus,
    Clock,
    Phone,
    CheckCircle2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { calculateDaysUntilSurgery } from '../utils/dateUtils';
import StatusBolt from '../components/StatusBolt';
import PatientStatusBadges from '../components/PatientStatusBadges';
import PatientDetailPanel from '../components/PatientDetailPanel';
import { useTranslation } from 'react-i18next';

export default function Patients() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('Tous');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [allPatients, setAllPatients] = useState([]);
    const [patients, setPatients] = useState([]);
    const [responses, setResponses] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPatientId, setSelectedPatientId] = useState(null);
    const [nextReminders, setNextReminders] = useState({});

    const tabs = ['J-18', 'J-7', 'J-1', 'Jour J', 'J+1', 'J+4', 'ESATIS', 'Tous', 'Archivés'];
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
        } else if (activeTab === 'Tous') {
            filtered = filtered.filter(p => p.status !== 'archived');
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

        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.operation.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setPatients(filtered);
    };

    const loadPatients = async () => {
        setIsLoading(true);
        try {
            const { data: allPatientsData, error: allPatientsError } = await supabase
                .from('patients')
                .select('*')
                .order('date', { ascending: true });

            if (allPatientsError) throw allPatientsError;

            const formattedPatients = allPatientsData.map(patient => ({
                ...patient,
                daysUntil: calculateDaysUntilSurgery(patient.date),
                formattedDate: patient.date ? new Date(patient.date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                }) : 'Non définie'
            }));

            setAllPatients(formattedPatients);

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
        <div style={{ display: 'flex', minHeight: '100vh', background: 'white' }}>
            <Sidebar />
            <main className="main-content">
                <Header
                    title={t('Liste des patients')}
                    subtitle={t('Total: {{count}} patients au cabinet', { count: allPatients.length })}
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
                            {t('Appeler la Clinique')}
                        </button>
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

                    {!isMobile ? (
                        <div style={{ display: 'flex', gap: 'var(--spacing-3)', flex: 1, minWidth: '300px', justifyContent: 'flex-end' }}>
                            <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
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
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center' }}>
                                <button
                                    onClick={() => window.open('https://www.doctolib.fr', '_blank')}
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
                                    <span className="hide-mobile">{t('Planning')}</span>
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setIsModalOpen(true)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', height: '42px', justifyContent: 'center' }}
                                >
                                    <Plus size={18} /> <span className="hide-mobile">{t('Ajouter un patient')}</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                            <div style={{ position: 'relative', width: '100%' }}>
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
                            <button
                                className="btn btn-primary"
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
                                    boxShadow: 'var(--shadow-sm)'
                                }}
                            >
                                <Plus size={18} /> {t('Ajouter un patient')}
                            </button>
                            <button
                                onClick={() => window.open('https://www.doctolib.fr', '_blank')}
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
                        </div>
                    )}
                </div>

                <div className="dashboard-content-split" style={{
                    display: 'grid',
                    gridTemplateColumns: selectedPatientId ? '1fr 380px' : '1fr',
                    gap: 'var(--spacing-6)',
                    alignItems: 'start',
                    transition: 'all 0.3s'
                }}>
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: 'var(--spacing-4)', borderBottom: '1px solid var(--color-gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: 'var(--font-size-lg)' }}>{t('Patients')} ({patients.length})</h3>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--color-gray-100)', background: 'var(--color-gray-50)' }}>
                                        <th style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: '11px', color: 'var(--color-gray-500)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('Patient')}</th>
                                        <th style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: '11px', color: 'var(--color-gray-500)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('Retours patient')}</th>
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
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <div style={{ fontWeight: '600', color: 'var(--color-gray-900)' }}>{patient.name}</div>
                                                            {patient.onboarding_completed_at && (
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
                                                        </div>
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
                                                        patient.daysUntil === 'J-1' ? 'deadline-red' :
                                                            patient.daysUntil === 'J-7' || patient.daysUntil === 'J-18' ? 'deadline-green' :
                                                                patient.daysUntil.includes('J+') ? 'deadline-orange' : 'deadline-green'
                                                    }
                                                    style={{ fontSize: '11px', fontWeight: '700' }}
                                                >
                                                    {patient.daysUntil}
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
