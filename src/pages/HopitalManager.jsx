import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import { 
    Database, 
    RefreshCw, 
    CheckCircle2, 
    AlertCircle,
    ArrowRight,
    Lock,
    User,
    Check,
    Loader2,
    Sparkles
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import hmLogo from '../assets/HM.png';
import hmIcon from '../assets/hm-icon.png';
import HMScannerModal from '../components/HMScannerModal';

export default function HopitalManager() {
    const { t } = useTranslation();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('Dr.Desouches');
    const [password, setPassword] = useState('••••••••');
    const [patients, setPatients] = useState([]);
    const [syncingId, setSyncingId] = useState(null);
    const [globalSyncing, setGlobalSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isHMScannerOpen, setIsHMScannerOpen] = useState(false);

    useEffect(() => {
        loadPatients();
    }, []);

    const loadPatients = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .order('date', { ascending: true });

            if (error) throw error;
            setPatients(data || []);

            // Initialize random sync statuses for realism
            const initialStatus = {};
            (data || []).forEach(p => {
                initialStatus[p.id] = p.id % 2 === 0 ? 'synced' : 'pending';
            });
            setSyncStatus(initialStatus);
        } catch (err) {
            console.error('Error loading patients for sync:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = (e) => {
        e.preventDefault();
        setIsLoggedIn(true);
    };

    const triggerSync = (id) => {
        setSyncingId(id);
        setTimeout(() => {
            setSyncStatus(prev => ({ ...prev, [id]: 'synced' }));
            setSyncingId(null);
        }, 1500);
    };

    const triggerGlobalSync = () => {
        setGlobalSyncing(true);
        setTimeout(() => {
            const updated = {};
            patients.forEach(p => {
                updated[p.id] = 'synced';
            });
            setSyncStatus(updated);
            setGlobalSyncing(false);
        }, 2500);
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-background)' }}>
            <Sidebar />
            <main className="main-content">
                <Header
                    title="Portail Hopital Manager"
                    subtitle="Intégration du Dossier Patient Informatisé (DPI)"
                />

                {!isLoggedIn ? (
                    // LOGIN PORTAL MOCKUP
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 'var(--spacing-12) 0',
                        minHeight: '60vh'
                    }}>
                        <div className="card fade-in" style={{
                            width: '100%',
                            maxWidth: '460px',
                            padding: 'var(--spacing-8)',
                            background: 'white',
                            border: '1px solid var(--color-gray-100)',
                            boxShadow: 'var(--shadow-xl)',
                            borderRadius: 'var(--radius-2xl)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                        }}>
                            {/* Imported Logo without background */}
                            <img 
                                src={hmLogo} 
                                alt="Hopital Manager Logo" 
                                style={{ 
                                    width: '280px', 
                                    height: 'auto', 
                                    objectFit: 'contain',
                                    marginBottom: '6px'
                                }} 
                            />
                            <span style={{
                                fontSize: '12px',
                                color: 'var(--color-gray-400)',
                                fontStyle: 'italic',
                                marginBottom: 'var(--spacing-8)'
                            }}>
                                v1.2601.24
                            </span>

                            <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-gray-700)' }}>
                                        Identifiant
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)' }} />
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px 10px 38px',
                                                border: '1px solid #C4D3E5',
                                                borderRadius: 'var(--radius-lg)',
                                                fontSize: '14px',
                                                outline: 'none',
                                                background: '#F5F8FC'
                                            }}
                                            required
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-gray-700)' }}>
                                        Mot de passe
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)' }} />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px 10px 38px',
                                                border: '1px solid #C4D3E5',
                                                borderRadius: 'var(--radius-lg)',
                                                fontSize: '14px',
                                                outline: 'none',
                                                background: '#F5F8FC'
                                            }}
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    style={{
                                        marginTop: 'var(--spacing-2)',
                                        width: '100%',
                                        padding: '12px',
                                        background: '#0F70B7',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: 'var(--radius-lg)',
                                        fontWeight: '700',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                        boxShadow: '0 4px 12px rgba(15, 112, 183, 0.2)'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#0d619f'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = '#0F70B7'}
                                >
                                    Se connecter
                                </button>
                            </form>
                        </div>
                    </div>
                ) : (
                    // LOGGED IN DASHBOARD / SYNC STATE
                    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
                        {/* Status Card */}
                        <div className="card" style={{
                            padding: 'var(--spacing-6)',
                            background: 'white',
                            border: '1px solid var(--color-gray-100)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 'var(--spacing-4)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    width: '52px',
                                    height: '52px',
                                    borderRadius: '12px',
                                    background: 'rgba(50, 154, 214, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#329AD6'
                                }}>
                                    <Database size={28} />
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-gray-900)' }}>
                                            Hopital Manager Sync Link
                                        </h3>
                                        <span className="badge badge-success" style={{ background: '#E3F9E5', color: '#1F7A26', border: '1px solid #B4EBB7' }}>
                                            Opérationnel
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '13px', color: 'var(--color-gray-500)' }}>
                                        Connecté en tant que <strong>{username}</strong> • API V1.2601.24
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setIsHMScannerOpen(true)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        background: 'rgba(15, 112, 183, 0.1)',
                                        color: '#0F70B7',
                                        border: '1px solid rgba(15, 112, 183, 0.2)',
                                        fontWeight: '700'
                                    }}
                                >
                                    <img src={hmIcon} alt="HM Icon" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
                                    Scanner Patient HM
                                </button>
                                <button 
                                    className="btn btn-secondary"
                                    onClick={() => setIsLoggedIn(false)}
                                    style={{ border: '1px solid var(--color-gray-200)', background: 'white' }}
                                >
                                    Déconnexion
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={triggerGlobalSync}
                                    disabled={globalSyncing}
                                    style={{
                                        background: '#0F70B7',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        border: 'none',
                                        boxShadow: '0 4px 12px rgba(15, 112, 183, 0.15)'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#0d619f'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = '#0F70B7'}
                                >
                                    {globalSyncing ? (
                                        <Loader2 size={18} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                                    ) : (
                                        <RefreshCw size={18} />
                                    )}
                                    Synchroniser Tout
                                </button>
                            </div>
                        </div>

                        {/* Import Screenshot Banner */}
                        <div className="card" style={{
                            padding: 'var(--spacing-5)',
                            background: 'linear-gradient(135deg, rgba(15, 112, 183, 0.05) 0%, rgba(255, 255, 255, 0.85) 100%)',
                            border: '1px solid rgba(15, 112, 183, 0.15)',
                            borderRadius: 'var(--radius-xl)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 'var(--spacing-4)',
                            boxShadow: 'var(--shadow-sm)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '280px' }}>
                                <div style={{
                                    width: '44px',
                                    height: '44px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <img src={hmIcon} alt="HM Icon" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-gray-900)', margin: '0 0 2px 0' }}>
                                        Scanner Patient Hospital Manager (DPI)
                                    </h4>
                                    <p style={{ fontSize: '13px', color: 'var(--color-gray-500)', margin: 0, lineHeight: '1.4' }}>
                                        Déposez une capture d'écran d'un dossier patient Hospital Manager pour l'importer instantanément dans SurgiLink et planifier ses rappels automatiques.
                                    </p>
                                </div>
                            </div>
                            <button
                                className="btn btn-primary"
                                onClick={() => setIsHMScannerOpen(true)}
                                style={{
                                    background: '#0F70B7',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    border: 'none',
                                    fontWeight: '700',
                                    boxShadow: '0 4px 12px rgba(15, 112, 183, 0.2)'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#0d619f'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#0F70B7'}
                            >
                                <img src={hmIcon} alt="HM Icon" style={{ width: '16px', height: '16px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                                Scanner Patient HM
                            </button>
                        </div>

                        {/* Patients Sync Table */}
                        <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                            <div style={{ padding: 'var(--spacing-4)', borderBottom: '1px solid var(--color-gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Synchronisation des Dossiers Patients</h3>
                                <span style={{ fontSize: '13px', color: 'var(--color-gray-500)' }}>
                                    {patients.length} dossiers correspondants
                                </span>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--color-gray-50)', borderBottom: '1px solid var(--color-gray-100)' }}>
                                            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', color: 'var(--color-gray-500)', textTransform: 'uppercase', fontWeight: '700' }}>Patient</th>
                                            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', color: 'var(--color-gray-500)', textTransform: 'uppercase', fontWeight: '700' }}>Intervention</th>
                                            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', color: 'var(--color-gray-500)', textTransform: 'uppercase', fontWeight: '700' }}>Identifiant Externe</th>
                                            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', color: 'var(--color-gray-500)', textTransform: 'uppercase', fontWeight: '700' }}>Statut Sync</th>
                                            <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '11px', color: 'var(--color-gray-500)', textTransform: 'uppercase', fontWeight: '700' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-gray-400)' }}>
                                                    Chargement...
                                                </td>
                                            </tr>
                                        ) : patients.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-gray-400)' }}>
                                                    Aucun patient à synchroniser.
                                                </td>
                                            </tr>
                                        ) : patients.map(p => (
                                            <tr key={p.id} style={{ borderBottom: '1px solid var(--color-gray-50)' }}>
                                                <td style={{ padding: '14px 16px' }}>
                                                    <div style={{ fontWeight: '600', color: 'var(--color-gray-900)' }}>{p.name}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--color-gray-400)' }}>{p.phone}</div>
                                                </td>
                                                <td style={{ padding: '14px 16px' }}>
                                                    <div style={{ fontSize: '13px', color: 'var(--color-gray-800)' }}>{p.operation}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--color-gray-400)' }}>{p.date}</div>
                                                </td>
                                                <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '13px', color: 'var(--color-gray-600)' }}>
                                                    HM-{p.id * 1042 + 99}
                                                </td>
                                                <td style={{ padding: '14px 16px' }}>
                                                    {syncStatus[p.id] === 'synced' ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-success-600)', fontSize: '13px', fontWeight: '600' }}>
                                                            <CheckCircle2 size={16} />
                                                            <span>Synchronisé</span>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-warning-600)', fontSize: '13px', fontWeight: '600' }}>
                                                            <AlertCircle size={16} />
                                                            <span>Non synchronisé</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                                    <button
                                                        onClick={() => triggerSync(p.id)}
                                                        disabled={syncingId === p.id}
                                                        style={{
                                                            padding: '6px 12px',
                                                            borderRadius: '8px',
                                                            border: '1px solid',
                                                            borderColor: syncStatus[p.id] === 'synced' ? 'var(--color-gray-200)' : '#0F70B7',
                                                            background: syncStatus[p.id] === 'synced' ? '#F5F5F5' : 'white',
                                                            color: syncStatus[p.id] === 'synced' ? 'var(--color-gray-500)' : '#0F70B7',
                                                            fontSize: '12px',
                                                            fontWeight: '700',
                                                            cursor: syncingId === p.id ? 'default' : 'pointer',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '6px'
                                                        }}
                                                    >
                                                        {syncingId === p.id ? (
                                                            <Loader2 size={12} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                                                        ) : syncStatus[p.id] === 'synced' ? (
                                                            <Check size={12} />
                                                        ) : (
                                                            <RefreshCw size={12} />
                                                        )}
                                                        {syncStatus[p.id] === 'synced' ? 'À Jour' : 'Sync'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
                
                <HMScannerModal
                    isOpen={isHMScannerOpen}
                    onClose={() => setIsHMScannerOpen(false)}
                    onSuccess={loadPatients}
                />
            </main>
        </div>
    );
}
