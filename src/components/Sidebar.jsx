import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import LogoPremium from './LogoPremium';
import LogoIcon from './LogoIcon';
import practitionerAvatar from '../assets/practitioner-avatar.png';
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
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (!error && data) {
                    setProfile(data);
                } else {
                    // Fallback based on email if profile fetch fails
                    const email = session.user.email;
                    if (email === 'christophe.desouches@gmail.com') {
                        setProfile({
                            full_name: 'Dr. Christophe DESOUCHES',
                            role: 'practitioner',
                            specialty: 'Chirurgien Esthétique'
                        });
                    } else if (email === 'infirmier.desouches@gmail.com') {
                        setProfile({
                            full_name: 'Infirmier Cabinet',
                            role: 'nurse',
                            specialty: 'Suivi Post-Opératoire'
                        });
                    } else {
                        setProfile({
                            full_name: email.split('@')[0].toUpperCase(),
                            role: 'practitioner'
                        });
                    }
                }
            }
        } catch (err) {
            console.error('Error loading profile:', err);
        }
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
                        src={practitionerAvatar}
                        alt={profile?.full_name || "Utilisateur"}
                        className="sidebar-profile-avatar"
                    />
                    {!isMobile && (
                        <div className="sidebar-profile-info">
                            <div className="sidebar-profile-name">
                                {profile?.full_name?.split(' ').map((n, i) => i === 0 ? n : <><br />{n}</>) || "DESOUCHES<br />CHRISTOPHE"}
                            </div>

                            <div className="badge-row">
                                <span className="badge-gold">ADMIN PRO</span>
                                <span className="badge-role">{profile?.role === 'practitioner' ? 'Praticien' : 'Infirmier'}</span>
                            </div>

                            <div className="profile-meta">
                                <div className="profile-meta-label">CORPS DE MÉTIER</div>
                                <div className="profile-meta-value">
                                    {profile?.role === 'practitioner' ? (
                                        <>CHIRURGIE ESTHÉTIQUE<br />PLASTIQUE RECONSTRUCTRICE</>
                                    ) : (
                                        <>SUIVI POST-OPÉRATOIRE<br />PRISE EN CHARGE PATIENT</>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <button
                    className="sidebar-logout-btn"
                    style={{
                        marginTop: 'var(--spacing-4)',
                        width: '100%',
                        padding: '12px',
                        borderRadius: '12px',
                        border: '1px solid #FEE2E2',
                        color: '#EF4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: 'transparent',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer'
                    }}
                    onClick={async () => {
                        await supabase.auth.signOut();
                        navigate('/login');
                    }}
                >
                    <LogOut size={18} />
                    <span>Déconnexion</span>
                </button>
            </div>
        </aside>
    );
}
