import React from 'react';
import { Zap } from 'lucide-react';

const statusConfigs = {
    'neutre': {
        color: 'var(--color-gray-400)',
        bg: 'var(--color-gray-50)',
        label: 'En attente',
        description: 'En attente de données'
    },
    'stable': {
        color: 'var(--color-success-500)',
        bg: 'var(--color-success-50)',
        label: 'Vigilance Standard',
        description: 'Tout est normal'
    },
    'alerte': {
        color: 'var(--color-warning-500)',
        bg: 'var(--color-warning-50)',
        label: 'Vigilance Particulière',
        description: 'Attention requise'
    },
    'critique': {
        color: 'var(--color-danger-500)',
        bg: 'var(--color-danger-50)',
        label: 'Vigilance Prioritaire',
        description: 'Action urgente requise'
    },
    'success': {
        color: '#10B981', // Match portal green
        bg: 'var(--color-success-50)',
        label: 'Patient à jour',
        description: 'Protocole respecté'
    },
    'ready': {
        color: 'var(--color-success-600)',
        bg: 'var(--color-success-50)',
        label: 'Prêt',
        description: 'Protocole complété'
    },
    'incomplete': {
        color: '#7C3AED', // Violet (Primary 600)
        bg: '#EFEBE9',
        label: 'En cours',
        description: 'Protocole en cours'
    }
};

export default function StatusBolt({ status = 'neutre', showLabel = false, showDescription = false }) {
    const config = statusConfigs[status] || statusConfigs.neutre;

    return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
            <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: config.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: config.color,
                boxShadow: `0 0 10px ${config.bg}`
            }}>
                <Zap size={14} fill="currentColor" strokeWidth={3} />
            </div>
            {showLabel && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 'var(--font-weight-bold)',
                        color: config.color,
                        textTransform: 'uppercase',
                        letterSpacing: '0.025em'
                    }}>
                        {config.label}
                    </span>
                    {showDescription && (
                        <span style={{ fontSize: '10px', color: 'var(--color-gray-500)' }}>
                            {config.description}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
