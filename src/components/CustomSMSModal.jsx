import { useState } from 'react';
import { X, Send, AlertCircle, Loader } from 'lucide-react';

export default function CustomSMSModal({ isOpen, onClose, patient, onSend }) {
    const [message, setMessage] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen) return null;

    const handleSendNow = async () => {
        if (!message.trim()) return;
        setIsProcessing(true);
        try {
            await onSend(message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="liquid-glass-modal" style={{ width: '100%', maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: 'var(--spacing-6)', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                        <div className="card-icon card-icon-primary" style={{ width: '32px', height: '32px' }}>
                            <Send size={18} />
                        </div>
                        <h3 style={{ margin: 0 }}>SMS Personnalisé</h3>
                    </div>
                    <button onClick={onClose} className="btn-secondary" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-gray-400)' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ padding: 'var(--spacing-6)' }}>
                    <div style={{ marginBottom: 'var(--spacing-6)' }}>
                        <div style={{ marginBottom: 'var(--spacing-4)', color: 'var(--color-gray-600)', fontSize: '13px' }}>
                            Envoi à : <strong>{patient?.name}</strong> ({patient?.phone})
                        </div>

                        <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-500)', marginBottom: '8px', textTransform: 'uppercase' }}>
                            Contenu du message
                        </label>
                        <textarea
                            className="input"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Écrivez votre message ici..."
                            autoFocus
                            style={{
                                width: '100%',
                                minHeight: '150px',
                                padding: 'var(--spacing-4)',
                                resize: 'vertical',
                                fontSize: 'var(--font-size-sm)',
                                lineHeight: '1.5',
                                background: 'white'
                            }}
                        />
                        <div style={{ textAlign: 'right', marginTop: '4px', fontSize: '10px', color: 'var(--color-gray-400)' }}>
                            {message.length} caractères • ~{Math.ceil(message.length / 160)} SMS
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                        <button
                            className="btn btn-secondary"
                            style={{ flex: 1 }}
                            onClick={onClose}
                        >
                            Annuler
                        </button>
                        <button
                            className="btn btn-primary"
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-2)' }}
                            onClick={handleSendNow}
                            disabled={isProcessing || !message.trim()}
                        >
                            {isProcessing ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
                            {isProcessing ? 'Envoi...' : 'Envoyer maintenant'}
                        </button>
                    </div>

                    <div style={{ marginTop: 'var(--spacing-4)', padding: 'var(--spacing-3)', background: 'var(--color-primary-50)', borderRadius: 'var(--border-radius-md)', display: 'flex', gap: 'var(--spacing-2)' }}>
                        <AlertCircle size={14} style={{ color: 'var(--color-primary-600)', flexShrink: 0, marginTop: '2px' }} />
                        <p style={{ fontSize: '10px', color: 'var(--color-primary-700)', margin: 0 }}>
                            Ce message sera envoyé immédiatement et enregistré dans l'historique du patient.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
