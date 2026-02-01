import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import {
    Phone,
    Clock,
    Ban,
    TrendingUp,
    AlertCircle,
    RefreshCw
} from 'lucide-react';

const nonConformityData = [
    { label: 'Utilisation Rasoir (Interdit)', count: 1, color: 'var(--color-danger-500)', width: '100%' },
    { label: 'Absence Accompagnant (Ambu)', count: 1, color: 'var(--color-warning-500)', width: '85%' },
    { label: 'Dossier Incomplet (Admin)', count: 1, color: 'var(--color-primary-500)', width: '70%' },
    { label: 'Non-respect du Jeûne', count: 0, color: 'var(--color-gray-300)', width: '0%' },
];

export default function Rentabilite() {
    return (
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <main className="main-content">
                <Header
                    title="Rentabilité"
                />

                {/* Title Section */}
                <div style={{ marginBottom: 'var(--spacing-8)' }}>
                    <h2 style={{ marginBottom: 'var(--spacing-2)' }}>Tableau de Bord de Rentabilité (ROI)</h2>
                    <p>Analyse de l'efficacité opérationnelle et de l'impact financier de SurgiLink.</p>
                </div>

                {/* Stats Cards */}
                <div className="grid-3" style={{ marginBottom: 'var(--spacing-8)' }}>
                    <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => alert('Détails des appels économisés bientôt disponibles')}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--spacing-4)' }}>
                            <div className="stat-card-icon" style={{ background: 'var(--color-primary-50)' }}>
                                <Phone size={24} style={{ color: 'var(--color-primary-500)' }} />
                            </div>
                            <span className="badge badge-success">+25% vs M-1</span>
                        </div>
                        <div className="stat-card-value">2</div>
                        <div className="stat-card-label">Appels infirmiers économisés</div>
                        <div className="stat-card-meta">~ 20 min gagnées (11€)</div>
                    </div>

                    <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => alert('Détails des annulations évitées bientôt disponibles')}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--spacing-4)' }}>
                            <div className="stat-card-icon" style={{ background: 'var(--color-warning-50)' }}>
                                <Ban size={24} style={{ color: 'var(--color-warning-500)' }} />
                            </div>
                            <span className="badge badge-danger">Priorité</span>
                        </div>
                        <div className="stat-card-value">2</div>
                        <div className="stat-card-label">Annulations potentielles évitées</div>
                        <div className="stat-card-meta" style={{ color: 'var(--color-success-500)' }}>Économie estimée : 3000€</div>
                    </div>

                    <div className="stat-card">
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--spacing-4)' }}>
                            <div className="stat-card-icon" style={{ background: 'var(--color-success-50)' }}>
                                <TrendingUp size={24} style={{ color: 'var(--color-success-500)' }} />
                            </div>
                        </div>
                        <div className="stat-card-value" style={{ color: 'var(--color-success-600)' }}>3 011€</div>
                        <div className="stat-card-label">Gain total estimé (semaine)</div>
                        <div className="stat-card-meta">↗ ROI Projet : 4.5x</div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="grid-2">
                    {/* Non-Conformity Causes */}
                    <div className="card">
                        <div className="card-header">
                            <AlertCircle size={20} style={{ color: 'var(--color-gray-500)' }} />
                            <h4>Causes de Non-Conformité (Top 4)</h4>
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
                    <div className="card">
                        <div className="card-header">
                            <RefreshCw size={20} style={{ color: 'var(--color-gray-500)' }} />
                            <h4>Taux de Digitalisation</h4>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 'var(--spacing-4)' }}>
                            <div className="circular-progress">
                                <svg width="180" height="180">
                                    {/* Background circle */}
                                    <circle
                                        cx="90"
                                        cy="90"
                                        r="75"
                                        fill="none"
                                        stroke="var(--color-gray-100)"
                                        strokeWidth="12"
                                    />
                                    {/* Progress circle */}
                                    <circle
                                        cx="90"
                                        cy="90"
                                        r="75"
                                        fill="none"
                                        stroke="var(--color-info-500)"
                                        strokeWidth="12"
                                        strokeLinecap="round"
                                        strokeDasharray={2 * Math.PI * 75}
                                        strokeDashoffset={2 * Math.PI * 75 * (1 - 0.85)}
                                        style={{ transition: 'stroke-dashoffset 1s ease' }}
                                    />
                                </svg>
                                <div className="circular-progress-value">
                                    <div className="circular-progress-percent">85%</div>
                                    <div className="circular-progress-label">Taux d'usage</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
