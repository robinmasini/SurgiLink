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
    { path: '/review/active', label: 'Dashboard Infirmier', icon: Stethoscope },
    { path: '/patients', label: 'Listes patients', icon: Users },
    { path: '/comments', label: 'Commentaires Patients', icon: MessageSquare },
    { path: '/stats', label: 'Statistiques', icon: BarChart3 },
    { path: '/users', label: 'Utilisateurs', icon: UserCog },
    { path: '/account', label: 'Mon compte', icon: User },
];

export default function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (isMobile) return null;

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
                {navItems.map((item) => {
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
                        alt="Dr. Christophe Desouches"
                        className="sidebar-profile-avatar"
                    />
                    {!isMobile && (
                        <div className="sidebar-profile-info">
                            <div className="sidebar-profile-name">DESOUCHES Christophe</div>
                            <div className="badge badge-gold" style={{ fontSize: '9px', padding: '2px 8px', marginBottom: '4px', width: 'fit-content' }}>
                                Admin PRO
                            </div>
                            <div className="sidebar-profile-title">Praticien</div>
                            <div className="sidebar-profile-specialty">
                                <span className="sidebar-profile-specialty-label">Corps de métier</span>
                                <span className="sidebar-profile-specialty-text">
                                    Chirurgie Esthétique<br />
                                    Plastique reconstructrice
                                </span>
                            </div>
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
