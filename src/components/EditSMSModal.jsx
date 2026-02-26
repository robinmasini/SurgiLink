import { useState, useEffect } from 'react';
import { X, Send, AlertCircle, Loader } from 'lucide-react';
import { smsTemplates, interpolateTemplate } from '../config/smsTemplates';

export default function EditSMSModal({ isOpen, onClose, patient, nextReminder, onSend }) {
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [previewContent, setPreviewContent] = useState('');

    useEffect(() => {
        if (nextReminder && patient) {
            try {
                // Try to interpolate the template to show as starting point
                const variables = {
                    first_name: patient.name?.split(' ')[0] || 'Patient',
                    procedure_date: patient.date || 'bientôt',
                    arrival_time: patient.surgery_time || '07:30',
                    clinic_name: 'SurgiLink',
                    clinic_phone: '01 44 44 44 44',
                    checklist_link: `https://surgilink.eu/patient-portal/${patient.token || ''}`,
                    consignes_link: `https://surgilink.eu/patient-portal/${patient.token || ''}`
                };
                const interpolated = interpolateTemplate(nextReminder.template_key, variables);
                setMessage(interpolated);
            } catch (err) {
                console.error('Error preparing SMS preview:', err);
                setMessage('');
            }
        }
    }, [nextReminder, patient]);

    if (!isOpen || !nextReminder) return null;

    const handleSend = async () => {
        if (!message.trim()) return;
        setIsSending(true);
        try {
            await onSend(message, nextReminder.id);
        } finally {
            setIsSending(false);
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
                        <h3 style={{ margin: 0 }}>Préparer le rappel {nextReminder.screen}</h3>
                    </div>
                    <button onClick={onClose} className="btn-secondary" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-gray-400)' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ padding: 'var(--spacing-6)' }}>
                    <div style={{ marginBottom: 'var(--spacing-4)' }}>
                        <div style={{ padding: 'var(--spacing-3)', background: 'var(--color-primary-50)', borderRadius: 'var(--border-radius-md)', display: 'flex', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-4)' }}>
                            <AlertCircle size={16} style={{ color: 'var(--color-primary-600)', flexShrink: 0, marginTop: '2px' }} />
                            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-700)', margin: 0 }}>
                                Ce message est basé sur le rappel automatique <strong>{nextReminder.template_key}</strong> prévu pour le {new Date(nextReminder.scheduled_for).toLocaleDateString('fr-FR')}.
                                Son envoi manuel annulera le rappel programmé.
                            </p>
                        </div>

                        <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-500)', marginBottom: '8px', textTransform: 'uppercase' }}>
                            Destinataire : <span style={{ color: 'var(--color-gray-700)' }}>{patient.phone}</span>
                        </label>

                        <div style={{ position: 'relative' }}>
                            <textarea
                                className="input"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                style={{
                                    width: '100%',
                                    minHeight: '150px',
                                    padding: 'var(--spacing-4)',
                                    resize: 'vertical',
                                    fontSize: 'var(--font-size-sm)',
                                    lineHeight: '1.5'
                                }}
                                placeholder="Saisissez votre message..."
                            />
                        </div>
                        <div style={{ textAlign: 'right', marginTop: '4px', fontSize: '10px', color: 'var(--color-gray-400)' }}>
                            {message.length} caractères • ~{Math.ceil(message.length / 160)} SMS
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose} disabled={isSending}>Annuler</button>
                        <button className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-2)' }} onClick={handleSend} disabled={isSending || !message.trim()}>
                            {isSending ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
                            {isSending ? 'Envoi...' : 'Envoyer maintenant'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
