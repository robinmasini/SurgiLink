import React, { useState, useEffect } from 'react';
import {
    X,
    ClipboardList,
    AlertTriangle,
    Info,
    Star,
    ChevronDown
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { pathwayConfig } from '../config/pathway.config';

export default function QuestionsPreviewModal({ isOpen, onClose }) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('Intake'); // Fiche de renseignements first
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!isOpen) return null;

    const tabs = [
        { key: 'Intake', label: 'Fiche patient', icon: '📝', subtitle: 'Avant tout' },
        { key: 'Bienvenue', label: 'Accueil (J-18)', icon: '👋', subtitle: 'Activation' },
        { key: 'J7', label: 'Pré-admission (J-7)', icon: '📋', subtitle: 'Sécurité & Anesthésie' },
        { key: 'J1_PreOp', label: 'Admission (J-1)', icon: '✅', subtitle: 'Consignes & Confirmation' },
        { key: 'J1', label: 'Suivi J+1', icon: '🌡️', subtitle: 'Récupération & Douleur' },
        { key: 'J4_Satisfaction', label: 'Satisfaction (J+4)', icon: '⭐', subtitle: 'Enquête clinique' },
        { key: 'ESATIS', label: 'e-Satis', icon: '📊', subtitle: 'Enquête nationale' },
    ];

    const currentScreenConfig = pathwayConfig[activeTab];

    const renderInputMockup = (item) => {
        switch (item.type) {
            case 'yes_no':
                return (
                    <div style={{ display: 'flex', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-3)' }}>
                        <div
                            style={{
                                padding: '8px 24px',
                                borderRadius: '20px',
                                border: '1px solid var(--color-primary-200)',
                                background: 'var(--color-primary-50)',
                                color: 'var(--color-primary-700)',
                                fontWeight: '700',
                                fontSize: 'var(--font-size-sm)',
                                cursor: 'not-allowed',
                                userSelect: 'none'
                            }}
                        >
                            Oui
                        </div>
                        <div
                            style={{
                                padding: '8px 24px',
                                borderRadius: '20px',
                                border: '1px solid var(--color-gray-200)',
                                background: 'white',
                                color: 'var(--color-gray-400)',
                                fontWeight: '700',
                                fontSize: 'var(--font-size-sm)',
                                cursor: 'not-allowed',
                                userSelect: 'none'
                            }}
                        >
                            Non
                        </div>
                    </div>
                );
            case 'slider_0_10':
                return (
                    <div style={{ marginTop: 'var(--spacing-4)', maxWidth: '400px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-gray-500)', marginBottom: '8px', fontWeight: '600' }}>
                            <span>0 - Aucune douleur</span>
                            <span>10 - Douleur maximale</span>
                        </div>
                        <div style={{ position: 'relative', height: '6px', background: 'var(--color-gray-200)', borderRadius: '3px' }}>
                            <div style={{ position: 'absolute', left: '0', top: 0, bottom: 0, width: '40%', background: 'linear-gradient(to right, var(--color-success-500), var(--color-warning-500))', borderRadius: '3px' }}></div>
                            <div style={{
                                position: 'absolute',
                                left: '40%',
                                top: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                background: 'white',
                                border: '3px solid var(--color-primary-500)',
                                boxShadow: 'var(--shadow-sm)'
                            }}></div>
                        </div>
                        <div style={{ textAlign: 'center', marginTop: '8px', fontWeight: '800', fontSize: '13px', color: 'var(--color-primary-600)' }}>
                            Valeur : 4
                        </div>
                    </div>
                );
            case 'rating':
                return (
                    <div style={{ display: 'flex', gap: 'var(--spacing-1)', marginTop: 'var(--spacing-3)' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                size={22}
                                style={{
                                    color: star <= 4 ? '#EAB308' : 'var(--color-gray-200)',
                                    fill: star <= 4 ? '#EAB308' : 'none'
                                }}
                            />
                        ))}
                    </div>
                );
            case 'scale':
                return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-3)' }}>
                        {(item.options || ['Très bien', 'Bien', 'Moyen', 'Mauvais']).map((option, idx) => (
                            <span
                                key={idx}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '12px',
                                    border: idx === 0 ? '1px solid var(--color-primary-300)' : '1px solid var(--color-gray-200)',
                                    background: idx === 0 ? 'var(--color-primary-50)' : 'white',
                                    color: idx === 0 ? 'var(--color-primary-700)' : 'var(--color-gray-500)',
                                    fontSize: 'var(--font-size-xs)',
                                    fontWeight: '600'
                                }}
                            >
                                {option}
                            </span>
                        ))}
                    </div>
                );
            case 'select':
                return (
                    <div style={{
                        marginTop: 'var(--spacing-3)',
                        maxWidth: '300px',
                        padding: '8px 12px',
                        border: '1px solid var(--color-gray-200)',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        color: 'var(--color-gray-500)',
                        fontSize: 'var(--font-size-sm)',
                        background: 'white'
                    }}>
                        <span>{item.options?.[0] || 'Sélectionner...'}</span>
                        <ChevronDown size={16} />
                    </div>
                );
            case 'text':
            case 'textarea':
                return (
                    <div style={{
                        marginTop: 'var(--spacing-3)',
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid var(--color-gray-200)',
                        borderRadius: '8px',
                        color: 'var(--color-gray-400)',
                        fontSize: 'var(--font-size-sm)',
                        fontStyle: 'italic',
                        background: 'var(--color-gray-50)',
                        minHeight: item.type === 'textarea' ? '60px' : 'auto'
                    }}>
                        {item.type === 'textarea' ? 'Saisissez vos commentaires ou remarques ici...' : 'Réponse libre en texte...'}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1500, // High Z-Index to avoid overlaps
            backdropFilter: 'blur(8px)',
            padding: isMobile ? '0' : '20px'
        }}>
            <div className="card fade-in" style={{
                width: '100%',
                maxWidth: isMobile ? '100%' : '900px',
                height: isMobile ? '100vh' : 'auto',
                background: 'white',
                borderRadius: isMobile ? '0' : 'var(--radius-2xl)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: isMobile ? '100vh' : '90vh'
            }}>
                {/* Header */}
                <div style={{
                    padding: isMobile ? 'var(--spacing-4)' : 'var(--spacing-5) var(--spacing-8)',
                    background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-800))',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', flex: 1, minWidth: 0 }}>
                        {!isMobile && (
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                width: '40px',
                                height: '40px',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <ClipboardList size={24} />
                            </div>
                        )}
                        <div style={{ minWidth: 0 }}>
                            <h2 style={{ fontSize: isMobile ? '16px' : 'var(--font-size-xl)', fontWeight: '800', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {t('Aperçu global du questionnaire')}
                            </h2>
                            {!isMobile && (
                                <p style={{ fontSize: '12px', opacity: 0.8, margin: 0 }}>
                                    {t('Consultez toutes les questions posées aux patients à chaque étape de leur parcours')}
                                </p>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        color: 'white',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        marginLeft: 'var(--spacing-3)',
                        flexShrink: 0
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs Bar */}
                <div style={{
                    display: 'flex',
                    gap: isMobile ? '0' : 'var(--spacing-1)',
                    overflowX: isMobile ? 'visible' : 'auto',
                    borderBottom: '1px solid var(--color-gray-100)',
                    padding: isMobile ? '0' : 'var(--spacing-4) var(--spacing-6) 0',
                    background: 'var(--color-gray-50)',
                    scrollbarWidth: 'none',
                    width: '100%',
                    justifyContent: 'space-between'
                }}>
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.key;
                        return (
                            <div
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                role="button"
                                title={`${t(tab.label)} (${t(tab.subtitle)})`}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: isMobile ? '12px 6px 10px' : '14px 24px',
                                    borderBottom: isActive ? '3.5px solid var(--color-primary-500)' : '3.5px solid transparent',
                                    color: isActive ? 'var(--color-primary-600)' : 'var(--color-gray-500)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    outline: 'none',
                                    userSelect: 'none',
                                    flex: isMobile ? '1' : 'none',
                                    textAlign: 'center',
                                    opacity: isActive ? 1 : 0.65
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.opacity = '1';
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) e.currentTarget.style.opacity = '0.65';
                                }}
                            >
                                <span 
                                    style={{ 
                                        fontSize: isMobile ? '20px' : '26px', 
                                        transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.25)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    {tab.icon}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Scrollable Questions Content */}
                <div style={{ padding: isMobile ? 'var(--spacing-4)' : 'var(--spacing-6) var(--spacing-8)', overflowY: 'auto', flex: 1, background: '#F8FAFC' }}>
                    {activeTab === 'Intake' ? (
                        /* ── Fiche de renseignements — contenu statique ── */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 'var(--spacing-4)' : 'var(--spacing-5)' }}>
                            {/* Banner */}
                            <div style={{
                                background: 'white',
                                padding: 'var(--spacing-4)',
                                borderRadius: 'var(--radius-xl)',
                                border: '1px solid rgba(124,58,237,0.15)',
                                background: 'linear-gradient(135deg, rgba(124,58,237,0.04), white)'
                            }}>
                                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#111827', margin: '0 0 4px' }}>
                                    📝 Fiche de renseignements médicaux
                                </h3>
                                <p style={{ fontSize: '12px', color: 'var(--color-gray-500)', margin: 0, lineHeight: 1.5 }}>
                                    Envoyée par SMS avant toute intervention planifiée. Le patient remplit lui-même sa fiche depuis son téléphone, en autonomie. Elle devient sa fiche patient SurgiLink.
                                </p>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                                    {['📱 Formulaire mobile', '🔒 Données sécurisées', '⏱️ ~5 minutes', '📂 8 sections'].map(tag => (
                                        <span key={tag} style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', background: 'rgba(124,58,237,0.07)', color: '#7C3AED', borderRadius: '20px', border: '1px solid rgba(124,58,237,0.15)' }}>{tag}</span>
                                    ))}
                                </div>
                            </div>

                            {[
                                {
                                    num: '1', title: 'Informations personnelles', icon: '👤',
                                    fields: ['Nom, prénom, nom de jeune fille', 'Date de naissance', 'Adresse complète (rue, CP, ville)', 'Téléphone & email', 'Personne à prévenir en cas d\'urgence (nom + tél)']
                                },
                                {
                                    num: '2', title: 'Médecins référents', icon: '🩺',
                                    fields: ['Médecin traitant (nom + ville)', 'Spécialiste suivi le cas échéant (nom + ville)']
                                },
                                {
                                    num: '3', title: 'Situation générale', icon: '💼',
                                    fields: ['Profession', 'Comment avez-vous connu le cabinet ? (Médecin, Ami(e), Internet, Réseaux sociaux, Autre)']
                                },
                                {
                                    num: '4', title: 'Données médicales', icon: '📊',
                                    fields: ['Taille (cm) & Poids (kg)', 'Allergies (Oui/Non + précision)', 'Tabagisme (Oui/Non + quantité)', 'Traitement en cours (Oui/Non + nom(s))']
                                },
                                {
                                    num: '5', title: 'Motif de consultation', icon: '💉',
                                    fields: ['Actes Visage : Botox, Acide Hyaluronique, Peeling, Paupières, Lifting, Rhinoplastie', 'Actes Poitrine : Prothèses mammaires, Ptose mammaire', 'Actes Intimes : Nymphoplastie, Pénoplastie, Éjaculation Précoce', 'Autre motif (texte libre)']
                                },
                                {
                                    num: '6', title: 'Ressenti esthétique', icon: '🪞',
                                    fields: ['Gêne esthétique : Très importante / Moyenne / Légère', 'Depuis : Peu de temps / Longtemps / Toujours', 'Consultation esthétique antérieure ? (Oui/Non)', 'Interventions esthétiques antérieures ? (Oui/Non + satisfaction)']
                                },
                                {
                                    num: '7', title: 'Antécédents personnels', icon: '🏥',
                                    fields: ['Cardiaque / Vasculaire', 'Endocrinologique', 'Digestif', 'Hématologique', 'Infectieux', 'Cancer', 'Neurologique', 'Psychique', 'Pulmonaire', 'Rénal', '(Chaque antécédent cochable avec précision textuelle)']
                                },
                                {
                                    num: '8', title: 'Antécédents chirurgicaux & familiaux', icon: '🔬',
                                    fields: ['Déjà opéré(e) ? (Oui/Non + type & année)', 'Complications chirurgicales ? (Oui/Non + détail)', 'Hématomes faciles ? (Oui/Non)', 'Cicatrices chéloïdes ? (Oui/Non)', 'Maladies auto-immunes familiales ? (Oui/Non + précision)', 'Autres antécédents familiaux (texte libre)', 'Signature électronique (ville + date)']
                                },
                            ].map(section => (
                                <div key={section.num} className="card" style={{
                                    background: 'white', borderRadius: 'var(--radius-xl)',
                                    border: '1px solid var(--color-gray-100)',
                                    boxShadow: 'var(--shadow-sm)', overflow: 'hidden'
                                }}>
                                    <div style={{
                                        padding: '12px 16px',
                                        background: 'linear-gradient(135deg, rgba(124,58,237,0.05), rgba(109,40,217,0.02))',
                                        borderBottom: '1px solid rgba(124,58,237,0.08)',
                                        display: 'flex', alignItems: 'center', gap: '10px'
                                    }}>
                                        <div style={{
                                            width: '28px', height: '28px', borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'white', fontSize: '12px', fontWeight: '800', flexShrink: 0
                                        }}>{section.num}</div>
                                        <span style={{ fontSize: '15px', marginRight: '2px' }}>{section.icon}</span>
                                        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#111827' }}>{section.title}</h4>
                                    </div>
                                    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {section.fields.map((f, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#4B5563', lineHeight: 1.4 }}>
                                                <span style={{ color: '#7C3AED', flexShrink: 0, marginTop: '1px' }}>•</span>
                                                <span>{f}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : currentScreenConfig ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 'var(--spacing-4)' : 'var(--spacing-6)' }}>
                            
                            {/* Milestone Title Banner */}
                            <div style={{
                                background: 'white',
                                padding: 'var(--spacing-4)',
                                borderRadius: 'var(--radius-xl)',
                                border: '1px solid var(--color-gray-100)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px'
                            }}>
                                <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--color-gray-900)', margin: 0 }}>
                                    {t(currentScreenConfig.title)}
                                </h3>
                                {currentScreenConfig.subtitle && (
                                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', margin: 0 }}>
                                        {t(currentScreenConfig.subtitle)}
                                    </p>
                                )}
                                {currentScreenConfig.intro_text && (
                                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)', margin: 'var(--spacing-2) 0 0', lineHeight: '1.5', padding: '10px 14px', background: 'var(--color-gray-50)', borderRadius: '8px', borderLeft: '3px solid var(--color-primary-500)' }}>
                                        {t(currentScreenConfig.intro_text)}
                                    </p>
                                )}
                            </div>

                            {/* List of Sections & Questions */}
                            {currentScreenConfig.sections.map((section) => (
                                <div key={section.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                                    
                                    {/* Section Divider / Title */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-2)' }}>
                                        <span style={{ fontSize: '18px' }}>{section.icon}</span>
                                        <h4 style={{ fontSize: '12px', fontWeight: '800', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                                            {t(section.title)}
                                        </h4>
                                        <div style={{ flex: 1, height: '1px', background: 'var(--color-gray-200)', marginLeft: 'var(--spacing-2)' }}></div>
                                    </div>

                                    {/* Section Questions */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--spacing-4)' }}>
                                        {section.items.map((item) => (
                                            <div key={item.id} className="card" style={{
                                                padding: 'var(--spacing-4)',
                                                background: 'white',
                                                borderRadius: 'var(--radius-xl)',
                                                border: '1px solid var(--color-gray-100)',
                                                boxShadow: 'var(--shadow-sm)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 'var(--spacing-2)'
                                            }}>
                                                {/* Header Line of Question Card */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                                    <span style={{
                                                        fontSize: '9px',
                                                        fontWeight: '800',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em',
                                                        color: 'var(--color-primary-600)',
                                                        background: 'var(--color-primary-50)',
                                                        padding: '4px 8px',
                                                        borderRadius: '6px'
                                                    }}>
                                                        ID: {item.id}
                                                    </span>
                                                    <span style={{
                                                        fontSize: '10px',
                                                        fontWeight: '700',
                                                        padding: '4px 8px',
                                                        borderRadius: '6px',
                                                        background: item.required ? 'var(--color-danger-50)' : 'var(--color-gray-100)',
                                                        color: item.required ? 'var(--color-danger-600)' : 'var(--color-gray-600)',
                                                        border: item.required ? '1px solid var(--color-danger-100)' : 'none'
                                                    }}>
                                                        {item.required ? t('Obligatoire') : t('Optionnelle')}
                                                    </span>
                                                </div>

                                                {/* Question Text */}
                                                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: '700', color: 'var(--color-gray-900)', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                                                    {t(item.label)}
                                                </div>

                                                {/* Input Element Mockup */}
                                                {renderInputMockup(item)}

                                                {/* Meta Information Cards (Why, Risk Flags) */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'var(--spacing-3)' }}>
                                                    
                                                    {/* Medical Why Rationale */}
                                                    {(item.why || item.info_text) && (
                                                        <div style={{
                                                            display: 'flex',
                                                            gap: 'var(--spacing-2)',
                                                            padding: '10px 12px',
                                                            background: 'rgba(20, 184, 166, 0.04)',
                                                            border: '1px solid rgba(20, 184, 166, 0.1)',
                                                            borderRadius: '8px',
                                                            fontSize: '12px',
                                                            color: 'var(--color-primary-800)'
                                                        }}>
                                                            <Info size={16} style={{ color: 'var(--color-primary-500)', flexShrink: 0, marginTop: '2px' }} />
                                                            <div>
                                                                <strong style={{ color: 'var(--color-primary-900)' }}>{t('Raison médicale')} : </strong>
                                                                {t(item.why || item.info_text)}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Alert / Risk Flags */}
                                                    {item.risk_flag_rule && (
                                                        <div style={{
                                                            display: 'flex',
                                                            gap: 'var(--spacing-2)',
                                                            padding: '10px 12px',
                                                            background: item.risk_flag_rule.type === 'hard' ? 'var(--color-danger-50)' : 'var(--color-warning-50)',
                                                            border: item.risk_flag_rule.type === 'hard' ? '1px solid var(--color-danger-100)' : '1px solid var(--color-warning-200)',
                                                            borderRadius: '8px',
                                                            fontSize: '12px',
                                                            color: item.risk_flag_rule.type === 'hard' ? 'var(--color-danger-700)' : 'var(--color-warning-800)'
                                                        }}>
                                                            <AlertTriangle size={16} style={{
                                                                color: item.risk_flag_rule.type === 'hard' ? 'var(--color-danger-500)' : 'var(--color-warning-500)',
                                                                flexShrink: 0,
                                                                marginTop: '2px'
                                                            }} />
                                                            <div>
                                                                <strong style={{ color: item.risk_flag_rule.type === 'hard' ? 'var(--color-danger-900)' : 'var(--color-warning-900)' }}>
                                                                    {t("Condition d'alerte")} :
                                                                </strong>{' '}
                                                                Une réponse{' '}
                                                                <span style={{ fontWeight: '800', textDecoration: 'underline' }}>
                                                                    {item.risk_flag_rule.condition === 'no' ? 'NON' : 'OUI'}
                                                                </span>{' '}
                                                                déclenchera un statut d'alerte{' '}
                                                                <span style={{ fontWeight: '800' }}>
                                                                    {item.risk_flag_rule.type === 'hard' ? 'critique (Bloquant)' : 'vigilance (Modéré)'}
                                                                </span>
                                                                .
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-12)', color: 'var(--color-gray-400)' }}>
                            Configuration non trouvée.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: isMobile ? 'var(--spacing-4)' : 'var(--spacing-4) var(--spacing-8)',
                    background: 'var(--color-gray-50)',
                    borderTop: '1px solid var(--color-gray-100)',
                    display: 'flex',
                    flexDirection: isMobile ? 'column-reverse' : 'row',
                    justifyContent: 'space-between',
                    alignItems: isMobile ? 'stretch' : 'center',
                    gap: '12px'
                }}>
                    <span style={{ fontSize: '10px', color: 'var(--color-gray-400)', fontWeight: '600', textAlign: isMobile ? 'center' : 'left' }}>
                        * Les praticiens peuvent également ajouter des questions complémentaires.
                    </span>
                    <button
                        onClick={onClose}
                        className="btn btn-secondary"
                        style={{ padding: '10px 24px', borderRadius: '12px', fontWeight: '700' }}
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}
