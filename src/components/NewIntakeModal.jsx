import { useState, useEffect } from 'react';
import { X, Send, Loader, ClipboardList, CheckCircle, Phone, User, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createIntakePatient } from '../services/intakeService';
import { supabase } from '../lib/supabase';
import PhoneInput from './PhoneInput';

export default function NewIntakeModal({ isOpen, onClose, onSuccess }) {
    const navigate = useNavigate();
    const [phone, setPhone] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isDone, setIsDone] = useState(false);
    const [error, setError] = useState('');
    const [userId, setUserId] = useState(null);
    const [existingPatient, setExistingPatient] = useState(null);

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) setUserId(session.user.id);
        };
        getSession();
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setPhone('');
            setIsSending(false);
            setIsDone(false);
            setError('');
            setExistingPatient(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const formatPhoneDisplay = (val) => {
        // Allow digits, spaces, +, -, ()
        return val.replace(/[^\d\s\+\-\(\)]/g, '');
    };

    const handleSend = async () => {
        const cleanPhone = phone.replace(/[\s\.\-\(\)]/g, '');
        if (cleanPhone.length < 8) {
            setError('Veuillez saisir un numéro de téléphone valide.');
            return;
        }
        setError('');
        setIsSending(true);
        
        try {
            const last9Digits = cleanPhone.slice(-9);
            const wildcardPattern = '%' + last9Digits.split('').join('%') + '%';

            // Fetch potential matches using the wildcard pattern to ignore spaces/dots in DB
            const { data: potentialMatches, error: searchError } = await supabase
                .from('patients')
                .select('id, name, birth_date, operation, date, phone, created_at')
                .ilike('phone', wildcardPattern)
                .order('created_at', { ascending: false });
                
            if (!searchError && potentialMatches && potentialMatches.length > 0) {
                // Filter matches strictly by the last 9 digits after stripping non-numeric chars
                const validMatches = potentialMatches.filter(p => {
                    const pClean = (p.phone || '').replace(/[\s\.\-\(\)\+]/g, '');
                    return pClean.endsWith(last9Digits);
                });

                if (validMatches.length > 0) {
                    // Prefer a named patient over 'Nouveau patient', then newest first
                    validMatches.sort((a, b) => {
                        const aIsNew = a.name === 'Nouveau patient';
                        const bIsNew = b.name === 'Nouveau patient';
                        if (!aIsNew && bIsNew) return -1;
                        if (aIsNew && !bIsNew) return 1;
                        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                    });

                    setExistingPatient(validMatches[0]);
                    setIsSending(false);
                    return;
                }
            }

            const result = await createIntakePatient(phone, null, null, userId);
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

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !isSending) handleSend();
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div
                className="liquid-glass-modal"
                style={{ width: '100%', maxWidth: '420px' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: 'var(--spacing-5)',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                        <div style={{
                            width: '38px', height: '38px', borderRadius: '11px',
                            background: 'linear-gradient(135deg, var(--color-success-500), var(--color-success-600))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                        }}>
                            <ClipboardList size={18} color="white" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--color-gray-900)' }}>
                                Nouveau(elle) patient(e)
                            </h3>
                            <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-gray-400)', fontWeight: '500' }}>
                                La fiche sera envoyée par SMS au patient
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gray-400)', padding: '4px', borderRadius: '6px' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: 'var(--spacing-5)' }}>
                    {existingPatient ? (
                        /* Existing Patient Alert State */
                        <div style={{ textAlign: 'center', padding: '10px 0 4px' }}>
                            <div style={{
                                width: '68px', height: '68px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 18px',
                                boxShadow: '0 8px 24px rgba(245, 158, 11, 0.38)'
                            }}>
                                <User size={34} color="white" />
                            </div>
                            <h4 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '800', color: 'var(--color-gray-900)' }}>
                                Patient déjà existant
                            </h4>
                            <p style={{ margin: '0 0 16px', fontSize: '14px', color: 'var(--color-gray-500)', lineHeight: 1.55 }}>
                                Ce numéro de téléphone est déjà associé au patient <strong>{existingPatient.name}</strong> dans SurgiLink.
                            </p>
                            
                            <div style={{
                                background: '#F9FAFB', border: '1px solid #E5E7EB',
                                borderRadius: '12px', padding: '14px', marginBottom: '22px',
                                textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px'
                            }}>
                                <div style={{ fontSize: '12px', color: '#6B7280' }}>
                                    <strong style={{ color: '#374151' }}>Date de Naissance :</strong> {existingPatient.birth_date ? new Date(existingPatient.birth_date).toLocaleDateString('fr-FR') : 'Non renseignée'}
                                </div>
                                <div style={{ fontSize: '12px', color: '#6B7280' }}>
                                    <strong style={{ color: '#374151' }}>Dernière intervention :</strong> {existingPatient.operation || 'Non définie'} ({existingPatient.date ? new Date(existingPatient.date).toLocaleDateString('fr-FR') : 'Date non définie'})
                                </div>
                            </div>

                            <button
                                onClick={() => navigate(`/patient/${existingPatient.id}`)}
                                className="btn btn-primary"
                                style={{ width: '100%', height: '46px', borderRadius: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                Ouvrir sa fiche patient <ExternalLink size={16} />
                            </button>
                            <button
                                onClick={() => setExistingPatient(null)}
                                className="btn btn-secondary"
                                style={{ width: '100%', height: '46px', borderRadius: '12px', fontWeight: '700', marginTop: '12px' }}
                            >
                                Essayer un autre numéro
                            </button>
                        </div>
                    ) : !isDone ? (
                        <>
                            {/* Explanation */}
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.06), rgba(var(--color-primary-rgb), 0.03))',
                                border: '1px solid rgba(var(--color-primary-rgb), 0.15)',
                                borderRadius: '12px',
                                padding: '12px 14px',
                                marginBottom: 'var(--spacing-5)',
                                fontSize: '13px',
                                color: 'var(--color-primary-700)',
                                lineHeight: 1.55
                            }}>
                                📲 Entrez le <strong>numéro de téléphone</strong> du patient. Il recevra un SMS avec un lien pour remplir lui-même sa fiche de renseignements médicaux.
                            </div>

                            {/* Phone input */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '11px', fontWeight: '700',
                                    color: 'var(--color-gray-500)',
                                    textTransform: 'uppercase', letterSpacing: '0.05em',
                                    marginBottom: '8px'
                                }}>
                                    Numéro de téléphone <span style={{ color: '#EF4444' }}>*</span>
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <PhoneInput
                                        value={phone}
                                        onChange={val => setPhone(val)}
                                        onKeyDown={handleKeyDown}
                                        autoFocus
                                        error={!!error}
                                        placeholder="6 12 34 56 78"
                                    />
                                </div>
                                <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'var(--color-gray-400)' }}>
                                    Le patient renseignera lui-même son nom, prénom et toutes ses informations médicales.
                                </p>
                            </div>

                            {error && (
                                <div style={{
                                    background: '#FEF2F2', border: '1px solid #FECACA',
                                    borderRadius: '10px', padding: '10px 12px',
                                    fontSize: '13px', color: '#DC2626', marginBottom: '14px'
                                }}>
                                    ⚠️ {error}
                                </div>
                            )}

                            <button
                                onClick={handleSend}
                                disabled={isSending || !phone.trim()}
                                style={{
                                    width: '100%', height: '48px',
                                    background: isSending || !phone.trim()
                                        ? 'rgba(16, 185, 129, 0.4)'
                                        : 'linear-gradient(135deg, var(--color-success-500), var(--color-success-600))',
                                    border: 'none', borderRadius: '13px',
                                    color: 'white', fontWeight: '800', fontSize: '15px',
                                    cursor: isSending || !phone.trim() ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    boxShadow: phone.trim() ? '0 6px 20px rgba(16, 185, 129, 0.35)' : 'none',
                                    transform: phone.trim() && !isSending ? 'translateY(-2px)' : 'none'
                                }}
                            >
                                {isSending ? (
                                    <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Envoi en cours…</>
                                ) : (
                                    <><Send size={18} /> Envoyer la fiche par SMS</>
                                )}
                            </button>
                        </>
                    ) : (
                        /* Success state */
                        <div style={{ textAlign: 'center', padding: '10px 0 4px' }}>
                            <div style={{
                                width: '68px', height: '68px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #10B981, #059669)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 18px',
                                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.38)'
                            }}>
                                <CheckCircle size={34} color="white" />
                            </div>
                            <h4 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '800', color: 'var(--color-gray-900)' }}>
                                SMS envoyé ! ✓
                            </h4>
                            <p style={{ margin: '0 0 6px', fontSize: '14px', color: 'var(--color-gray-500)', lineHeight: 1.55 }}>
                                Le patient va recevoir un lien pour remplir sa fiche de renseignements médicaux.
                            </p>
                            <p style={{ margin: '0 0 22px', fontSize: '12px', color: 'var(--color-gray-400)' }}>
                                Sa fiche apparaîtra dans SurgiLink dès qu'il l'aura complétée.
                            </p>
                            <button
                                onClick={onClose}
                                className="btn btn-primary"
                                style={{ width: '100%', height: '46px', borderRadius: '12px', fontWeight: '700' }}
                            >
                                Fermer
                            </button>
                        </div>
                    )}
                </div>
                <style>{`
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                `}</style>
            </div>
        </div>
    );
}
