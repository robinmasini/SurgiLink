import { Activity } from 'lucide-react';

const statusConfigs = {
    'neutre': { color: '#BDBDBD', bg: '#F5F5F5' },
    'alerte': { color: '#FF9100', bg: '#FFF3E0' },
    'critique': { color: '#FF1744', bg: '#FFEBEE' },
    'ready': { color: '#00C853', bg: '#E8F5E9' },
    'incomplete': { color: '#8D6E63', bg: '#EFEBE9' }
};

export default function ProtocolStatus({ progress = 0, status = 'neutre', statusLabel = "Protocole en cours d'exécution" }) {
    const config = statusConfigs[status] || statusConfigs['neutre'];

    return (
        <div className="card" style={{
            background: 'white',
            borderRadius: '24px',
            padding: 'var(--spacing-6)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            marginTop: 'var(--spacing-4)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-6)' }}>
                <div style={{
                    background: `${config.color}15`,
                    padding: '6px',
                    borderRadius: '8px',
                    color: config.color,
                    display: 'flex'
                }}>
                    <Activity size={16} />
                </div>
                <span style={{ fontWeight: '700', fontSize: '14px', color: '#1A1A1A' }}>État du Protocole</span>
            </div>

            <div style={{ textAlign: 'center' }}>
                <div style={{
                    fontSize: '48px',
                    fontWeight: '800',
                    color: config.color,
                    marginBottom: 'var(--spacing-4)',
                    lineHeight: 1
                }}>
                    {progress}%
                </div>

                {/* Progress Bar Container */}
                <div style={{
                    width: '100%',
                    height: '8px',
                    background: '#F5F5F5',
                    borderRadius: '4px',
                    position: 'relative',
                    marginBottom: 'var(--spacing-6)'
                }}>
                    {/* Progress Fill */}
                    <div style={{
                        width: `${progress}%`,
                        height: '100%',
                        background: config.color,
                        borderRadius: '4px',
                        transition: 'width 0.5s ease-out'
                    }} />
                </div>

                {/* Status Pill */}
                <div style={{
                    display: 'inline-flex',
                    background: config.bg,
                    color: config.color,
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '700'
                }}>
                    {statusLabel}
                </div>
            </div>
        </div>
    );
}
