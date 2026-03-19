import { useState, useEffect } from 'react';
import { X, Send, AlertCircle, Loader, Calendar, Clock, Save } from 'lucide-react';
import { smsTemplates, interpolateTemplate } from '../config/smsTemplates';

export default function EditSMSModal({ isOpen, onClose, patient, reminder, onSend, onUpdate }) {
    const [message, setMessage] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (reminder && patient) {
            // Initial message: use custom if exists, otherwise interpolate template
            if (reminder.custom_message) {
                setMessage(reminder.custom_message);
            } else {
                try {
                    const getScreenPath = (screen) => {
                        const mapping = {
                            'J-7': 'j7',
                            'J-2': 'j2',
                            'J-1': 'j1-preop',
                            'J+1': 'j1',
                            'J+4': 'j4',
                            'E-SATIS': 'j4',
                            'Bienvenue': ''
                        };
                        return mapping[screen] || '';
                    };

                    const screenPath = getScreenPath(reminder.screen);
                    const baseUrl = `https://surgilink.eu/patient-portal/${patient.token || ''}`;
                    const directLink = screenPath ? `${baseUrl}/${screenPath}` : baseUrl;

                    const variables = {
                        first_name: patient.name?.split(' ')[0] || 'Patient',
                        procedure_date: patient.date || 'bientôt',
                        arrival_time: patient.surgery_time || '07:30',
                        clinic_name: 'SurgiLink',
                        clinic_phone: '01 44 44 44 44',
                        checklist_link: directLink,
                        consignes_link: directLink,
                        esatis_link: directLink,
                        item_name: reminder.item_id ? reminder.item_id.replace(/_/g, ' ') : ''
                    };
                    const interpolated = interpolateTemplate(reminder.template_key, variables);
                    setMessage(interpolated);
                } catch (err) {
                    console.error('Error preparing SMS preview:', err);
                    setMessage('');
                }
            }

            // Initial date/time
            const dateObj = new Date(reminder.scheduled_for);
            setScheduledDate(dateObj.toISOString().split('T')[0]);
            setScheduledTime(dateObj.toTimeString().substring(0, 5));
        }
    }, [reminder, patient]);

    if (!isOpen || !reminder) return null;

    const handleSendNow = async () => {
        if (!message.trim()) return;
        setIsProcessing(true);
        try {
            await onSend(message, reminder.id);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSaveSchedule = async () => {
        if (!message.trim() || !scheduledDate || !scheduledTime) return;
        setIsProcessing(true);
        try {
            const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}:00`);
            await onUpdate(reminder.id, {
                customMessage: message,
                scheduledFor: scheduledFor.toISOString()
            });
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
                            <Calendar size={18} />
                        </div>
                        <h3 style={{ margin: 0 }}>Gérer le rappel {reminder.screen}</h3>
                    </div>
                    <button onClick={onClose} className="btn-secondary" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-gray-400)' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ padding: 'var(--spacing-6)' }}>
                    <div style={{ marginBottom: 'var(--spacing-6)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-500)', marginBottom: '8px', textTransform: 'uppercase' }}>
                                    Date d'envoi
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="date"
                                        className="input"
                                        value={scheduledDate}
                                        onChange={(e) => setScheduledDate(e.target.value)}
                                        style={{ width: '100%', paddingLeft: '32px' }}
                                    />
                                    <Calendar size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)' }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-500)', marginBottom: '8px', textTransform: 'uppercase' }}>
                                    Heure d'envoi
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="time"
                                        className="input"
                                        value={scheduledTime}
                                        onChange={(e) => setScheduledTime(e.target.value)}
                                        style={{ width: '100%', paddingLeft: '32px' }}
                                    />
                                    <Clock size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)' }} />
                                </div>
                            </div>
                        </div>

                        <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-500)', marginBottom: '8px', textTransform: 'uppercase' }}>
                            Contenu du message
                        </label>
                        <textarea
                            className="input"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            style={{
                                width: '100%',
                                minHeight: '120px',
                                padding: 'var(--spacing-4)',
                                resize: 'vertical',
                                fontSize: 'var(--font-size-sm)',
                                lineHeight: '1.5'
                            }}
                        />
                        <div style={{ textAlign: 'right', marginTop: '4px', fontSize: '10px', color: 'var(--color-gray-400)' }}>
                            {message.length} caractères • ~{Math.ceil(message.length / 160)} SMS
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                        <button
                            className="btn btn-secondary"
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            onClick={handleSaveSchedule}
                            disabled={isProcessing || !message.trim()}
                        >
                            {isProcessing ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
                            Sauvegarder
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
                            "Envoyer maintenant" délivre le message immédiatement et marque le rappel comme traité.
                            "Sauvegarder" met à jour la planification sans envoyer.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
