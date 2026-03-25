import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AddPatientModal from '../components/AddPatientModal';
import EditPatientModal from '../components/EditPatientModal';
import {
    Users,
    Search,
    Filter,
    Plus,
    ChevronDown,
    MoreHorizontal,
    Phone,
    Calendar,
    MessageSquare,
    AlertCircle,
    Check
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { calculateDaysUntilSurgery } from '../utils/dateUtils';

export default function Patients() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('Tous');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientsList, setPatientsList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const tabs = ['J-3', 'J-2', 'J-1', 'Interventions du jour', 'J+1', 'J+2', 'J+3', 'Tous', 'Archivés'];

    // Load patients from Supabase
    useEffect(() => {
        loadPatients();
    }, []);

    const loadPatients = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data, error: pError } = await supabase
                .from('patients')
                .select('*')
                .order('date', { ascending: true });

            if (pError) throw pError;

            // Enrich patients with last SMS and risk data
            const enrichedData = await Promise.all((data || []).map(async (patient) => {
                const daysUntil = calculateDaysUntilSurgery(patient.date);

                // Get last SMS
                const { data: smsData } = await supabase
                    .from('sms_logs')
                    .select('sent_at')
                    .eq('patient_id', patient.id)
                    .order('sent_at', { ascending: false })
                    .limit(1);

                // Get risk flags / responses for tags
                const { data: respData } = await supabase
                    .from('pathway_responses')
                    .select('item_id, response_value')
                    .eq('patient_id', patient.id);

                return {
                    ...patient,
                    daysUntil,
                    lastSMS: smsData?.[0]?.sent_at || null,
                    responses: respData || []
                };
            }));

            setPatientsList(enrichedData);
        } catch (err) {
            console.error('Error loading patients:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const getPatientTags = (patient) => {
        const tags = [];
        const resps = patient.responses || [];

        // Logic for tags based on responses (simulated from screenshot)
        const visionFlag = resps.find(r => r.item_id === 'vision_status' && r.response_value === 'degraded');
        if (visionFlag) tags.push({ label: 'Vision dégradée', type: 'danger' });

        const painFlag = resps.find(r => r.item_id === 'pain_level' && parseInt(r.response_value) >= 7);
        if (painFlag) tags.push({ label: 'Douleur déclarée', type: 'warning' });

        const needContact = resps.length > 0 && !resps.find(r => r.item_id === 'contacted');
        if (needContact && tags.length > 0) tags.push({ label: 'À contacter', type: 'info' });

        const noPain = resps.find(r => r.item_id === 'pain_level' && parseInt(r.response_value) <= 2);
        if (noPain) tags.push({ label: 'Pas de douleur', type: 'success' });

        return tags;
    };

    const filteredPatients = patientsList.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.operation.toLowerCase().includes(searchTerm.toLowerCase());

        if (activeTab === 'Tous') return matchesSearch;
        if (activeTab === 'Archivés') return matchesSearch && p.status === 'archived';
        if (activeTab === 'Interventions du jour') return matchesSearch && p.daysUntil === 'J-0';

        return matchesSearch && p.daysUntil === activeTab;
    });

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
            <Sidebar />
            <main style={{ flex: 1, padding: 'var(--spacing-8)', marginLeft: 'var(--sidebar-width)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-8)' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1E293B', marginBottom: '4px' }}>Liste patients</h1>
                        <p style={{ color: '#64748B', fontSize: '14px' }}>Nombre de patient: {patientsList.length}</p>
                    </div>
                    <button
                        className="btn"
                        onClick={() => setIsModalOpen(true)}
                        style={{
                            background: 'var(--color-accent-600)',
                            color: 'white',
                            borderRadius: '12px',
                            padding: '12px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: '600',
                            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)'
                        }}
                    >
                        <Plus size={18} />
                        Ajouter un patient
                    </button>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    gap: 'var(--spacing-2)',
                    marginBottom: 'var(--spacing-6)',
                    borderBottom: '1px solid #E2E8F0',
                    paddingBottom: '2px',
                    overflowX: 'auto'
                }}>
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '12px 20px',
                                fontSize: '14px',
                                fontWeight: activeTab === tab ? '700' : '500',
                                color: activeTab === tab ? 'var(--color-accent-600)' : '#64748B',
                                borderBottom: activeTab === tab ? '3px solid var(--color-accent-600)' : '3px solid transparent',
                                background: 'none',
                                borderTop: 'none',
                                borderLeft: 'none',
                                borderRight: 'none',
                                transition: 'all 0.2s ease',
                                whiteSpace: 'nowrap',
                                cursor: 'pointer'
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div style={{ position: 'relative', marginBottom: 'var(--spacing-6)' }}>
                    <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input
                        type="text"
                        placeholder="Rechercher par nom ou opération..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '14px 14px 14px 48px',
                            borderRadius: '12px',
                            border: '1px solid #E2E8F0',
                            fontSize: '15px',
                            background: 'white',
                            outline: 'none',
                            transition: 'border-color 0.2s',
                        }}
                    />
                </div>

                {/* Table */}
                <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #E2E8F0', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                <th style={{ padding: '16px 20px', fontSize: '13px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>ID <ChevronDown size={14} /></th>
                                <th style={{ padding: '16px 20px', fontSize: '13px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Patient <ChevronDown size={14} /></th>
                                <th style={{ padding: '16px 20px', fontSize: '13px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Suivis actifs <ChevronDown size={14} /></th>
                                <th style={{ padding: '16px 20px', fontSize: '13px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Rendez-vous à venir <ChevronDown size={14} /></th>
                                <th style={{ padding: '16px 20px', fontSize: '13px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Dernier envoi <ChevronDown size={14} /></th>
                                <th style={{ padding: '16px 20px', fontSize: '13px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Retours patient <ChevronDown size={14} /></th>
                                <th style={{ padding: '16px 20px', fontSize: '13px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>Chargement...</td></tr>
                            ) : filteredPatients.length === 0 ? (
                                <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>Aucun patient trouvé.</td></tr>
                            ) : filteredPatients.map((p, idx) => (
                                <tr
                                    key={p.id}
                                    style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer', transition: 'background 0.2s' }}
                                    onClick={() => navigate(`/patient/${p.id}`)}
                                >
                                    <td style={{ padding: '20px', fontSize: '14px', color: '#64748B' }}>{String(idx + 1).padStart(3, '0')}</td>
                                    <td style={{ padding: '20px' }}>
                                        <div style={{ fontWeight: '700', color: '#1E293B', fontSize: '15px' }}>{p.name}</div>
                                        <div style={{ color: '#64748B', fontSize: '13px', marginTop: '4px' }}>{p.phone}</div>
                                    </td>
                                    <td style={{ padding: '20px', fontSize: '14px', color: '#475569' }}>
                                        {p.operation}
                                    </td>
                                    <td style={{ padding: '20px' }}>
                                        <div style={{ fontSize: '14px', color: '#475569' }}>{new Date(p.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                        <div style={{ fontSize: '13px', color: '#94A3B8', marginTop: '4px' }}>{p.surgery_time || '08:00'}</div>
                                        {p.status === 'treated' && (
                                            <div style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                background: '#DCFCE7',
                                                color: '#166534',
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                padding: '2px 8px',
                                                borderRadius: '6px',
                                                marginTop: '6px'
                                            }}>
                                                <Check size={12} /> Traité
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '20px', fontSize: '14px', color: '#475569' }}>
                                        {p.lastSMS ? new Date(p.lastSMS).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                    </td>
                                    <td style={{ padding: '20px' }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {getPatientTags(p).map((tag, i) => (
                                                <span
                                                    key={i}
                                                    style={{
                                                        padding: '4px 10px',
                                                        borderRadius: '8px',
                                                        fontSize: '12px',
                                                        fontWeight: '700',
                                                        background: tag.type === 'danger' ? '#FEE2E2' : tag.type === 'warning' ? '#FFEDD5' : tag.type === 'info' ? '#E0E7FF' : '#DCFCE7',
                                                        color: tag.type === 'danger' ? '#B91C1C' : tag.type === 'warning' ? '#C2410C' : tag.type === 'info' ? '#4338CA' : '#15803D',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px'
                                                    }}
                                                >
                                                    {tag.label} <span style={{ opacity: 0.6 }}>✕</span>
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px' }}>
                                        <button
                                            className="btn"
                                            onClick={(e) => { e.stopPropagation(); navigate(`/patient/${p.id}`); }}
                                            style={{
                                                background: '#334155',
                                                color: 'white',
                                                padding: '8px 16px',
                                                borderRadius: '20px',
                                                fontSize: '13px',
                                                fontWeight: '700',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                border: 'none',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Action <ChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <AddPatientModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onPatientAdded={loadPatients}
                />

                <EditPatientModal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setSelectedPatient(null);
                    }}
                    patient={selectedPatient}
                    onPatientUpdated={loadPatients}
                />
            </main>
        </div>
    );
}
