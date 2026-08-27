import React from 'react';
import { X } from 'lucide-react';
import CNIUploaderCard from './CNIUploaderCard';

export default function CNIUploaderModal({ isOpen, onClose, patientId, intakeData, onCNIUpdated }) {
    if (!isOpen || !patientId) return null;

    return (
        <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 10000 }}>
            <div
                className="liquid-glass-modal"
                style={{
                    width: '100%',
                    maxWidth: '650px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    position: 'relative'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--spacing-4) var(--spacing-6)',
                    borderBottom: '1px solid rgba(0,0,0,0.05)'
                }}>
                    <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: '700' }}>
                        Gestion de la Pièce d'identité (CNI)
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--color-gray-400)',
                            padding: '4px'
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>

                <div style={{ padding: 'var(--spacing-6)' }}>
                    <CNIUploaderCard
                        patientId={patientId}
                        intakeData={intakeData}
                        onCNIUpdated={(newData) => {
                            if (onCNIUpdated) onCNIUpdated(newData);
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
