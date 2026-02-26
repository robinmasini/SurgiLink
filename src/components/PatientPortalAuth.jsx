import { useState } from 'react';
import { Calendar, Lock, Loader, AlertCircle, ShieldOff } from 'lucide-react';
import { verifyPatientDOB } from '../services/tokenService';

const MAX_ATTEMPTS = 3;

export default function PatientPortalAuth({ token, onVerify }) {
    const [dob, setDob] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [attempts, setAttempts] = useState(0);

    const isLocked = attempts >= MAX_ATTEMPTS;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isLocked) return;

        setLoading(true);
        setError(null);

        try {
            const result = await verifyPatientDOB(token, dob);

            if (result.success) {
                onVerify(result.patientId);
            } else {
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);

                if (newAttempts >= MAX_ATTEMPTS) {
                    setError(null); // Lockout screen takes over
                } else {
                    const remaining = MAX_ATTEMPTS - newAttempts;
                    setError(
                        `${result.error || 'Date de naissance incorrecte.'} ${remaining} tentative${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}.`
                    );
                }
                setLoading(false);
            }
        } catch (err) {
            console.error('Submit error:', err);
            setError('Une erreur est survenue lors de la vérification.');
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            padding: 'var(--spacing-4)'
        }}>
            <div className="card glass-effect" style={{ maxWidth: '450px', width: '100%', padding: 'var(--spacing-8)' }}>
                {isLocked ? (
                    /* ── Lockout Screen ── */
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            background: 'var(--color-danger-100)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto var(--spacing-4)',
                            color: 'var(--color-danger-600)'
                        }}>
                            <ShieldOff size={32} />
                        </div>
                        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-3)', color: 'var(--color-danger-700)' }}>
                            Accès verrouillé
                        </h2>
                        <p style={{ color: 'var(--color-gray-600)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-6)' }}>
                            Trop de tentatives incorrectes. Pour des raisons de sécurité, l'accès à ce portail a été suspendu.
                        </p>
                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)' }}>
                            Veuillez contacter votre praticien pour obtenir un nouveau lien d'accès.
                        </p>
                    </div>
                ) : (
                    /* ── Verification Form ── */
                    <>
                        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-8)' }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                background: 'var(--color-primary-100)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto var(--spacing-4)',
                                color: 'var(--color-primary-600)'
                            }}>
                                <Lock size={32} />
                            </div>
                            <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-2)' }}>
                                Confirmation d'Identité
                            </h2>
                            <p style={{ color: 'var(--color-gray-600)', fontSize: 'var(--font-size-sm)' }}>
                                Pour accéder à vos informations sécurisées, veuillez confirmer votre date de naissance.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: 'var(--spacing-2)', fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)' }}>
                                    Date de naissance
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)' }}>
                                        <Calendar size={18} />
                                    </div>
                                    <input
                                        type="date"
                                        required
                                        value={dob}
                                        onChange={(e) => setDob(e.target.value)}
                                        style={{
                                            width: '100%',
                                            paddingLeft: '40px',
                                            paddingTop: 'var(--spacing-3)',
                                            paddingBottom: 'var(--spacing-3)',
                                            paddingRight: 'var(--spacing-3)',
                                            borderRadius: 'var(--border-radius-lg)',
                                            border: error ? '1px solid var(--color-danger-500)' : '1px solid var(--color-gray-200)',
                                            fontSize: 'var(--font-size-md)',
                                            outline: 'none',
                                            transition: 'border-color 0.2s'
                                        }}
                                    />
                                </div>
                                {error && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', color: 'var(--color-danger-600)', marginTop: 'var(--spacing-2)', fontSize: 'var(--font-size-xs)' }}>
                                        <AlertCircle size={14} />
                                        <span>{error}</span>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary"
                                style={{
                                    width: '100%',
                                    padding: 'var(--spacing-4)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 'var(--spacing-2)',
                                    fontSize: 'var(--font-size-md)',
                                    fontWeight: 'var(--font-weight-bold)'
                                }}
                            >
                                {loading ? <Loader className="animate-spin" size={18} /> : 'Confirmer et Accéder'}
                            </button>
                        </form>

                        <div style={{ marginTop: 'var(--spacing-8)', textAlign: 'center' }}>
                            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>
                                Vos données sont protégées par un chiffrement de bout en bout. 🔐
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
