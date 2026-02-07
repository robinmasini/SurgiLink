import { useState, useEffect } from 'react';
import Logo from '../components/Logo';
import favicon from '/favicon.png';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [userType, setUserType] = useState('professional');
    const [isLoading, setIsLoading] = useState(true); // Preloader
    const [isAuthenticating, setIsAuthenticating] = useState(false); // Login process

    useEffect(() => {
        // Simulation d'un chargement premium
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800); // Snappier feel
        return () => clearTimeout(timer);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const cleanEmail = email.trim();
        const cleanPassword = password.trim();

        if (!cleanEmail || !cleanPassword) {
            alert('Veuillez saisir vos identifiants.');
            return;
        }

        setIsAuthenticating(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: cleanEmail,
                password: cleanPassword,
            });

            if (error) {
                alert(`Erreur d'authentification : ${error.message}`);
                setIsAuthenticating(false);
                return;
            }

            if (data?.user) {
                if (userType === 'professional') {
                    navigate('/dashboard');
                } else {
                    navigate('/patient/checklist');
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Une erreur est survenue lors de la connexion.');
            setIsAuthenticating(false);
        }
    };

    return (
        <div className="login-page">
            {/* Preloader */}
            <div className={`preloader ${!isLoading ? 'fade-out' : ''}`}>
                <img src={favicon} alt="Loading" className="preloader-icon" />
            </div>

            {/* Background Video */}
            <video
                autoPlay
                loop
                muted
                playsInline
                className="login-bg-video"
                style={{ background: '#000' }} // Solid background during load
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
                        <Logo width="140px" />
                    </div>
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
                                required
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
                                required
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                        <a href="#" style={{ fontSize: '0.875rem', color: '#FFFFFF', fontWeight: 500 }}>
                            Mot de passe oublié ?
                        </a>
                    </div>

                    <button
                        type="submit"
                        className={`btn btn-primary btn-lg ${isAuthenticating ? 'loading' : ''}`}
                        disabled={isAuthenticating}
                    >
                        {isAuthenticating ? 'Connexion en cours...' : 'Se connecter'}
                        {!isAuthenticating && <ArrowRight size={18} />}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '2rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.5rem' }}>
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)', opacity: 0.5 }}>v1.2 - Secure Auth Active</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
