import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import LogoIcon from './LogoIcon';
import SMSAlarmsModal from './SMSAlarmsModal';
import {
    LayoutDashboard,
    Stethoscope,
    Users
} from 'lucide-react';
import hmIcon from '../assets/hm-icon.png';

export default function MobileNavbar() {
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
    const [isAlarmsModalOpen, setIsAlarmsModalOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Also hide on login, patient portal, and intake form pages
    if (!isMobile || location.pathname === '/login' || location.pathname.startsWith('/patient-portal') || location.pathname.startsWith('/fiche/')) {
        return null;
    }

    const navItems = [
        { path: '/dashboard', icon: LayoutDashboard },
        { path: '/hopital-manager', icon: hmIcon, isCustomIcon: true },
        { path: '/patients', icon: Users },
        { path: '/users', icon: Stethoscope },
    ];

    return (
        <nav className="mobile-navbar">
            <div className="mobile-navbar-container">
                <svg className="mobile-navbar-svg-bg" viewBox="0 0 360 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M 36,0 L 144,0 C 156,0 160,32 180,32 C 200,32 204,0 216,0 L 324,0 A 36,36 0 0 1 360,36 A 36,36 0 0 1 324,72 L 36,72 A 36,36 0 0 1 0,36 A 36,36 0 0 1 36,0 Z"
                        fill="rgba(255, 255, 255, 0.85)"
                        stroke="rgba(255, 255, 255, 0.4)"
                        strokeWidth="1"
                    />
                </svg>

                <Link
                    to={navItems[0].path}
                    className={`mobile-nav-item ${location.pathname === navItems[0].path ? 'active' : ''}`}
                >
                    <LayoutDashboard size={24} />
                </Link>

                <Link
                    to={navItems[2].path}
                    className={`mobile-nav-item ${location.pathname === navItems[2].path ? 'active' : ''}`}
                >
                    <Users size={24} />
                </Link>

                <div 
                    className="mobile-nav-logo-prominent"
                    onClick={() => setIsAlarmsModalOpen(true)}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="mobile-nav-logo-bg">
                        <LogoIcon width="22px" />
                    </div>
                </div>

                <Link
                    to={navItems[1].path}
                    className={`mobile-nav-item ${location.pathname === navItems[1].path ? 'active' : ''}`}
                >
                    <img 
                        src={navItems[1].icon} 
                        alt="HM" 
                        style={{ 
                            width: '24px', 
                            height: '24px', 
                            objectFit: 'contain',
                            opacity: location.pathname === navItems[1].path ? 1 : 0.7 
                        }} 
                    />
                </Link>

                <Link
                    to={navItems[3].path}
                    className={`mobile-nav-item ${location.pathname === navItems[3].path ? 'active' : ''}`}
                >
                    <Stethoscope size={24} />
                </Link>
            </div>
            <SMSAlarmsModal isOpen={isAlarmsModalOpen} onClose={() => setIsAlarmsModalOpen(false)} />
        </nav>
    );
}
