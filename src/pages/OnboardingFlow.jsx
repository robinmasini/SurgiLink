import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, MessageSquare, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { validateToken } from '../services/tokenService';
import { saveResponse, markScreenCompleted } from '../services/pathwayService';
import logoSlMa from '../assets/logo-sl-ma.png';
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
                
                // If onboarding is already completed (DB or Local), skip to portal
                const storageKey = `onboarding_completed_${validation.patientId}`;
                const localOnboarded = localStorage.getItem(storageKey) === 'true';
                
                if (patientData.onboarding_completed_at || localOnboarded) {
                    console.log('-> Onboarding already done (DB or local), skipping');
                    navigate(`/patient-portal/${token}`);
                    return;
                }

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

            // Also mark Bienvenue step as complete to satisfy "up to date" logic
            await saveResponse(patient.id, 'Bienvenue', 'welcome_ok', true, true);
            await markScreenCompleted(patient.id, 'Bienvenue');

            console.log('-> Onboarding complete, navigating to portal');
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
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            overflowX: 'hidden',
            fontFamily: 'var(--font-family)'
        }}>




            <div className="onboarding-content" style={{ 
                position: 'relative', 
                zIndex: 2,
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: step === 1 ? '20px 0 0 0' : '20px 16px',
                maxWidth: '500px',
                margin: '0 auto',
                width: '100%'
            }}>
                              {step === 1 && (
                    <div className="step-container fadeIn" style={{ 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        textAlign: 'center',
                        justifyContent: 'space-between',
                        minHeight: isMobile ? 'calc(100vh - 40px)' : '650px',
                        paddingBottom: '24px'
                    }}>
                        <div className="onboarding-logo-container" style={{ marginTop: '20px', marginBottom: '16px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                            <img src={logoSlMa} alt="SurgiLink" style={{ height: isMobile ? '65px' : '100px', objectFit: 'contain', transition: 'height 0.3s ease' }} />
                        </div>
                        <div className="onboarding-text-container" style={{ 
                            marginBottom: '16px', 
                            padding: '0 20px',
                            zIndex: 5
                        }}>
                            <h1 className="onboarding-title" style={{ 
                                fontSize: isMobile ? '1.8rem' : '2.2rem', 
                                fontWeight: '700', 
                                marginBottom: '10px', 
                                lineHeight: '1.15',
                                color: '#1f2937'
                            }}>
                                Bienvenue <span style={{ fontWeight: '400' }}>dans SurgiLink !</span>
                            </h1>
                            <p className="onboarding-subtitle" style={{ 
                                fontSize: isMobile ? '1.05rem' : '1.2rem', 
                                fontWeight: '500',
                                color: '#6b7280'
                            }}>
                                Votre assistant de suivi médical
                            </p>
                        </div>

                        <div className="onboarding-image-container" style={{ 
                            width: '100%', 
                            display: 'flex', 
                            justifyContent: 'center',
                            alignItems: 'center',
                            flex: 1,
                            margin: '10px 0'
                        }}>
                            <img 
                                src={medecinImg} 
                                alt="Médecin" 
                                style={{ 
                                    width: '75%', 
                                    maxWidth: '280px',
                                    height: 'auto', 
                                    display: 'block',
                                    opacity: 0.85,
                                    filter: 'drop-shadow(0 -5px 15px rgba(0,0,0,0.06))',
                                    transition: 'all 0.3s ease'
                                }} 
                            />
                        </div>

                        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '16px 20px 0 20px', zIndex: 10 }}>
                            <button 
                                onClick={() => setStep(2)}
                                className="btn-primary"
                                style={{ 
                                    width: '100%', 
                                    maxWidth: '280px',
                                    height: '52px', 
                                    borderRadius: '30px',
                                    fontSize: '1.1rem',
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
                                CONTINUER <ArrowRight size={20} />
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
                        minHeight: isMobile ? 'calc(100vh - 40px)' : '650px',
                        paddingBottom: '24px'
                    }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px', width: '100%' }}>
                            <div className="onboarding-header-card" style={{ 
                                borderRadius: '30px', 
                                overflow: 'hidden', 
                                height: isMobile ? '140px' : '200px',
                                boxShadow: '0 15px 30px rgba(0,0,0,0.15)',
                                width: '100%'
                            }}>
                                <img src={cardMedicalImg} alt="SurgiLink Medical" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>

                            <div className="onboarding-info-container" style={{ color: '#4b5563', display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '16px' }}>
                                <h2 style={{ 
                                    fontSize: isMobile ? '1.25rem' : '1.4rem', 
                                    fontWeight: '700', 
                                    color: '#1f2937',
                                    lineHeight: 1.25,
                                    margin: 0
                                }}>
                                    Tout au long de votre opération, nous restons à vos côtés !
                                </h2>

                                <div className="info-badge" style={{ 
                                    background: '#f9fafb', 
                                    padding: '8px 16px', 
                                    borderRadius: '15px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '12px',
                                    border: '1px solid #e5e7eb',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                    alignSelf: 'flex-start'
                                }}>
                                    <img src={smsImg} alt="SMS" style={{ height: '26px' }} />
                                    <span style={{ fontWeight: '600', color: '#374151', fontSize: '14px' }}>Suivi SMS : Questionnaires</span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <p style={{ fontSize: '0.9rem', lineHeight: '1.5', opacity: 0.9, margin: 0 }}>
                                        SurgiLink est un assistant de suivi chirurgical qui va vous accompagner avant et après votre intervention.
                                    </p>

                                    <p style={{ fontSize: '0.9rem', lineHeight: '1.5', opacity: 0.9, margin: 0 }}>
                                        💬 Vous recevrez des SMS à chaque étape clé <strong>(J-7, J-2, etc.)</strong>, afin de vous accompagner sereinement.
                                    </p>

                                    <p style={{ fontSize: '0.9rem', lineHeight: '1.5', opacity: 0.9, margin: 0 }}>
                                        ⚠️ Il est essentiel de bien les consulter et de <strong>répondre au questionnaire via le lien qui vous sera envoyé dans le message</strong> : Cela ne vous prendra que quelques petites secondes !
                                    </p>

                                    <p style={{ fontSize: '0.9rem', lineHeight: '1.5', opacity: 0.9, margin: 0 }}>
                                        Avec nous, vous êtes accompagné(e) <strong>avec clarté et sérénité tout au long de votre parcours de soins !</strong>
                                    </p>
                                </div>

                                <div className="timeline-container" style={{ position: 'relative', marginTop: '8px' }}>
                                    <div className="timeline-line" style={{ 
                                        position: 'absolute', 
                                        top: isMobile ? '16px' : '22px', 
                                        left: '0', 
                                        right: '0', 
                                        height: '2px', 
                                        background: '#e5e7eb',
                                        zIndex: 0
                                    }} />
                                    <div className="timeline-items" style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1, padding: '0 5px' }}>
                                        {['J-7', 'J-2', 'J-1', 'J-J', 'J+1', 'J+2', 'J+7'].map((day) => (
                                            <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                <div style={{ 
                                                    width: isMobile ? '12px' : '18px', 
                                                    height: isMobile ? '12px' : '18px', 
                                                    borderRadius: '50%', 
                                                    background: '#ffffff',
                                                    border: '2px solid #e5e7eb'
                                                }} />
                                                <span style={{ fontSize: isMobile ? '0.65rem' : '0.75rem', fontWeight: '600', color: '#6b7280' }}>{day}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="onboarding-bottom-row" style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            width: '100%',
                            padding: '16px 20px 0 20px',
                            zIndex: 10
                        }}>
                            <button 
                                onClick={handleComplete}
                                style={{ 
                                    width: '100%',
                                    maxWidth: '280px',
                                    height: '52px', 
                                    borderRadius: '30px', 
                                    background: 'var(--color-purple-600)',
                                    border: 'none',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '12px',
                                    boxShadow: '0 10px 30px rgba(109, 140, 124, 0.4)',
                                    cursor: 'pointer',
                                    padding: '0 25px'
                                }}
                            >
                                <span style={{ fontWeight: '800', fontSize: '1.1rem', letterSpacing: '0.02em' }}>CONTINUER</span>
                                <ArrowRight size={20} />
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
