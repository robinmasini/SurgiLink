import React from 'react';
import { Zap } from 'lucide-react';

const statusConfigs = {
    'neutre': {
        color: 'var(--color-gray-400)',
        bg: 'var(--color-gray-100)',
        label: 'Neutre',
        description: 'En attente de démarrage'
    },
    'alerte': {
        color: 'var(--color-warning-500)',
        bg: 'var(--color-warning-50)',
        label: 'Alerte',
        description: 'Non-réponse Bienvenue/J-7'
    },
    'critique': {
        color: 'var(--color-danger-500)',
        bg: 'var(--color-danger-50)',
        label: 'Critique',
        description: 'Dossier critique / Non-réponses multiples'
    },
    'ready': {
        color: 'var(--color-success-500)',
        bg: 'var(--color-success-50)',
        label: 'Prêt',
        description: 'Protocole complété'
    },
    'incomplete': {
        color: 'var(--color-primary-500)',
        bg: 'var(--color-primary-50)',
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
