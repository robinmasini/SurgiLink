import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Logo from './Logo';
import practitionerAvatar from '../assets/practitioner-avatar.png';
import {
    LayoutDashboard,
    Stethoscope,
    Users,
    TrendingUp,
    Eye,
    LogOut,
    X
} from 'lucide-react';

const navItems = [
    { path: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { path: '/patients', label: 'File Active Patients', icon: Users },
    { path: '/rentabilite', label: 'Rentabilité & ROI', icon: TrendingUp },
    { path: '/review/active', label: 'Suivi par Statut', icon: Stethoscope },
    { path: '/patient/checklist', label: 'Aperçu Patient', icon: Eye },
];

export default function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileExpanded, setIsMobileExpanded] = useState(false);

    const toggleSidebar = () => setIsMobileExpanded(!isMobileExpanded);

    return (
        <aside className={`sidebar ${isMobileExpanded ? 'is-mobile-expanded' : ''}`}>
            {isMobileExpanded && (
                <button
                    className="sidebar-close-btn"
                    onClick={() => setIsMobileExpanded(false)}
                    aria-label="Fermer le menu"
                >
                    <X size={24} />
                </button>
            )}

            <div className="sidebar-logo" onClick={toggleSidebar} style={{ cursor: 'pointer' }}>
                <Logo width="120px" className="sidebar-logo-img" />
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
                            onClick={() => setIsMobileExpanded(false)}
                        >
                            <span className="sidebar-item-icon">
                                <Icon size={20} />
                            </span>
                            <span className="sidebar-item-label">{item.label}</span>
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
                    <div className="sidebar-profile-info">
                        <div className="sidebar-profile-name">DESOUCHES Christophe</div>
                        <div className="sidebar-profile-title">Praticien</div>
                        <div className="sidebar-profile-specialty">
                            <span className="sidebar-profile-specialty-label">Corps de métier</span>
                            <span className="sidebar-profile-specialty-text">
                                Chirurgie Esthétique<br />
                                Plastique reconstructrice
                            </span>
                        </div>
                    </div>
                </div>

                <button
                    className="sidebar-item"
                    style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer' }}
                    onClick={async () => {
                        await supabase.auth.signOut();
                        navigate('/login');
                    }}
                >
                    <span className="sidebar-item-icon">
                        <LogOut size={20} />
                    </span>
                    <span className="sidebar-item-label">Déconnexion</span>
                </button>
            </div>
        </aside>
    );
}
