import { useState, useEffect } from 'react';
import LogoWhite from '../components/LogoWhite';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, User, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [userType, setUserType] = useState('practitioner'); // practitioner or nurse
    const [isLoading, setIsLoading] = useState(true); // Preloader
    const [isAuthenticating, setIsAuthenticating] = useState(false); // Login process
    const [error, setError] = useState(null);

    useEffect(() => {
        // Simple preloader simulation
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!supabase) {
            setError("Erreur de connexion au serveur.");
            return;
        }

        setIsAuthenticating(true);
        setError(null);

        try {
            const { data, error: loginError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (loginError) throw loginError;

            if (data.user) {
                // Verify role match (optional but good for UX)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();

                if (profile && profile.role !== userType) {
                    console.warn(`User role mismatch: expected ${userType}, got ${profile.role}`);
                }

                navigate('/dashboard');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'Erreur lors de la connexion');
        } finally {
            setIsAuthenticating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="login-preloader">
                <div className="preloader-content">
                    <LogoWhite width="180px" className="preloader-logo" />
                    <div className="preloader-spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="login-page">
            <div className="login-video-container">
                <video autoPlay loop muted playsInline className="login-bg-video">
                    <source src="/login-bg.mp4" type="video/mp4" />
                </video>
                <div className="login-video-overlay"></div>
            </div>

            <div className="login-container">
                <div className="login-card fade-in">
                    <div className="login-header">
                        <LogoWhite width="140px" className="login-logo" />
                        <h1>BIENVENUE</h1>
                        <p>Consultez et gérez vos synthèses post-opératoires</p>
                    </div>

                    <div className="login-type-selector">
                        <button
                            className={`login-type-btn ${userType === 'practitioner' ? 'active' : ''}`}
                            onClick={() => setUserType('practitioner')}
                        >
                            <User size={18} />
                            <span>Praticien</span>
                        </button>
                        <button
                            className={`login-type-btn ${userType === 'nurse' ? 'active' : ''}`}
                            onClick={() => setUserType('nurse')}
                        >
                            <Activity size={18} />
                            <span>Infirmier</span>
                        </button>
                    </div>

                    <form className="login-form" onSubmit={handleLogin}>
                        {error && <div className="login-error">{error}</div>}

                        <div className="form-group">
                            <div className="input-with-icon">
                                <Mail className="input-icon" size={20} />
                                <input
                                    type="email"
                                    placeholder="Adresse email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <div className="input-with-icon">
                                <Lock className="input-icon" size={20} />
                                <input
                                    type="password"
                                    placeholder="Mot de passe"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary login-btn"
                            disabled={isAuthenticating}
                        >
                            {isAuthenticating ? (
                                <span className="spinner-small"></span>
                            ) : (
                                <>
                                    <span>Se connecter</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="login-footer">
                        <p>© 2024 SurgiLink • Solution de Suivi Connectée</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
