import { useState, useEffect } from 'react';
import wppPhone from '../assets/wpp-phone.png';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import {
    Phone,
    Clock,
    Ban,
    TrendingUp,
    AlertCircle,
    RefreshCw,
    Activity,
    Users,
    ChevronRight,
    Search
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const nonConformityData = [
    { label: 'Utilisation Rasoir (Interdit)', count: 1, color: 'var(--color-danger-500)', width: '100%' },
    { label: 'Absence Accompagnant (Ambu)', count: 1, color: 'var(--color-warning-500)', width: '85%' },
    { label: 'Dossier Incomplet (Admin)', count: 1, color: 'var(--color-primary-500)', width: '70%' },
    { label: 'Non-respect du Jeûne', count: 0, color: 'var(--color-gray-300)', width: '0%' },
];

export default function Rentabilite() {
    const [isLoading, setIsLoading] = useState(true);
    const [clinicalData, setClinicalData] = useState({
        painDistribution: [
            { label: 'Faible (0-2)', count: 0, color: '#22c55e' },
            { label: 'Modérée (3-6)', count: 0, color: '#f59e0b' },
            { label: 'Intense (7-10)', count: 0, color: '#ef4444' }
        ],
        engagementTrend: [],
        completionRates: [
            { label: 'J-7', rate: 0 },
            { label: 'J-2', rate: 0 },
            { label: 'J-1', rate: 0 },
            { label: 'J+1', rate: 0 },
            { label: 'J+4', rate: 0 }
        ]
    });

    useEffect(() => {
        loadClinicalStats();
    }, []);

    const loadClinicalStats = async () => {
        setIsLoading(true);
        try {
            // 1. Pain Distribution (from latest responses)
            const { data: painResponses } = await supabase
                .from('pathway_responses')
                .select('response_value')
                .eq('item_id', 'pain_level');

            const painCounts = [0, 0, 0];
            (painResponses || []).forEach(r => {
                const val = parseInt(r.response_value);
                if (val <= 2) painCounts[0]++;
                else if (val <= 6) painCounts[1]++;
                else painCounts[2]++;
            });

            // 2. Completion Rates (Mocked logic for demo, could be complex query)
            const milestones = ['J-7', 'J-2', 'J-1', 'J+1', 'J+4'];
            const completions = await Promise.all(milestones.map(async (m) => {
                const { count } = await supabase
                    .from('pathway_responses')
                    .select('*', { count: 'exact', head: true })
                    .eq('milestone', m);
                return { label: m, rate: Math.min(100, (count || 0) * 10) }; // Simplified scaling
            }));

            // 3. Engagement Trend (Last 7 days)
            const trend = Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (6 - i));
                return {
                    day: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
                    value: Math.floor(Math.random() * 20) + 10 // Real data would query portal_logs
                };
            });

            setClinicalData({
                painDistribution: [
                    { label: 'Faible (0-2)', count: painCounts[0], color: '#22c55e' },
                    { label: 'Modérée (3-6)', count: painCounts[1], color: '#f59e0b' },
                    { label: 'Intense (7-10)', count: painCounts[2], color: '#ef4444' }
                ],
                engagementTrend: trend,
                completionRates: completions
            });
        } catch (err) {
            console.error('Error fetching clinical stats:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <main className="main-content">
                <Header
                    title="Rentabilité"
                />

                {/* Title Section */}
                <div style={{ marginBottom: 'var(--spacing-5)' }}>
                    <h2 style={{ fontSize: '20px' }}>Tableau de Bord de Rentabilité (ROI)</h2>
                </div>

                {/* Stats Cards */}
                <div className="grid-3" style={{ marginBottom: 'var(--spacing-5)' }}>
                    <div className="stat-card" style={{ cursor: 'pointer', padding: 'var(--spacing-4)' }} onClick={() => alert('Détails des appels économisés bientôt disponibles')}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
                            <div className="stat-card-icon" style={{ background: 'var(--color-primary-50)', padding: '6px' }}>
                                <Phone size={20} style={{ color: 'var(--color-primary-500)' }} />
                            </div>
                            <span className="badge badge-success" style={{ fontSize: '10px' }}>+25%</span>
                        </div>
                        <div className="stat-card-value" style={{ fontSize: '24px' }}>2</div>
                        <div className="stat-card-label" style={{ fontSize: '13px' }}>Appels économisés</div>
                        <div className="stat-card-meta" style={{ fontSize: '11px' }}>~ 20 min gagnées (11€)</div>
                    </div>

                    <div className="stat-card" style={{ cursor: 'pointer', padding: 'var(--spacing-4)' }} onClick={() => alert('Détails des annulations évitées bientôt disponibles')}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
                            <div className="stat-card-icon" style={{ background: 'var(--color-warning-50)', padding: '6px' }}>
                                <Ban size={20} style={{ color: 'var(--color-warning-500)' }} />
                            </div>
                            <span className="badge badge-danger" style={{ fontSize: '10px' }}>Priorité</span>
                        </div>
                        <div className="stat-card-value" style={{ fontSize: '24px' }}>2</div>
                        <div className="stat-card-label" style={{ fontSize: '13px' }}>Annulations évitées</div>
                        <div className="stat-card-meta" style={{ color: 'var(--color-success-500)', fontSize: '11px' }}>Économie : 3000€</div>
                    </div>

                    <div className="stat-card" style={{ padding: 'var(--spacing-4)' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
                            <div className="stat-card-icon" style={{ background: 'var(--color-success-50)', padding: '6px' }}>
                                <TrendingUp size={20} style={{ color: 'var(--color-success-500)' }} />
                            </div>
                        </div>
                        <div className="stat-card-value" style={{ color: 'var(--color-success-600)', fontSize: '24px' }}>3 011€</div>
                        <div className="stat-card-label" style={{ fontSize: '13px' }}>Gain total (semaine)</div>
                        <div className="stat-card-meta" style={{ fontSize: '11px' }}>↗ ROI : 4.5x</div>
                    </div>
                </div>

                {/* Clinical Section */}
                <div style={{ marginBottom: 'var(--spacing-5)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-3)' }}>
                        <Activity size={18} style={{ color: 'var(--color-primary-500)' }} />
                        <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Suivi Clinique (Temps Réel)</h3>
                    </div>

                    <div className="grid-3">
                        {/* Pain Distribution */}
                        <div className="card" style={{ padding: 'var(--spacing-4)' }}>
                            <h4 style={{ fontSize: '13px', color: 'var(--color-gray-500)', marginBottom: 'var(--spacing-4)' }}>Distribution de la Douleur</h4>
                            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '110px', paddingBottom: 'var(--spacing-3)', borderBottom: '1px solid var(--color-gray-100)' }}>
                                {clinicalData.painDistribution.map((bar, i) => (
                                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-2)', width: '30%' }}>
                                        <div
                                            style={{
                                                width: '100%',
                                                height: `${Math.max(10, (bar.count / Math.max(1, Math.max(...clinicalData.painDistribution.map(b => b.count)))) * 100)}px`,
                                                background: bar.color,
                                                borderRadius: '6px 6px 0 0',
                                                transition: 'height 1s ease'
                                            }}
                                        />
                                        <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--color-gray-600)', textAlign: 'center' }}>{bar.count}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 'var(--spacing-3)' }}>
                                {clinicalData.painDistribution.map((bar, i) => (
                                    <span key={i} style={{ fontSize: '9px', fontWeight: '600', color: 'var(--color-gray-400)', textTransform: 'uppercase' }}>
                                        {bar.label.split(' ')[0]}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Engagement Trend */}
                        <div className="card" style={{ padding: 'var(--spacing-4)' }}>
                            <h4 style={{ fontSize: '13px', color: 'var(--color-gray-500)', marginBottom: 'var(--spacing-4)' }}>Engagement au Portail (7j)</h4>
                            <div style={{ position: 'relative', height: '110px' }}>
                                <svg width="100%" height="100%" viewBox="0 0 200 100" preserveAspectRatio="none">
                                    <path
                                        d={`M 0 100 ${clinicalData.engagementTrend.map((p, i) => `L ${(i * 200) / 6} ${100 - (p.value / 40) * 100}`).join(' ')} L 200 100 Z`}
                                        fill="url(#gradient-engagement)"
                                        opacity="0.2"
                                    />
                                    <path
                                        d={clinicalData.engagementTrend.map((p, i) => (i === 0 ? `M 0 ${100 - (p.value / 40) * 100}` : `L ${(i * 200) / 6} ${100 - (p.value / 40) * 100}`)).join(' ')}
                                        fill="none"
                                        stroke="var(--color-primary-500)"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <defs>
                                        <linearGradient id="gradient-engagement" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="var(--color-primary-500)" />
                                            <stop offset="100%" stopColor="white" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--spacing-3)' }}>
                                {clinicalData.engagementTrend.map((p, i) => (
                                    <span key={i} style={{ fontSize: '9px', fontWeight: '600', color: 'var(--color-gray-400)' }}>{p.day}</span>
                                ))}
                            </div>
                        </div>

                        {/* Completion Rates */}
                        <div className="card" style={{ padding: 'var(--spacing-4)' }}>
                            <h4 style={{ fontSize: '13px', color: 'var(--color-gray-500)', marginBottom: 'var(--spacing-3)' }}>Complétude par Étape</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                                {clinicalData.completionRates.map((item, i) => (
                                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-gray-700)' }}>{item.label}</span>
                                            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--color-primary-600)' }}>{item.rate}%</span>
                                        </div>
                                        <div style={{ height: '6px', background: 'var(--color-gray-100)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ width: `${item.rate}%`, height: '100%', background: 'var(--color-primary-500)', borderRadius: '3px', transition: 'width 1s ease' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-3)' }}>
                    <TrendingUp size={18} style={{ color: 'var(--color-primary-500)' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Impact & ROI</h3>
                </div>
                <div className="grid-2">
                    {/* Non-Conformity Causes */}
                    <div className="card" style={{ padding: 'var(--spacing-4)' }}>
                        <div className="card-header" style={{ marginBottom: 'var(--spacing-2)' }}>
                            <AlertCircle size={18} style={{ color: 'var(--color-gray-500)' }} />
                            <h4 style={{ fontSize: '13px' }}>Non-Conformité (Top 4)</h4>
                        </div>

                        <div className="progress-list">
                            {nonConformityData.map((item, index) => (
                                <div key={index} className="progress-item">
                                    <span className="progress-item-label">{item.label}</span>
                                    <div className="progress-item-bar">
                                        <div
                                            className="progress-fill"
                                            style={{
                                                width: item.width,
                                                background: item.color
                                            }}
                                        />
                                    </div>
                                    <span className="progress-item-count">{item.count} patients</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Digitalization Rate */}
                    <div className="card" style={{ padding: 'var(--spacing-4)' }}>
                        <div className="card-header" style={{ marginBottom: 'var(--spacing-2)' }}>
                            <RefreshCw size={18} style={{ color: 'var(--color-gray-500)' }} />
                            <h4 style={{ fontSize: '13px' }}>Digitalisation</h4>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 'var(--spacing-2)' }}>
                            <div className="circular-progress">
                                <svg width="140" height="140">
                                    {/* Background circle */}
                                    <circle
                                        cx="70"
                                        cy="70"
                                        r="58"
                                        fill="none"
                                        stroke="var(--color-gray-100)"
                                        strokeWidth="10"
                                    />
                                    {/* Progress circle */}
                                    <circle
                                        cx="70"
                                        cy="70"
                                        r="58"
                                        fill="none"
                                        stroke="var(--color-info-500)"
                                        strokeWidth="10"
                                        strokeLinecap="round"
                                        strokeDasharray={2 * Math.PI * 58}
                                        strokeDashoffset={2 * Math.PI * 58 * (1 - 0.85)}
                                        style={{ transition: 'stroke-dashoffset 1s ease' }}
                                    />
                                </svg>
                                <div className="circular-progress-value">
                                    <div className="circular-progress-percent" style={{ fontSize: '24px' }}>85%</div>
                                    <div className="circular-progress-label" style={{ fontSize: '10px' }}>Usage</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
