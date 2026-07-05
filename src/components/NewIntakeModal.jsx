import { useState, useEffect } from 'react';
import { X, Phone, User, Send, Loader, ClipboardList, CheckCircle } from 'lucide-react';
import PhoneInput from './PhoneInput';
import { createIntakePatient } from '../services/intakeService';
import { supabase } from '../lib/supabase';

export default function NewIntakeModal({ isOpen, onClose, onSuccess }) {
    const [phone, setPhone] = useState('+33 ');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isDone, setIsDone] = useState(false);
    const [error, setError] = useState('');
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) setUserId(session.user.id);
        };
        getSession();
    }, []);

    useEffect(() => {
        if (!isOpen) {
            // Reset on close
            setPhone('+33 ');
            setFirstName('');
            setLastName('');
            setIsSending(false);
            setIsDone(false);
            setError('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSend = async () => {
        const cleanPhone = phone.replace(/[\s\.\-\(\)]/g, '');
        if (cleanPhone.length < 8) {
            setError('Veuillez saisir un numéro de téléphone valide.');
            return;
        }
        setError('');
        setIsSending(true);
        try {
            const result = await createIntakePatient(phone, firstName || null, lastName || null, userId);
            if (result.success) {
                setIsDone(true);
                if (onSuccess) onSuccess(result);
            } else {
                setError(result.error || 'Une erreur est survenue.');
            }
        } catch (err) {
            setError(err.message || 'Erreur inattendue.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div
                className="liquid-glass-modal"
                style={{ width: '100%', maxWidth: '460px' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ padding: 'var(--spacing-5)', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(109, 40, 217, 0.3)'
                        }}>
                            <ClipboardList size={18} color="white" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--color-gray-900)' }}>
                                Nouvelle fiche patient
                            </h3>
                            <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-gray-400)', fontWeight: '500' }}>
                                Envoi par SMS de la fiche de renseignements
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gray-400)', padding: '4px' }}
                    >
                        <X size={22} />
                    </button>
                </div>

                <div style={{ padding: 'var(--spacing-5)' }}>
                    {!isDone ? (
                        <>
                            {/* Explanation banner */}
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(109,40,217,0.04))',
                                border: '1px solid rgba(124,58,237,0.15)',
                                borderRadius: '12px',
                                padding: '12px 14px',
                                marginBottom: 'var(--spacing-4)',
                                fontSize: '13px',
                                color: '#5B21B6',
                                lineHeight: 1.5
                            }}>
                                🩺 Le patient recevra un <strong>SMS avec un lien</strong> vers sa fiche de renseignements médicaux digitale à compléter depuis son téléphone.
                            </div>

                            {/* Name fields (optional) */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-gray-500)', textTransform: 'uppercase', marginBottom: '6px' }}>
                                        Prénom <span style={{ color: 'var(--color-gray-300)', fontWeight: '400' }}>(optionnel)</span>
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)' }} />
                                        <input
                                            className="input"
                                            placeholder="Marie"
                                            style={{ paddingLeft: '32px', fontSize: '14px' }}
                                            value={firstName}
                                            onChange={e => setFirstName(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-gray-500)', textTransform: 'uppercase', marginBottom: '6px' }}>
                                        Nom <span style={{ color: 'var(--color-gray-300)', fontWeight: '400' }}>(optionnel)</span>
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)' }} />
                                        <input
                                            className="input"
                                            placeholder="DUPONT"
                                            style={{ paddingLeft: '32px', fontSize: '14px' }}
                                            value={lastName}
                                            onChange={e => setLastName(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Phone (required) */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-gray-500)', textTransform: 'uppercase', marginBottom: '6px' }}>
                                    Téléphone <span style={{ color: '#EF4444' }}>*</span>
                                </label>
                                <PhoneInput value={phone} onChange={setPhone} />
                            </div>

                            {error && (
                                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#DC2626', marginBottom: '14px' }}>
                                    ⚠️ {error}
                                </div>
                            )}

                            <button
                                onClick={handleSend}
                                disabled={isSending}
                                style={{
                                    width: '100%',
                                    height: '46px',
                                    background: isSending ? '#A78BFA' : 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontWeight: '800',
                                    fontSize: '15px',
                                    cursor: isSending ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    boxShadow: '0 6px 20px rgba(109, 40, 217, 0.35)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {isSending ? (
                                    <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Envoi en cours...</>
                                ) : (
                                    <><Send size={18} /> Envoyer la fiche par SMS</>
                                )}
                            </button>
                        </>
                    ) : (
                        /* Success state */
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{
                                width: '64px', height: '64px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #10B981, #059669)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 16px',
                                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)'
                            }}>
                                <CheckCircle size={32} color="white" />
                            </div>
                            <h4 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '800', color: 'var(--color-gray-900)' }}>
                                SMS envoyé !
                            </h4>
                            <p style={{ margin: '0 0 20px', fontSize: '14px', color: 'var(--color-gray-500)', lineHeight: 1.5 }}>
                                {firstName ? `${firstName} ` : 'Le patient '} va recevoir le lien vers sa fiche de renseignements.
                                <br />Vous serez notifié une fois complétée.
                            </p>
                            <button
                                onClick={onClose}
                                className="btn btn-primary"
                                style={{ width: '100%', height: '44px', borderRadius: '12px', fontWeight: '700' }}
                            >
                                Fermer
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
