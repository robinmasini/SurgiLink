import { useState } from 'react';
import logo from '../assets/logo_surgilink.png';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, ArrowRight } from 'lucide-react';

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [userType, setUserType] = useState('professional');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (userType === 'professional') {
            navigate('/dashboard');
        } else {
            navigate('/patient/checklist');
        }
    };

    return (
        <div className="login-page">
            {/* Background Video */}
            <video
                autoPlay
                loop
                muted
                playsInline
                className="login-bg-video"
                poster="https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=2080&auto=format&fit=crop" // Fallback aesthetic image
            >
                {/* 
                   PLACEHOLDER: Pour une vraie vidéo, déposez un fichier 'login-bg.mp4' dans le dossier 'public'.
                   En attendant, j'ai mis une belle image de fallback.
                */}
                <source src="/login-bg.mp4" type="video/mp4" />
            </video>

            {/* Dark Overlay for contrast */}
            <div className="login-overlay"></div>

            {/* Centered Login Card */}
            <div className="login-card">
                <div className="login-brand">
                    <div className="login-brand-logo">
                        <img src={logo} alt="SurgiLink" style={{ width: '140px', height: 'auto', objectFit: 'contain', marginBottom: '1rem' }} />
                    </div>
                </div>

                <div className="toggle-group" style={{ marginBottom: '2rem' }}>
                    <button
                        type="button"
                        className={`toggle-btn ${userType === 'professional' ? 'active' : ''}`}
                        onClick={() => setUserType('professional')}
                    >
                        Professionnel
                    </button>
                    <button
                        type="button"
                        className={`toggle-btn ${userType === 'patient' ? 'active' : ''}`}
                        onClick={() => setUserType('patient')}
                    >
                        Patient
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <div style={{ position: 'relative' }}>
                            <Mail
                                size={18}
                                style={{
                                    position: 'absolute',
                                    left: '16px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--color-gray-400)'
                                }}
                            />
                            <input
                                type="email"
                                className="input"
                                placeholder={userType === 'professional' ? "Email professionnel" : "Email personnel"}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ paddingLeft: '48px' }}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <div style={{ position: 'relative' }}>
                            <Lock
                                size={18}
                                style={{
                                    position: 'absolute',
                                    left: '16px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--color-gray-400)'
                                }}
                            />
                            <input
                                type="password"
                                className="input"
                                placeholder="Mot de passe"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ paddingLeft: '48px' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                        <a href="#" style={{ fontSize: '0.875rem', color: 'var(--color-primary-600)', fontWeight: 500 }}>
                            Mot de passe oublié ?
                        </a>
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg">
                        Se connecter
                        <ArrowRight size={18} />
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '2rem', borderTop: '1px solid var(--color-gray-100)', paddingTop: '1.5rem' }}>
                    <p style={{ fontSize: '0.875rem', margin: 0 }}>
                        {userType === 'professional' ? (
                            <>
                                Nouveau praticien ?{' '}
                                <a href="#" style={{ fontWeight: 600, color: 'var(--color-primary-600)' }}>Demander une démo</a>
                            </>
                        ) : (
                            <>
                                Première connexion ?{' '}
                                <a href="#" style={{ fontWeight: 600, color: 'var(--color-primary-600)' }}>Activer mon compte</a>
                            </>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}
