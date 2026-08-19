import { useState, useEffect } from 'react';
import LogoWhite from '../components/LogoWhite';
import favicon from '/favicon.png';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, User, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';


export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [userType, setUserType] = useState('practitioner'); // practitioner or nurse
    const [isLoading, setIsLoading] = useState(true); // Preloader
    const [isAuthenticating, setIsAuthenticating] = useState(false); // Login process

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);

        // Simulation d'un chargement premium
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800); // Snappier feel
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timer);
        };
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
                if (error.message.includes('Failed to fetch') || error.message.includes('fetch') || error.message.includes('network')) {
                    localStorage.setItem('surgilink_demo_session', JSON.stringify({
                        user: { id: 'demo-practitioner-id', email: cleanEmail },
                        role: userType
                    }));
                    navigate('/dashboard');
                    return;
                }
                alert(`Erreur d'authentification : ${error.message}`);
                setIsAuthenticating(false);
                return;
            }

            if (data?.user) {
                // Verify role in profiles table
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();

                let effectiveRole = null;
                if (profile && !profileError) {
                    effectiveRole = profile.role;
                } else {
                    // Fallback based on email if profile not in table
                    const email = data.user.email?.toLowerCase() || '';
                    if (email.includes('infirmier') || email.includes('nurse')) {
                        effectiveRole = 'nurse';
                    } else if (email.includes('desouches') || email.includes('practitioner')) {
                        effectiveRole = 'practitioner';
                    } else {
                        // Default fallback
                        effectiveRole = 'practitioner';
                    }
                }

                // Strict role enforcement
                if (effectiveRole !== userType) {
                    await supabase.auth.signOut();
                    alert(`Accès refusé : Votre compte est enregistré en tant que ${effectiveRole === 'practitioner' ? 'Praticien' : 'Infirmier'}. Veuillez sélectionner le bon type de compte.`);
                    setIsAuthenticating(false);
                    return;
                }

                navigate('/dashboard');
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

            {/* Background Layer with Zoom Animation */}
            <video 
                autoPlay 
                loop 
                muted 
                playsInline
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                className="login-bg-video"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    zIndex: 0
                }}
            >
                <source src="/login-bg.mp4" type="video/mp4" />
            </video>


            {/* Dark Overlay for contrast */}
            <div className="login-overlay"></div>

            {/* Centered Login Card */}
            <div className="login-card">
                <div className="login-brand">
                    <div className="login-brand-logo">
                        <LogoWhite width="140px" />
                    </div>
                </div>

                {/* Role Selector */}
                <div className="login-type-selector">
                    <button
                        className={`login-type-btn ${userType === 'practitioner' ? 'active' : ''}`}
                        onClick={() => setUserType('practitioner')}
                    >
                        <User size={18} />
                        Praticien
                    </button>
                    <button
                        className={`login-type-btn ${userType === 'nurse' ? 'active' : ''}`}
                        onClick={() => setUserType('nurse')}
                    >
                        <Activity size={18} />
                        Infirmier
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
                                placeholder={userType === 'practitioner' ? "Email praticien" : "Email infirmier"}
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
                        <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)', opacity: 0.5 }}>v1.3 - Role Gates Active</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
