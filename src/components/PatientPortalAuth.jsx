import { useState } from 'react';
import { Calendar, Lock, Loader, AlertCircle } from 'lucide-react';
import { verifyPatientDOB } from '../services/tokenService';

export default function PatientPortalAuth({ token, onVerify }) {
    const [dob, setDob] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Use the secure service to verify DOB against the token
            const result = await verifyPatientDOB(token, dob);

            if (result.success) {
                // Success: verification passed, result includes patientId if needed
                onVerify(result.patientId);
            } else {
                setError(result.error || 'La date de naissance est incorrecte. Veuillez réessayer.');
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
            </div>
        </div>
    );
}
