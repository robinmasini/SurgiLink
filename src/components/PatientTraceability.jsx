import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatDateFR } from '../utils/dateUtils';
import { History, Activity, MessageSquare, Calendar, Loader } from 'lucide-react';

/**
 * PatientTraceability Component
 * Read-only view of patient intervention history and SMS communications
 * Designed for patient portal consumption
 */
export default function PatientTraceability({ patientId }) {
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('intervention');
    const [traceabilityData, setTraceabilityData] = useState([]);
    const [smsData, setSmsData] = useState([]);

    useEffect(() => {
        loadTraceabilityData();
    }, [patientId, activeCategory]);

    const loadTraceabilityData = async () => {
        setLoading(true);
        try {
            // Load medical history (interventions and SMS notes)
            const { data: historyData, error: historyError } = await supabase
                .from('medical_history')
                .select('*')
                .eq('patient_id', patientId)
                .eq('category', activeCategory)
                .order('date', { ascending: false });

            if (historyError) throw historyError;
            setTraceabilityData(historyData || []);

            // Load SMS logs if category is SMS
            if (activeCategory === 'sms') {
                const { data: smsLogs, error: smsError } = await supabase
                    .from('sms_logs')
                    .select('*')
                    .eq('patient_id', patientId)
                    .order('sent_at', { ascending: false });

                if (!smsError) {
                    setSmsData(smsLogs || []);
                }
            }
        } catch (err) {
            console.error('Error loading traceability data:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'sent': { label: 'Envoyé', class: 'badge-success' },
            'delivered': { label: 'Délivré', class: 'badge-success' },
            'failed': { label: 'Échec', class: 'badge-danger' },
            'pending': { label: 'En attente', class: 'badge-warning' }
        };
        const statusInfo = statusMap[status] || { label: status, class: 'badge-secondary' };
        return <span className={`badge ${statusInfo.class}`}>{statusInfo.label}</span>;
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
                <Loader className="animate-spin" size={48} style={{ margin: '0 auto var(--spacing-4)', color: 'var(--color-primary-500)' }} />
                <p style={{ color: 'var(--color-gray-600)' }}>Chargement...</p>
            </div>
        );
    }

    return (
        <div>
            {/* Category Tabs */}
            <div style={{
                display: 'flex',
                gap: 'var(--spacing-2)',
                marginBottom: 'var(--spacing-6)',
                borderBottom: '2px solid var(--color-gray-100)'
            }}>
                <button
                    onClick={() => setActiveCategory('intervention')}
                    style={{
                        padding: 'var(--spacing-3) var(--spacing-4)',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeCategory === 'intervention' ? '2px solid var(--color-primary-500)' : '2px solid transparent',
                        color: activeCategory === 'intervention' ? 'var(--color-primary-600)' : 'var(--color-gray-500)',
                        fontWeight: activeCategory === 'intervention' ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)',
                        cursor: 'pointer',
                        marginBottom: '-2px',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-2)'
                    }}
                >
                    <Activity size={18} />
                    Interventions
                </button>
                <button
                    onClick={() => setActiveCategory('sms')}
                    style={{
                        padding: 'var(--spacing-3) var(--spacing-4)',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeCategory === 'sms' ? '2px solid var(--color-primary-500)' : '2px solid transparent',
                        color: activeCategory === 'sms' ? 'var(--color-primary-600)' : 'var(--color-gray-500)',
                        fontWeight: activeCategory === 'sms' ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)',
                        cursor: 'pointer',
                        marginBottom: '-2px',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-2)'
                    }}
                >
                    <MessageSquare size={18} />
                    Communications SMS
                </button>
            </div>

            {/* Interventions Timeline */}
            {activeCategory === 'intervention' && (
                <div className="timeline">
                    {traceabilityData.length > 0 ? (
                        traceabilityData.map((item) => (
                            <div key={item.id} className="timeline-item">
                                <div className="timeline-dot"></div>
                                <div className="timeline-content glass-effect">
                                    <div className="timeline-date">
                                        <Calendar size={14} style={{ marginRight: 'var(--spacing-1)' }} />
                                        {formatDateFR(item.date)}
                                    </div>
                                    <div className="timeline-title">{item.title}</div>
                                    {item.description && (
                                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)', marginTop: 'var(--spacing-2)' }}>
                                            {item.description}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--color-gray-400)' }}>
                            <Activity size={48} style={{ marginBottom: 'var(--spacing-4)', opacity: 0.2 }} />
                            <p>Aucune intervention enregistrée pour le moment.</p>
                        </div>
                    )}
                </div>
            )}

            {/* SMS Communications */}
            {activeCategory === 'sms' && (
                <div>
                    {/* Medical History SMS Notes */}
                    {traceabilityData.length > 0 && (
                        <div style={{ marginBottom: 'var(--spacing-6)' }}>
                            <h4 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-4)', color: 'var(--color-gray-700)' }}>
                                Notes de Communication
                            </h4>
                            <div className="timeline">
                                {traceabilityData.map((item) => (
                                    <div key={item.id} className="timeline-item">
                                        <div className="timeline-dot"></div>
                                        <div className="timeline-content glass-effect">
                                            <div className="timeline-date">
                                                <Calendar size={14} style={{ marginRight: 'var(--spacing-1)' }} />
                                                {formatDateFR(item.date)}
                                            </div>
                                            <div className="timeline-title">{item.title}</div>
                                            {item.description && (
                                                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)', marginTop: 'var(--spacing-2)' }}>
                                                    {item.description}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SMS Logs Table */}
                    {smsData.length > 0 && (
                        <div>
                            <h4 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-4)', color: 'var(--color-gray-700)' }}>
                                Historique des SMS
                            </h4>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', fontWeight: 'var(--font-weight-medium)', textTransform: 'uppercase' }}>
                                                Date
                                            </th>
                                            <th style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', fontWeight: 'var(--font-weight-medium)', textTransform: 'uppercase' }}>
                                                Type
                                            </th>
                                            <th style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', fontWeight: 'var(--font-weight-medium)', textTransform: 'uppercase' }}>
                                                Message
                                            </th>
                                            <th style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', fontWeight: 'var(--font-weight-medium)', textTransform: 'uppercase' }}>
                                                Statut
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {smsData.map((sms, index) => (
                                            <tr key={sms.id} style={{ borderBottom: index < smsData.length - 1 ? '1px solid var(--color-gray-200)' : 'none' }}>
                                                <td style={{ padding: 'var(--spacing-3)', fontSize: 'var(--font-size-sm)' }}>
                                                    {new Date(sms.sent_at || sms.created_at).toLocaleDateString('fr-FR')} à {new Date(sms.sent_at || sms.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td style={{ padding: 'var(--spacing-3)', fontSize: 'var(--font-size-sm)' }}>
                                                    {sms.screen || sms.template_key || 'Général'}
                                                </td>
                                                <td style={{ padding: 'var(--spacing-3)', fontSize: 'var(--font-size-sm)', maxWidth: '300px' }}>
                                                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {sms.message}
                                                    </div>
                                                </td>
                                                <td style={{ padding: 'var(--spacing-3)', fontSize: 'var(--font-size-sm)' }}>
                                                    {getStatusBadge(sms.status)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {traceabilityData.length === 0 && smsData.length === 0 && (
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--color-gray-400)' }}>
                            <MessageSquare size={48} style={{ marginBottom: 'var(--spacing-4)', opacity: 0.2 }} />
                            <p>Aucune communication SMS enregistrée pour le moment.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
