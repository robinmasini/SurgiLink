import { Link, useLocation } from 'react-router-dom';
import LogoIcon from './LogoIcon';
import {
    LayoutDashboard,
    Stethoscope,
    Users,
    TrendingUp
} from 'lucide-react';

export default function MobileNavbar() {
    const location = useLocation();

    const navItems = [
        { path: '/dashboard', icon: LayoutDashboard },
        { path: '/review/active', icon: Stethoscope },
        { path: '/patients', icon: Users },
        { path: '/rentabilite', icon: TrendingUp },
    ];

    return (
        <nav className="mobile-navbar">
            <div className="mobile-navbar-container">
                <Link
                    to={navItems[0].path}
                    className={`mobile-nav-item ${location.pathname === navItems[0].path ? 'active' : ''}`}
                >
                    <LayoutDashboard size={24} />
                </Link>

                <Link
                    to={navItems[1].path}
                    className={`mobile-nav-item ${location.pathname === navItems[1].path ? 'active' : ''}`}
                >
                    <Stethoscope size={24} />
                </Link>

                <div className="mobile-nav-logo-prominent">
                    <div className="mobile-nav-logo-bg">
                        <LogoIcon width="32px" />
                    </div>
                </div>

                <Link
                    to={navItems[2].path}
                    className={`mobile-nav-item ${location.pathname === navItems[2].path ? 'active' : ''}`}
                >
                    <Users size={24} />
                </Link>

                <Link
                    to={navItems[3].path}
                    className={`mobile-nav-item ${location.pathname === navItems[3].path ? 'active' : ''}`}
                >
                    <TrendingUp size={24} />
                </Link>
            </div>
        </nav>
    );
}
