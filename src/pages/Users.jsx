import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import {
    User,
    Shield,
    Mail,
    Search,
    MoreHorizontal,
    Plus,
    Stethoscope,
    Activity
} from 'lucide-react';
import practitionerAvatar from '../assets/practitioner-avatar.png';

export default function Users() {
    const [profiles, setProfiles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadProfiles();
    }, []);

    const loadProfiles = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('role', { ascending: false });

            if (error || !data || data.length === 0) {
                console.warn('Profiles table not yet fully initialized, empty or restricted. Using fallback data.', error);
                setProfiles([
                    {
                        id: 'c512fc61-e751-4ea3-872e-8a04fee4da12',
                        full_name: 'Christophe DESOUCHES',
                        role: 'practitioner',
                        email: 'christophe.desouches@gmail.com',
                        specialty: 'Chirurgien Esthétique'
                    },
                    {
                        id: 'fe1efb20-c915-41b1-9cbd-cbb18df43565',
                        full_name: 'Infirmier Cabinet',
                        role: 'nurse',
                        email: 'infirmier.desouches@gmail.com',
                        specialty: 'Suivi Post-Opératoire'
                    }
                ]);
            } else {
                setProfiles(data);
            }
        } catch (err) {
            console.error('Exception loading profiles:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const filterFunc = (p) => {
        const query = searchTerm.toLowerCase();
        return (p.full_name?.toLowerCase().includes(query) ||
            p.email?.toLowerCase().includes(query) ||
            p.role?.toLowerCase().includes(query));
    };

    const practitioners = profiles.filter(p => p.role === 'practitioner' && filterFunc(p));
    const nurses = profiles.filter(p => p.role === 'nurse' && filterFunc(p));

    const UserCard = ({ profile, icon: Icon }) => (
        <div className="card user-card" style={{
            padding: 'var(--spacing-4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'default',
            border: '1px solid var(--color-gray-100)',
            gap: 'var(--spacing-4)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
                <div style={{ position: 'relative' }}>
                    {profile.role === 'practitioner' ? (
                        <img
                            src={practitionerAvatar}
                            alt={profile.full_name}
                            style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-primary-100)' }}
                        />
                    ) : (
                        <div style={{
                            width: '52px',
                            height: '52px',
                            borderRadius: '50%',
                            background: profile.role === 'nurse' ? 'var(--color-info-50)' : 'var(--color-primary-50)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: profile.role === 'nurse' ? 'var(--color-info-600)' : 'var(--color-primary-600)',
                            border: `2px solid ${profile.role === 'nurse' ? 'var(--color-info-100)' : 'var(--color-primary-100)'}`
                        }}>
                            <Icon size={24} />
                        </div>
                    )}
                    <div style={{
                        position: 'absolute',
                        bottom: '0',
                        right: '0',
                        width: '14px',
                        height: '14px',
                        background: 'var(--color-success-500)',
                        borderRadius: '50%',
                        border: '2px solid white'
                    }} />
                </div>
                <div>
                    <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-gray-900)', marginBottom: '2px' }}>
                        {profile.full_name}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                        <span className={`badge ${profile.role === 'practitioner' ? 'badge-gold' : 'badge-primary'}`} style={{ fontSize: '9px', textTransform: 'uppercase' }}>
                            {profile.role === 'practitioner' ? 'Praticien' : 'Infirmier'}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--color-gray-500)', fontWeight: '500' }}>{profile.specialty || 'Personnel Médical'}</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-6)' }}>
                <div className="hide-mobile" style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)', color: 'var(--color-gray-500)', fontSize: '12px', justifyContent: 'flex-end' }}>
                        <Mail size={12} />
                        <span>{profile.email}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-gray-400)', marginTop: '2px' }}>Dernière connexion: Aujourd'hui</div>
                </div>
                <button
                    className="btn btn-icon-ghost"
                    style={{ padding: '8px' }}
                    onClick={() => alert(`Gestion de l'utilisateur ${profile.full_name} bientôt disponible`)}
                >
                    <MoreHorizontal size={18} />
                </button>
            </div>
        </div>
    );

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-gray-50)' }}>
            <Sidebar />
            <main style={{ flex: 1, padding: 'var(--spacing-8)', marginLeft: 'var(--sidebar-width)' }}>
                <Header
                    title="Gestion des Utilisateurs"
                    subtitle={`${profiles.length} comptes actifs au sein du cabinet`}
                    actions={
                        <button className="btn btn-primary" onClick={() => alert('L\'ajout d\'utilisateurs nécessite des privilèges administrateur Supabase.')}>
                            <Plus size={18} /> Inviter un membre
                        </button>
                    }
                />

                <div className="users-container fade-in" style={{ maxWidth: '1000px' }}>
                    {/* Search & Stats Section */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)', gap: 'var(--spacing-4)' }}>
                        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)' }} />
                            <input
                                type="text"
                                placeholder="Rechercher par nom, email ou rôle..."
                                className="input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ paddingLeft: '40px', background: 'white' }}
                            />
                        </div>
                        <div className="hide-mobile" style={{ display: 'flex', gap: 'var(--spacing-6)' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase', fontWeight: '700' }}>Praticiens</div>
                                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '800', color: 'var(--color-primary-600)' }}>{practitioners.length}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase', fontWeight: '700' }}>Infirmiers</div>
                                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '800', color: 'var(--color-info-600)' }}>{nurses.length}</div>
                            </div>
                        </div>
                    </div>

                    {/* Practitioners Section */}
                    {practitioners.length > 0 && (
                        <div style={{ marginBottom: 'var(--spacing-8)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-4)', color: 'var(--color-gray-600)' }}>
                                <Stethoscope size={18} />
                                <h3 style={{ fontSize: '16px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Praticiens</h3>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                                {practitioners.map(p => <UserCard key={p.id} profile={p} icon={User} />)}
                            </div>
                        </div>
                    )}

                    {/* Nurses Section */}
                    {nurses.length > 0 && (
                        <div style={{ marginBottom: 'var(--spacing-8)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-4)', color: 'var(--color-gray-600)' }}>
                                <Activity size={18} />
                                <h3 style={{ fontSize: '16px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Infirmiers</h3>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                                {nurses.map(p => <UserCard key={p.id} profile={p} icon={Activity} />)}
                            </div>
                        </div>
                    )}

                    {isLoading && (
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-12)', color: 'var(--color-gray-400)' }}>
                            Chargement des utilisateurs...
                        </div>
                    )}

                    {!isLoading && practitioners.length === 0 && nurses.length === 0 && (
                        <div className="card" style={{ padding: 'var(--spacing-12)', textAlign: 'center', color: 'var(--color-gray-500)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-4)' }}>
                            <Search size={48} style={{ opacity: 0.1 }} />
                            <div>Aucun utilisateur ne correspond à votre recherche.</div>
                        </div>
                    )}
                </div>
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                .user-card:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-lg);
                    border-color: var(--color-primary-200) !important;
                }
                .btn-icon-ghost:hover {
                    background: var(--color-gray-50);
                    color: var(--color-primary-600);
                }
            `}} />
        </div>
    );
}
