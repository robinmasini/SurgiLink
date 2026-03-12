import React from 'react';
import { Zap } from 'lucide-react';

const statusConfigs = {
    'neutre': {
        color: '#BDBDBD',
        bg: '#F5F5F5',
        label: 'Neutre',
        description: 'En attente de démarrage'
    },
    'alerte': {
        color: '#FF9100', // Vibrant Orange
        bg: '#FFF3E0',
        label: 'Alerte',
        description: 'Non-réponse ou retard'
    },
    'critique': {
        color: '#FF1744', // Vibrant Red
        bg: '#FFEBEE',
        label: 'Critique',
        description: 'Dossier critique / Retard important'
    },
    'ready': {
        color: '#00C853', // Deep Green
        bg: '#E8F5E9',
        label: 'Prêt',
        description: 'Protocole complété'
    },
    'incomplete': {
        color: '#8D6E63', // Solid Brown (distinct from orange)
        bg: '#EFEBE9',
        label: 'En cours',
        description: 'Protocole en cours'
    }
};

export default function StatusBolt({ status, size = 20, showLabel = false, className = "" }) {
    const config = statusConfigs[status] || statusConfigs['neutre'];

    return (
        <div
            className={`status-bolt-container ${className}`}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--spacing-2)',
                padding: showLabel ? '4px 12px' : '6px',
                borderRadius: 'var(--radius-full)',
                background: config.bg,
                color: config.color,
                transition: 'all 0.2s ease',
                cursor: 'help'
            }}
            title={`${config.label}: ${config.description}`}
        >
            <Zap
                size={size}
                fill={status === 'neutre' ? 'none' : 'currentColor'}
                strokeWidth={2.5}
            />
            {showLabel && (
                <span style={{
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 'var(--font-weight-bold)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }}>
                    {config.label}
                </span>
            )}
        </div>
    );
}
