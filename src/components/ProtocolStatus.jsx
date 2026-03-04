import { Activity } from 'lucide-react';

export default function ProtocolStatus({ progress = 0, statusLabel = "Protocole en cours d'exécution" }) {
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
                    background: '#E8F5E9',
                    padding: '6px',
                    borderRadius: '8px',
                    color: '#2E7D32',
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
                    color: '#D7C4B0', // Beige color from image
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
                        background: '#D7C4B0',
                        borderRadius: '4px',
                        transition: 'width 0.5s ease-out'
                    }} />
                </div>

                {/* Status Pill */}
                <div style={{
                    display: 'inline-flex',
                    background: '#E8F5E9',
                    color: '#2E7D32',
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
