import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import logo from '../assets/logo_surgilink.png';
import {
    LayoutDashboard,
    Stethoscope,
    Users,
    TrendingUp,
    Eye,
    LogOut
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

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <img src={logo} alt="SurgiLink" style={{ width: '120px', height: 'auto', objectFit: 'contain' }} />
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
                                <Icon size={20} />
                            </span>
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
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
                    Déconnexion
                </button>
            </div>
        </aside>
    );
}
