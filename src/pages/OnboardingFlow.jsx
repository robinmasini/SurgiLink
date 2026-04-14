import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, MessageSquare, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { validateToken } from '../services/tokenService';
import logoSlMa from '../assets/logo-sl-ma.png';
import medecinImg from '../assets/medecin.png';
import phoneExempleImg from '../assets/phone-exemple.png';
import smsImg from '../assets/sms.png';
import cardMedicalImg from '../assets/card-medical.png';
import wppPhone from '../assets/wpp-phone.png';
import checkpointImg from '../assets/checkpoint.png';

export default function OnboardingFlow() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [patient, setPatient] = useState(null);
    const [error, setError] = useState(null);

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

            console.log('-> Onboarding complete, navigating to portal');
            navigate(`/patient-portal/${token}`);
        } catch (err) {
            console.error('Error completing onboarding:', err);
            navigate(`/patient-portal/${token}`);
        }
    };

    if (loading) {
        return (
            <div className="onboarding-page" style={{ background: `url(${wppPhone}) center/cover fixed` }}>
                <div className="onboarding-overlay" />
                <div className="loading-container">Chargement...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="onboarding-page" style={{ background: `url(${wppPhone}) center/cover fixed` }}>
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
                    backgroundImage: `url(${wppPhone})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed',
                    zIndex: -1,
                    scale: 1.2
                }}
            />

            <div className="onboarding-overlay" style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(10, 15, 30, 0.4)',
                backdropFilter: 'blur(5px)',
                zIndex: 0
            }} />

            <div className="onboarding-content" style={{ 
                position: 'relative', 
                zIndex: 2,
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: '20px 16px',
                maxWidth: '500px',
                margin: '0 auto',
                width: '100%'
            }}>
                
                {step === 1 && (
                    <div className="step-container fadeIn" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <div className="onboarding-logo-container" style={{ marginTop: '10px', marginBottom: '32px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                            <img src={logoSlMa} alt="SurgiLink" style={{ height: '80px', objectFit: 'contain' }} />
                        </div>

                        <div className="onboarding-text-container" style={{ color: 'white', marginBottom: 'var(--spacing-8)' }}>
                            <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: 'var(--spacing-2)' }}>
                                Bienvenue <span style={{ fontWeight: '400' }}>dans SurgiLink !</span>
                            </h1>
                            <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
                                Votre assistant de suivi médical
                            </p>
                        </div>

                        <div className="onboarding-image-container" style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%', maxWidth: '400px' }}>
                            <img 
                                src={medecinImg} 
                                alt="Médecin" 
                                style={{ 
                                    width: '100%', 
                                    height: 'auto', 
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 20px 50px rgba(0,0,0,0.5))'
                                }} 
                            />
                        </div>

                        <button 
                            onClick={() => setStep(2)}
                            className="btn-primary"
                            style={{ 
                                width: '100%', 
                                maxWidth: '300px',
                                padding: '1.2rem',
                                borderRadius: '20px',
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                marginTop: 'var(--spacing-8)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                background: 'var(--color-purple-600)',
                                border: 'none',
                                color: 'white',
                                boxShadow: '0 10px 30px rgba(139, 92, 246, 0.4)'
                            }}
                        >
                            CONTINUER
                        </button>
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

                        <div className="onboarding-info-container" style={{ color: 'white', flex: 1 }}>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: 'var(--spacing-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                Nous restons à vos côtés ! 😉
                            </h2>

                            <div className="info-badge" style={{ 
                                background: 'rgba(255, 255, 255, 0.1)', 
                                padding: '12px 20px', 
                                borderRadius: '15px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '12px',
                                marginBottom: 'var(--spacing-4)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                backdropFilter: 'blur(10px)'
                            }}>
                                <img src={checkpointImg} alt="Checkpoint" style={{ width: '24px', height: '24px' }} />
                                <span style={{ fontWeight: '600' }}>Suivi SMS : Questionnaires</span>
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
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    zIndex: 0
                                }} />
                                <div className="timeline-items" style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1, padding: '0 5px' }}>
                                    {['J-7', 'J-2', 'J-1', 'J-J', 'J+1', 'J+2', 'J+7'].map((day, ix) => (
                                        <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                            {ix === 0 ? (
                                                <img src={checkpointImg} alt="active" style={{ width: '24px', height: '24px' }} />
                                            ) : (
                                                <div style={{ 
                                                    width: '24px', 
                                                    height: '24px', 
                                                    borderRadius: '50%', 
                                                    background: 'rgba(255, 255, 255, 0.2)',
                                                    border: '1px solid rgba(255, 255, 255, 0.4)'
                                                }} />
                                            )}
                                            <span style={{ fontSize: '0.75rem', fontWeight: '600', opacity: ix === 0 ? 1 : 0.6 }}>{day}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="onboarding-bottom-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div className="phone-preview" style={{ width: '120px' }}>
                                    <img src={phoneExempleImg} alt="App Preview" style={{ width: '100%', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' }} />
                                </div>

                                <button 
                                    onClick={handleComplete}
                                    style={{ 
                                        width: '70px', 
                                        height: '70px', 
                                        borderRadius: '35px', 
                                        background: 'var(--color-purple-600)',
                                        border: 'none',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 10px 30px rgba(139, 92, 246, 0.6)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <ArrowRight size={32} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .fadeIn {
                    animation: fadeIn 0.5s ease forwards;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}} />
        </div>
    );
}
