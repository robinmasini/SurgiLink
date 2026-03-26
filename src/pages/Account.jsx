import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import MobileNavbar from '../components/MobileNavbar';
import christopheSignature from '../assets/christophe-signature.png';
import welcomeCardV4 from '../assets/welcome-card-v4.jpg';
import practitionerAvatar from '../assets/practitioner-avatar.png';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    Award,
    Settings,
    Shield,
    Bell,
    LogOut
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Account() {
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="dashboard-layout" data-mobile={isMobile}>
            <Sidebar />
            <main className="main-content" data-mobile={isMobile}>
                <Header
                    title="Mon Compte"
                    subtitle="Gérez vos informations personnelles et préférences"
                    hideTitleMobile={true}
                />

                <div className="account-container fade-in">
                    {/* Welcome Banner - Relocated from Dashboard */}
                    <div className="welcome-banner" style={{ marginBottom: 'var(--spacing-8)', maxWidth: '900px' }}>
                        <div className="welcome-banner-content">
                            <div></div>
                            <div>
                                <div className="welcome-banner-welcome">Bonjour,</div>
                                <a
                                    href="https://www.desouches-chirurgien-esthetique.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="welcome-banner-signature-link"
                                >
                                    <img src={christopheSignature} alt="Christophe DESOUCHES" className="welcome-banner-signature" />
                                </a>
                                <div className="welcome-banner-greeting">Ravi de vous revoir !</div>
                                <div className="welcome-banner-instruction">Votre espace praticien est à jour</div>
                            </div>
                            <div>
                                <div className="welcome-banner-date-label">Date d'aujourd'hui</div>
                                <div className="welcome-banner-date-value">
                                    {new Date().toLocaleDateString('fr-FR', {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    }).replace(/^\w/, (c) => c.toUpperCase())}
                                </div>
                            </div>
                        </div>
                        <img
                            src={welcomeCardV4}
                            alt="Espace Opératoire"
                            className="welcome-banner-image"
                        />
                    </div>

                    <div className="grid-2">
                        {/* Profile Info Card */}
                        <div className="card">
                            <div className="card-header" style={{ marginBottom: 'var(--spacing-6)' }}>
                                <h3 className="card-title">Informations du Profil</h3>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-6)', marginBottom: 'var(--spacing-8)' }}>
                                <div style={{ position: 'relative' }}>
                                    <img
                                        src={practitionerAvatar}
                                        alt="Dr. Christophe Desouches"
                                        style={{
                                            width: '100px',
                                            height: '100px',
                                            borderRadius: '50%',
                                            objectFit: 'cover',
                                            border: '4px solid var(--color-primary-50)',
                                            boxShadow: 'var(--shadow-md)'
                                        }}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '0',
                                        right: '0',
                                        background: 'var(--color-success-500)',
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        border: '3px solid white'
                                    }}></div>
                                </div>
                                <div>
                                    <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-1)' }}>
                                        DESOUCHES Christophe
                                    </h2>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                                        <span className="badge badge-gold">ADMIN PRO</span>
                                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)' }}>Praticien</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                                <div style={{ display: 'flex', alignItems: 'start', gap: 'var(--spacing-4)', padding: 'var(--spacing-4)', background: 'var(--color-gray-50)', borderRadius: 'var(--radius-lg)' }}>
                                    <Briefcase size={20} style={{ color: 'var(--color-primary-500)', marginTop: '2px' }} />
                                    <div>
                                        <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-400)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Spécialité</div>
                                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-800)' }}>Chirurgie Esthétique, Plastique reconstructrice</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', padding: 'var(--spacing-4)', border: '1px solid var(--color-gray-100)', borderRadius: 'var(--radius-lg)' }}>
                                    <Mail size={20} style={{ color: 'var(--color-gray-400)' }} />
                                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>contact@desouches-chirurgien.com</div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', padding: 'var(--spacing-4)', border: '1px solid var(--color-gray-100)', borderRadius: 'var(--radius-lg)' }}>
                                    <Phone size={20} style={{ color: 'var(--color-gray-400)' }} />
                                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>04 91 55 00 00</div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Settings Card */}
                        <div className="card">
                            <div className="card-header" style={{ marginBottom: 'var(--spacing-6)' }}>
                                <h3 className="card-title">Paramètres Rapides</h3>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                                <button className="btn-sidebar-fake" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', padding: 'var(--spacing-4)', width: '100%', textAlign: 'left', border: 'none', background: 'transparent', borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    <Settings size={20} />
                                    <span style={{ flex: 1 }}>Paramètres de l'application</span>
                                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)' }}>→</span>
                                </button>

                                <button className="btn-sidebar-fake" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', padding: 'var(--spacing-4)', width: '100%', textAlign: 'left', border: 'none', background: 'transparent', borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    <Shield size={20} />
                                    <span style={{ flex: 1 }}>Sécurité & Mot de passe</span>
                                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)' }}>→</span>
                                </button>

                                <button className="btn-sidebar-fake" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', padding: 'var(--spacing-4)', width: '100%', textAlign: 'left', border: 'none', background: 'transparent', borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    <Bell size={20} />
                                    <span style={{ flex: 1 }}>Notifications</span>
                                    <span className="badge badge-primary" style={{ fontSize: '10px' }}>Activé</span>
                                </button>

                                <div style={{ height: '1px', background: 'var(--color-gray-100)', margin: 'var(--spacing-2) 0' }}></div>

                                <button
                                    className="btn-sidebar-fake"
                                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', padding: 'var(--spacing-4)', width: '100%', textAlign: 'left', border: 'none', background: 'transparent', borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: 'all 0.2s', color: 'var(--color-danger-500)' }}
                                    onClick={async () => {
                                        await supabase.auth.signOut();
                                        navigate('/login');
                                    }}
                                >
                                    <LogOut size={20} />
                                    <span style={{ flex: 1 }}>Déconnexion</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                .btn-sidebar-fake:hover {
                    background: var(--color-gray-50) !important;
                    color: var(--color-primary-600) !important;
                }
                .account-container {
                    padding-bottom: var(--spacing-8);
                }
            `}} />
        </div>
    );
}
