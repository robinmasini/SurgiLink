import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AddPatientModal from '../components/AddPatientModal';
import {
    Users,
    Search,
    Plus,
    Clock,
    Phone,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { calculateDaysUntilSurgery } from '../utils/dateUtils';
import StatusBolt from '../components/StatusBolt';
import PatientStatusBadges from '../components/PatientStatusBadges';
import PatientDetailPanel from '../components/PatientDetailPanel';

export default function Patients() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('Tous');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [allPatients, setAllPatients] = useState([]);
    const [patients, setPatients] = useState([]);
    const [responses, setResponses] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPatientId, setSelectedPatientId] = useState(null);

    const tabs = ['J-10', 'J-7', 'J-2', 'J-1', 'Jour J', 'J+1', 'J+4', 'Tous', 'Archivés'];

    useEffect(() => {
        loadPatients();
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
                const tabDate = activeTab === 'Jour J' ? 'J-0' : activeTab;
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
            }
        } catch (err) {
            console.error('Error loading patients:', err);
        } finally {
            setIsLoading(false);
        }
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
            <main style={{ flex: 1, padding: 'var(--spacing-8)', marginLeft: 'var(--sidebar-width)' }}>
                <Header
                    title="Liste des patients"
                    subtitle={`Total: ${allPatients.length} patients au cabinet`}
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

                    <div style={{ display: 'flex', gap: 'var(--spacing-3)', flex: 1, minWidth: '300px', justifyContent: 'flex-end' }}>
                        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)' }} />
                            <input
                                type="text"
                                placeholder="Rechercher un patient..."
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
                            style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}
                        >
                            <Plus size={18} /> Ajouter un patient
                        </button>
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
                        <div style={{ padding: 'var(--spacing-4)', borderBottom: '1px solid var(--color-gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: 'var(--font-size-lg)' }}>Patients ({patients.length})</h3>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--color-gray-100)', background: 'var(--color-gray-50)' }}>
                                        <th style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: '11px', color: 'var(--color-gray-500)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Patient</th>
                                        <th style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: '11px', color: 'var(--color-gray-500)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Retours patient</th>
                                        <th className="hide-tablet" style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: '11px', color: 'var(--color-gray-500)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Étape</th>
                                        <th className="hide-mobile" style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: '11px', color: 'var(--color-gray-500)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SMS envoyé</th>
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
                                                Aucun patient trouvé.
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
