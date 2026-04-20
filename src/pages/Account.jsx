import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import MobileNavbar from '../components/MobileNavbar';
import christopheSignature from '../assets/christophe-signature.png';
import welcomeCardV4 from '../assets/welcome-card-v4.jpg';
import wppPhone from '../assets/wpp-phone.png';
import welcomeCardInfirmier from '../assets/welcomecard-infirmier.png';
import practitionerAvatar from '../assets/practitioner-avatar.png';
import nurseAvatar from '../assets/nurse-avatar.png';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    Award,
    Settings,
    Shield,
    Send,
    LogOut
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Account() {
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        specialty: ''
    });
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 1024);
        window.addEventListener('resize', handleResize);

        loadProfile();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const loadProfile = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (data) {
                setProfile(data);
                const nameParts = data.full_name?.split(' ') || [];
                setFormData({
                    first_name: nameParts[0] || '',
                    last_name: nameParts.slice(1).join(' ') || '',
                    phone: data.phone || '04 91 55 00 00',
                    specialty: data.specialty || (data.role === 'practitioner' ? 'Chirurgie Esthétique' : 'Suivi Post-Opératoire')
                });
            } else {
                // Fallback for missing profile record
                const email = session.user.email?.toLowerCase() || '';
                const isNurse = email.includes('infirmier') || email.includes('nurse');
                setProfile({
                    full_name: isNurse ? 'Infirmier Cabinet' : 'Dr. Christophe DESOUCHES',
                    role: isNurse ? 'nurse' : 'practitioner',
                    email: email
                });
                setFormData({
                    first_name: isNurse ? 'Infirmier' : 'Christophe',
                    last_name: isNurse ? 'Cabinet' : 'DESOUCHES',
                    phone: '04 91 55 00 00',
                    specialty: isNurse ? 'Suivi Post-Opératoire' : 'Chirurgie Esthétique'
                });
            }
        }
    };

    const handleAvatarUpload = async (event) => {
        try {
            setUploadingAvatar(true);
            const file = event.target.files[0];
            if (!file) return;

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload to 'avatars' bucket
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // Update profile with new avatar URL
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', session.user.id);

            if (updateError) throw updateError;

            setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
            alert('Photo de profil mise à jour !');
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('Erreur lors du chargement de la photo. Assurez-vous que le bucket "avatars" existe dans Supabase.');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const fullName = `${formData.first_name} ${formData.last_name}`.trim();
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: session.user.id,
                    full_name: fullName,
                    specialty: formData.specialty,
                    phone: formData.phone,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            setProfile(prev => ({
                ...prev,
                full_name: fullName,
                specialty: formData.specialty,
                phone: formData.phone
            }));
            setIsEditing(false);
            alert('Profil mis à jour avec succès !');
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Erreur lors de l\'enregistrement. Vérifiez vos permissions Supabase.');
        } finally {
            setIsSaving(false);
        }
    };

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
                                {profile?.role === 'practitioner' ? (
                                    <a
                                        href="https://www.desouches-chirurgien-esthetique.com/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="welcome-banner-signature-link"
                                    >
                                        <img src={christopheSignature} alt="Christophe DESOUCHES" className="welcome-banner-signature" />
                                    </a>
                                ) : (
                                    <div className="welcome-banner-greeting" style={{ fontSize: '24px', fontWeight: '800', margin: '10px 0' }}>
                                        {profile?.full_name || 'Infirmier Cabinet'}
                                    </div>
                                )}
                                <div className="welcome-banner-greeting">Ravi de vous revoir !</div>
                                <div className="welcome-banner-instruction">Votre espace {profile?.role === 'practitioner' ? 'praticien' : 'infirmier'} est à jour</div>
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
                            src={profile?.role === 'nurse' ? welcomeCardInfirmier : welcomeCardV4}
                            alt="Espace Opératoire"
                            className="welcome-banner-image"
                        />
                    </div>

                    <div className="grid-2">
                        {/* Profile Info Card */}
                        <div className="card">
                            <div className="card-header" style={{ marginBottom: 'var(--spacing-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 className="card-title">Informations du Profil</h3>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setIsEditing(!isEditing)}
                                    style={{ padding: '4px 12px', fontSize: '12px' }}
                                >
                                    {isEditing ? 'Annuler' : 'Modifier le profil'}
                                </button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-6)', marginBottom: 'var(--spacing-8)' }}>
                                <div style={{ position: 'relative' }}>
                                    <img
                                        src={profile?.avatar_url || (profile?.role === 'nurse' ? nurseAvatar : practitionerAvatar)}
                                        alt={profile?.full_name}
                                        onError={(e) => {
                                            if (profile?.role === 'nurse') {
                                                e.target.src = practitionerAvatar;
                                            }
                                        }}
                                        style={{
                                            width: '100px',
                                            height: '100px',
                                            borderRadius: '50%',
                                            objectFit: 'cover',
                                            border: '4px solid var(--color-primary-50)',
                                            boxShadow: 'var(--shadow-md)',
                                            opacity: uploadingAvatar ? 0.5 : 1
                                        }}
                                    />
                                    {isEditing && (
                                        <label style={{
                                            position: 'absolute',
                                            bottom: '0',
                                            right: '0',
                                            background: 'var(--color-primary-500)',
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            border: '2px solid white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            cursor: 'pointer',
                                            boxShadow: 'var(--shadow-sm)'
                                        }}>
                                            <Plus size={16} />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                                onChange={handleAvatarUpload}
                                                disabled={uploadingAvatar}
                                            />
                                        </label>
                                    )}
                                    {!isEditing && (
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
                                    )}
                                </div>
                                <div>
                                    {isEditing ? (
                                        <div style={{ display: 'flex', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
                                            <input
                                                className="input"
                                                placeholder="Prénom"
                                                value={formData.first_name}
                                                onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                                style={{ padding: '8px 12px' }}
                                            />
                                            <input
                                                className="input"
                                                placeholder="Nom"
                                                value={formData.last_name}
                                                onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                                style={{ padding: '8px 12px' }}
                                            />
                                        </div>
                                    ) : (
                                        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-1)' }}>
                                            {profile?.full_name || 'Chargement...'}
                                        </h2>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                                        {profile?.role === 'practitioner' ? (
                                            <span className="badge badge-gold" style={{ fontWeight: '800' }}>ADMIN PRO</span>
                                        ) : (
                                            <span className="badge badge-primary" style={{ background: 'var(--color-info-500)', fontWeight: '800' }}>INFIRMIER</span>
                                        )}
                                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)' }}>
                                            {profile?.role === 'practitioner' ? 'Praticien' : 'Personnel Médical'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                                <div style={{ display: 'flex', alignItems: 'start', gap: 'var(--spacing-4)', padding: 'var(--spacing-4)', background: 'var(--color-gray-50)', borderRadius: 'var(--radius-lg)' }}>
                                    <Briefcase size={20} style={{ color: 'var(--color-primary-500)', marginTop: '2px' }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-400)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Spécialité</div>
                                        {isEditing ? (
                                            <input
                                                className="input"
                                                value={formData.specialty}
                                                onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                                                style={{ marginTop: '4px', background: 'white' }}
                                            />
                                        ) : (
                                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-800)' }}>
                                                {profile?.specialty || (profile?.role === 'practitioner' ? 'Chirurgie Esthétique' : 'Suivi Post-Opératoire')}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', padding: 'var(--spacing-4)', border: '1px solid var(--color-gray-100)', borderRadius: 'var(--radius-lg)' }}>
                                    <Mail size={20} style={{ color: 'var(--color-gray-400)' }} />
                                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>{profile?.email || 'Chargement...'}</div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', padding: 'var(--spacing-4)', border: '1px solid var(--color-gray-100)', borderRadius: 'var(--radius-lg)' }}>
                                    <Phone size={20} style={{ color: 'var(--color-gray-400)' }} />
                                    {isEditing ? (
                                        <input
                                            className="input"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="Gérer le numéro de téléphone"
                                            style={{ border: 'none', padding: '0', height: 'auto', background: 'transparent' }}
                                        />
                                    ) : (
                                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>{formData.phone || '04 91 55 00 00'}</div>
                                    )}
                                </div>

                                {isEditing && (
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleSaveProfile}
                                        disabled={isSaving}
                                        style={{ marginTop: 'var(--spacing-4)' }}
                                    >
                                        {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                                    </button>
                                )}
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
                                    <Send size={20} />
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
