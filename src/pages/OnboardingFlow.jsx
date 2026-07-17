import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, MessageSquare, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { validateToken } from '../services/tokenService';
import { saveResponse, markScreenCompleted } from '../services/pathwayService';
import logoSurgilink from '../assets/logo_surgilink_premium_green.png';
import logoMA from '../assets/logo-medical-alliance.png';
import medecinImg from '../assets/medecin.png';
import smsImg from '../assets/sms.png';
import cardMedicalImg from '../assets/card-medical.png';
import wppPhone from '../assets/wpp-phone-v2.png';
import wppDesktop from '../assets/wpp-desktop-v2.png';
import checkpointImg from '../assets/checkpoint.png';

export default function OnboardingFlow() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [patient, setPatient] = useState(null);
    const [error, setError] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const validation = await validateToken(token);
                if (!validation.valid) {
                    setError(validation.error);
                    setLoading(false);
                    return;
                }

                const { data: patientData, error: patientError } = await supabase
                    .from('patients')
                    .select('*')
                    .eq('id', validation.patientId)
                    .single();

                if (patientError) throw patientError;
                
                // If onboarding is already completed (DB), skip to portal
                const storageKey = `onboarding_completed_${validation.patientId}`;
                
                if (patientData.onboarding_completed_at) {
                    console.log('-> Onboarding already done (DB), skipping');
                    navigate(`/patient-portal/${token}`);
                    return;
                }
                
                // If we get here, DB says it's not completed. We should clear local storage to fix any sync issues.
                localStorage.removeItem(storageKey);

                setPatient(patientData);
            } catch (err) {
                console.error('Onboarding check error:', err);
                setError('Erreur lors de la vérification');
            } finally {
                setLoading(false);
            }
        };

        checkStatus();
    }, [token, navigate]);

    const handleComplete = async () => {
        try {
            // Set local storage as fallback
            localStorage.setItem(`onboarding_completed_${patient.id}`, 'true');

            // Update patient to mark onboarding as completed in DB
            const { error: updateError } = await supabase
                .from('patients')
                .update({ onboarding_completed_at: new Date().toISOString() })
                .eq('id', patient.id);

            if (updateError) {
                console.warn('Could not update onboarding status (column may not exist yet):', updateError);
            }

            console.log('-> Onboarding complete, navigating to Portal');
            navigate(`/patient-portal/${token}`);
        } catch (err) {
            console.error('Error completing onboarding:', err);
            navigate(`/patient-portal/${token}`);
        }
    };

    if (loading) {
        return (
            <div className="onboarding-page" style={{ background: 'white' }}>
                <div className="onboarding-overlay" />
                <div className="loading-container">Chargement...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="onboarding-page" style={{ background: 'white' }}>
                <div className="onboarding-overlay" />
                <div className="login-card" style={{ textAlign: 'center' }}>
                    <h2>Accès non autorisé</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="onboarding-page" style={{ 
            position: 'relative',
            height: isMobile ? '100dvh' : 'auto',
            minHeight: isMobile ? 'none' : '100vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'var(--font-family)'
        }}>




            <div className="onboarding-content" style={{ 
                position: 'relative', 
                zIndex: 2,
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: isMobile ? '12px 16px' : '20px 16px',
                maxWidth: '500px',
                margin: '0 auto',
                width: '100%',
                height: '100%',
                boxSizing: 'border-box'
            }}>
                
                              {step === 1 && (
                    <div className="step-container fadeIn" style={{ 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        textAlign: 'center',
                        justifyContent: 'space-between',
                        height: '100%',
                        paddingBottom: isMobile ? '8px' : '24px',
                        position: 'relative'
                    }}>
                        {/* Grouped Logos and Text to center them nicely on the page */}
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            width: '100%',
                            marginTop: isMobile ? '8px' : '24px',
                            zIndex: 5
                        }}>
                            <div className="onboarding-logo-container" style={{ 
                                width: '100%', 
                                display: 'flex', 
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: isMobile ? '12px' : '16px'
                            }}>
                                <img 
                                    src={logoSurgilink} 
                                    alt="SurgiLink" 
                                    style={{ 
                                        height: isMobile ? '80px' : '88px',
                                        width: isMobile ? '78px' : '85px',
                                        objectFit: 'contain', 
                                        transition: 'all 0.3s ease' 
                                    }} 
                                />
                                <div style={{ width: '1px', height: isMobile ? '30px' : '38px', background: '#D1D5DB' }} />
                                <img 
                                    src={logoMA} 
                                    alt="Medical Alliance" 
                                    style={{ 
                                        height: isMobile ? '80px' : '88px',
                                        width: isMobile ? '122px' : '135px',
                                        objectFit: 'contain', 
                                        transition: 'all 0.3s ease'
                                    }} 
                                />
                            </div>
                            <div className="onboarding-text-container" style={{ 
                                marginTop: isMobile ? '52px' : '38px',
                                marginBottom: isMobile ? '8px' : '14px', 
                                padding: '0 20px',
                                zIndex: 5
                            }}>
                                <h1 className="onboarding-title" style={{ 
                                    fontSize: isMobile ? '1.4rem' : '1.85rem', 
                                    fontWeight: '700', 
                                    marginBottom: '6px', 
                                    lineHeight: '1.2',
                                    color: '#1f2937'
                                }}>
                                    Bienvenue <span style={{ fontWeight: '400' }}>dans SurgiLink !</span>
                                </h1>
                                <p className="onboarding-subtitle" style={{ 
                                    fontSize: isMobile ? '0.85rem' : '1.0rem', 
                                    fontWeight: '500',
                                    color: '#6b7280'
                                }}>
                                    Votre assistant de suivi médical personnalisé
                                </p>
                            </div>
                        </div>

                        {/* Nurse image standing exactly at the top of the CTA button (height 50px + bottom spacing) */}
                        <img 
                            src={medecinImg} 
                            alt="Médecin" 
                            style={{ 
                                position: 'absolute',
                                bottom: isMobile ? '58px' : '74px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                zIndex: 1,
                                maxHeight: isMobile ? '380px' : '480px',
                                width: 'auto', 
                                maxWidth: isMobile ? '400px' : '550px',
                                height: 'auto',
                                display: 'block',
                                opacity: 0.8,
                                filter: 'drop-shadow(0 -5px 15px rgba(0,0,0,0.06))',
                                transition: 'all 0.3s ease',
                                pointerEvents: 'none'
                            }} 
                        />

                        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '12px 20px 0 20px', zIndex: 10, flexShrink: 0 }}>
                            <button 
                                onClick={() => setStep(2)}
                                className="btn-primary"
                                style={{ 
                                    width: '100%', 
                                    maxWidth: '280px',
                                    height: '50px', 
                                    borderRadius: '30px',
                                    fontSize: '1.05rem',
                                    fontWeight: '800',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '12px',
                                    background: 'var(--color-purple-600)',
                                    border: 'none',
                                    color: 'white',
                                    boxShadow: '0 10px 30px rgba(109, 140, 124, 0.3)',
                                    cursor: 'pointer',
                                    letterSpacing: '0.02em'
                                }}
                            >
                                CONTINUER
                            </button>
                        </div>
                    </div>
                )}

                 {step === 2 && (
                    <div className="step-container fadeIn" style={{ 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'space-between',
                        height: '100%',
                        paddingBottom: isMobile ? '8px' : '24px'
                    }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: isMobile ? '18px' : '26px', width: '100%', minHeight: 0 }}>
                            <div className="onboarding-header-card" style={{ 
                                borderRadius: '30px', 
                                overflow: 'hidden', 
                                height: isMobile ? '120px' : '180px',
                                boxShadow: '0 15px 30px rgba(0,0,0,0.12)',
                                width: '100%',
                                flexShrink: 0
                            }}>
                                <img 
                                    src={cardMedicalImg} 
                                    alt="SurgiLink Medical" 
                                    style={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        objectFit: 'cover',
                                        objectPosition: 'center bottom'
                                    }} 
                                />
                            </div>

                            <div className="onboarding-info-container" style={{ 
                                color: '#4b5563', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: isMobile ? '16px' : '20px',
                                flex: 1,
                                overflowY: 'auto',
                                paddingRight: '4px'
                            }}>
                                <h2 style={{ 
                                    fontSize: isMobile ? '1.15rem' : '1.35rem', 
                                    fontWeight: '700', 
                                    color: '#1f2937',
                                    lineHeight: 1.25,
                                    margin: 0
                                }}>
                                    Tout au long de votre opération, nous restons à vos côtés !
                                </h2>

                                <div className="info-badge" style={{ 
                                    background: '#f9fafb', 
                                    padding: '6px 12px', 
                                    borderRadius: '12px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '10px',
                                    border: '1px solid #e5e7eb',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                    alignSelf: 'flex-start'
                                }}>
                                    <img src={smsImg} alt="SMS" style={{ height: '22px' }} />
                                    <span style={{ fontWeight: '600', color: '#374151', fontSize: '13px' }}>Suivi SMS : Questionnaires</span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '22px', padding: isMobile ? '0 4px' : '0 8px' }}>
                                    <p style={{ fontSize: '0.85rem', lineHeight: '1.45', opacity: 0.9, margin: 0 }}>
                                        SurgiLink est un assistant de suivi chirurgical qui va vous accompagner avant et après votre intervention.
                                    </p>

                                    <p style={{ fontSize: '0.85rem', lineHeight: '1.45', opacity: 0.9, margin: 0 }}>
                                        💬 Vous recevrez des SMS à chaque étape clé <strong>(J-18, J-7, J-1, etc.)</strong>, afin de vous accompagner sereinement.
                                    </p>

                                    <p style={{ fontSize: '0.85rem', lineHeight: '1.45', opacity: 0.9, margin: 0 }}>
                                        ⚠️ Il est essentiel de bien les consulter et de <strong>répondre au questionnaire via le lien qui vous sera envoyé dans le message</strong> : Cela ne vous prendra que quelques petites secondes !
                                    </p>

                                    <p style={{ fontSize: '0.85rem', lineHeight: '1.45', opacity: 0.9, margin: 0 }}>
                                        Avec nous, vous êtes accompagné(e) <strong>avec clarté et sérénité tout au long de votre parcours de soins !</strong>
                                    </p>
                                </div>

                                <div className="timeline-container" style={{ position: 'relative', marginTop: '6px', marginBottom: '4px' }}>
                                    <div className="timeline-line" style={{ 
                                        position: 'absolute', 
                                        top: isMobile ? '12px' : '18px', 
                                        left: '0', 
                                        right: '0', 
                                        height: '2px', 
                                        background: '#e5e7eb',
                                        zIndex: 0
                                    }} />
                                    <div className="timeline-items" style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1, padding: '0 5px' }}>
                                        {['J-18', 'J-7', 'J-1', 'J+1', 'J+4', 'ESATIS'].map((day) => (
                                            <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                                <div style={{ 
                                                    width: isMobile ? '10px' : '16px', 
                                                    height: isMobile ? '10px' : '16px', 
                                                    borderRadius: '50%', 
                                                    background: '#ffffff',
                                                    border: '2px solid #e5e7eb'
                                                }} />
                                                <span style={{ fontSize: '0.6rem', fontWeight: '600', color: '#6b7280' }}>{day}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '12px 20px 0 20px', zIndex: 10, flexShrink: 0 }}>
                            <button 
                                onClick={handleComplete}
                                className="btn-primary"
                                style={{ 
                                    width: '100%', 
                                    maxWidth: '280px',
                                    height: '50px', 
                                    borderRadius: '30px',
                                    fontSize: '1.05rem',
                                    fontWeight: '800',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '12px',
                                    background: 'var(--color-purple-600)',
                                    border: 'none',
                                    color: 'white',
                                    boxShadow: '0 10px 30px rgba(109, 140, 124, 0.3)',
                                    cursor: 'pointer',
                                    letterSpacing: '0.02em'
                                }}
                            >
                                CONTINUER <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
        </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .onboarding-title, .onboarding-info-container h2, .onboarding-subtitle, .onboarding-info-container p, .onboarding-info-container span { 
                    font-family: var(--font-family) !important; 
                }
                .fadeIn {
                    animation: fadeIn 0.7s ease-out forwards;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}} />
        </div>
    );
}
