import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, MessageSquare, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { validateToken } from '../services/tokenService';
import { saveResponse, markScreenCompleted } from '../services/pathwayService';
import logoSlMa from '../assets/logo-sl-ma.png';
import medecinImg from '../assets/medecin.png';
import phoneExempleImg from '../assets/phone-exemple.png';
import smsImg from '../assets/sms.png';
import cardMedicalImg from '../assets/card-medical.png';
import wppPhone from '../assets/wpp-phone.png';
import wppDesktop from '../assets/wpp-desktop.png';
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
            <div className="onboarding-page" style={{ background: `url(${isMobile ? wppPhone : wppDesktop}) center/cover fixed` }}>
                <div className="onboarding-overlay" />
                <div className="loading-container">Chargement...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="onboarding-page" style={{ background: `url(${isMobile ? wppPhone : wppDesktop}) center/cover fixed` }}>
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
            {/* Background identical to PatientPortal */}
            <div 
                className="bg-animate-zoom"
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${isMobile ? wppPhone : wppDesktop})`,
                    backgroundSize: 'cover',
                    backgroundPosition: isMobile ? 'center' : 'left center',
                    backgroundAttachment: 'fixed',
                    zIndex: 0
                }}
            />



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
                        height: '100%'
                    }}>
                        <div className="onboarding-logo-container" style={{ marginTop: '20px', marginBottom: '20px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                            <img src={logoSlMa} alt="SurgiLink" style={{ height: '70px', objectFit: 'contain' }} />
                        </div>
                        <div className="onboarding-text-container" style={{ 
                            marginBottom: 'auto', 
                            marginTop: '10px',
                            padding: '0 20px',
                            zIndex: 5
                        }}>
                            <h1 className="onboarding-title" style={{ 
                                fontSize: '2.2rem', 
                                fontWeight: '700', 
                                marginBottom: '12px', 
                                lineHeight: '1.1',
                                color: '#1f2937'
                            }}>
                                Bienvenue <span style={{ fontWeight: '400' }}>dans SurgiLink !</span>
                            </h1>
                            <p className="onboarding-subtitle" style={{ 
                                fontSize: '1.2rem', 
                                fontWeight: '500',
                                color: '#6b7280'
                            }}>
                                Votre assistant de suivi médical
                            </p>
                        </div>

                        <div className="onboarding-image-container" style={{ 
                            position: 'relative', 
                            width: '100%', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            marginTop: 'auto',
                            minHeight: '300px'
                        }}>
                            <img 
                                src={medecinImg} 
                                alt="Médecin" 
                                style={{ 
                                    width: '100%', 
                                    maxWidth: '420px',
                                    height: 'auto', 
                                    display: 'block',
                                    marginBottom: '-5px',
                                    filter: 'drop-shadow(0 -10px 30px rgba(0,0,0,0.15))'
                                }} 
                            />
                            
                            <button 
                                onClick={() => setStep(2)}
                                className="btn-primary"
                                style={{ 
                                    position: 'absolute',
                                    bottom: '30%', 
                                    width: '85%', 
                                    maxWidth: '280px',
                                    padding: '1.2rem',
                                    borderRadius: '50px',
                                    fontSize: '1.2rem',
                                    fontWeight: '800',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '12px',
                                    background: 'var(--color-purple-600)',
                                    border: 'none',
                                    color: 'white',
                                    boxShadow: '0 15px 40px rgba(124, 58, 237, 0.5)',
                                    zIndex: 20,
                                    cursor: 'pointer',
                                    letterSpacing: '0.02em'
                                }}
                            >
                                CONTINUER <ArrowRight size={24} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="step-container fadeIn" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div className="onboarding-header-card" style={{ 
                            borderRadius: '30px', 
                            overflow: 'hidden', 
                            height: '240px',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                            marginBottom: 'var(--spacing-6)'
                        }}>
                            <img src={cardMedicalImg} alt="SurgiLink Medical" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>

                        <div className="onboarding-info-container" style={{ color: '#4b5563', flex: 1 }}>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: 'var(--spacing-4)', display: 'flex', alignItems: 'center', gap: '8px', color: '#1f2937' }}>
                                Nous restons à vos côtés ! 😉
                            </h2>

                            <div className="info-badge" style={{ 
                                background: '#f9fafb', 
                                padding: '10px 20px', 
                                borderRadius: '15px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '12px',
                                marginBottom: 'var(--spacing-4)',
                                border: '1px solid #e5e7eb',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                            }}>
                                <img src={smsImg} alt="SMS" style={{ height: '32px' }} />
                                <span style={{ fontWeight: '600', color: '#374151' }}>Suivi SMS : Questionnaires</span>
                            </div>

                            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', opacity: 0.9, marginBottom: 'var(--spacing-6)' }}>
                                Vous recevrez des SMS avant votre opération, à chaque étape clé <strong>(J-7, J-2, etc.)</strong>, afin de vous accompagner sereinement jusqu’au jour J de votre opération.
                            </p>

                            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', opacity: 0.9, marginBottom: 'var(--spacing-6)' }}>
                                Il est essentiel de bien les consulter et de <strong>répondre au questionnaire via le lien qui vous sera envoyé dans le message</strong> : Cela ne vous prendra que quelques petites secondes :)
                            </p>

                            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', opacity: 0.9, marginBottom: 'var(--spacing-8)' }}>
                                Avec SurgiLink, vous êtes accompagné(e) à chaque étape <strong>avec clarté et sérénité et bienveillance !</strong>
                            </p>

                            <div className="timeline-container" style={{ position: 'relative', marginBottom: 'var(--spacing-10)' }}>
                                <div className="timeline-line" style={{ 
                                    position: 'absolute', 
                                    top: '30px', 
                                    left: '0', 
                                    right: '0', 
                                    height: '2px', 
                                    background: '#e5e7eb',
                                    zIndex: 0
                                }} />
                                <div className="timeline-items" style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1, padding: '0 5px' }}>
                                    {['J-7', 'J-2', 'J-1', 'J-J', 'J+1', 'J+2', 'J+7'].map((day) => (
                                        <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ 
                                                width: '24px', 
                                                height: '24px', 
                                                borderRadius: '50%', 
                                                background: '#ffffff',
                                                border: '2px solid #e5e7eb'
                                            }} />
                                            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>{day}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="onboarding-bottom-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
                                <div className="phone-preview" style={{ width: '100px' }}>
                                    <img src={phoneExempleImg} alt="App Preview" style={{ width: '100%', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' }} />
                                </div>

                                <button 
                                    onClick={handleComplete}
                                    style={{ 
                                        flex: 1,
                                        maxWidth: '220px',
                                        height: '60px', 
                                        borderRadius: '30px', 
                                        background: 'var(--color-purple-600)',
                                        border: 'none',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '12px',
                                        boxShadow: '0 10px 30px rgba(139, 92, 246, 0.6)',
                                        cursor: 'pointer',
                                        padding: '0 25px'
                                    }}
                                >
                                    <span style={{ fontWeight: '800', fontSize: '1.1rem', letterSpacing: '0.02em' }}>CONTINUER</span>
                                    <ArrowRight size={24} />
                                </button>
                            </div>
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
