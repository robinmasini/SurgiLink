import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import LogoPremium from './LogoPremium';
import LogoIcon from './LogoIcon';
import practitionerAvatar from '../assets/practitioner-avatar.png';
import nurseAvatar from '../assets/nurse-avatar.png';
import {
    LayoutDashboard,
    Stethoscope,
    Users,
    MessageSquare,
    BarChart3,
    UserCog,
    User,
    LogOut
} from 'lucide-react';

const navItems = [
    { path: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { path: '/patients', label: 'Listes patients', icon: Users },
    { path: '/comments', label: 'Commentaires Patients', icon: MessageSquare },
    { path: '/rentabilite', label: 'Rentabilité ROI', icon: BarChart3 },
    { path: '/users', label: 'Utilisateurs', icon: UserCog },
    { path: '/account', label: 'Mon compte', icon: User },
];

export default function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 1024);
        };
        window.addEventListener('resize', handleResize);

        loadProfile();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const loadProfile = async () => {
        let isMounted = true;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session && isMounted) {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (isMounted) {
                    if (!error && data) {
                        setProfile(data);
                    } else {
                        // Fallback based on email if profile not in table
                        const email = session.user.email?.toLowerCase() || '';
                        if (email.includes('infirmier') || email.includes('nurse')) {
                            setProfile({
                                full_name: 'Infirmier Cabinet',
                                role: 'nurse'
                            });
                        } else {
                            setProfile({
                                full_name: 'Dr. Christophe DESOUCHES',
                                role: 'practitioner'
                            });
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Error loading profile:', err);
        }
        return () => { isMounted = false; };
    };

    if (isMobile) return null;

    // Filter nav items based on role
    const filteredNavItems = navItems.filter(item => {
        if (item.path === '/users' && profile?.role !== 'practitioner') {
            return false;
        }
        return true;
    });

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                {isMobile ? (
                    <LogoIcon width="35px" className="sidebar-logo-img" />
                ) : (
                    <LogoPremium width="120px" className="sidebar-logo-img" />
                )}
            </div>

            <nav className="sidebar-nav">
                {filteredNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <Link
                            key={item.label}
                            to={item.path}
                            className={`sidebar-item ${isActive ? 'active' : ''}`}
                        >
                            <span className="sidebar-item-icon">
                                <Icon size={isMobile ? 24 : 20} />
                            </span>
                            {!isMobile && <span className="sidebar-item-label">{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-profile-card">
                    <img
                        src={profile?.avatar_url || (profile?.role === 'nurse' ? nurseAvatar : practitionerAvatar)}
                        alt={profile?.full_name || "Utilisateur"}
                        className="sidebar-profile-avatar"
                        style={{ border: profile?.role === 'nurse' ? '2px solid var(--color-info-200)' : '2px solid var(--color-primary-200)' }}
                    />
                    {!isMobile && (
                        <div className="sidebar-profile-info">
                            <div className="sidebar-profile-name">{profile?.full_name?.toUpperCase() || "CHARGEMENT..."}</div>
                            {profile?.role === 'practitioner' ? (
                                <>
                                    <div className="badge badge-gold" style={{ fontSize: '9px', padding: '2px 8px', marginBottom: '4px', width: 'fit-content', fontWeight: '800' }}>
                                        Admin PRO
                                    </div>
                                    <div className="badge badge-primary" style={{ fontSize: '9px', padding: '2px 8px', marginBottom: '4px', width: 'fit-content', background: 'rgba(20, 184, 166, 0.1)', color: 'var(--color-primary-600)', border: '1px solid var(--color-primary-200)' }}>
                                        PRATICIEN
                                    </div>
                                    <div className="sidebar-profile-title">Praticien</div>
                                    <div className="sidebar-profile-specialty">
                                        <span className="sidebar-profile-specialty-label">Corps de métier</span>
                                        <span className="sidebar-profile-specialty-text">
                                            Chirurgie Esthétique<br />Plastique reconstructrice
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="badge badge-primary" style={{ fontSize: '9px', padding: '2px 8px', marginBottom: '4px', width: 'fit-content', background: 'var(--color-info-500)', color: 'white', fontWeight: '800' }}>
                                        INFIRMIER
                                    </div>
                                    <div className="sidebar-profile-title">Infirmier Cabinet</div>
                                    <div className="sidebar-profile-specialty">
                                        <span className="sidebar-profile-specialty-label">Corps de métier</span>
                                        <span className="sidebar-profile-specialty-text">
                                            Suivi Post-Opératoire<br />Prise en charge patient
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <button
                    className="sidebar-logout-btn"
                    onClick={async () => {
                        await supabase.auth.signOut();
                        navigate('/login');
                    }}
                >
                    <span className="sidebar-item-icon">
                        <LogOut size={isMobile ? 22 : 18} />
                    </span>
                    {!isMobile && <span className="sidebar-item-label">Déconnexion</span>}
                </button>
            </div>
        </aside>
    );
}
