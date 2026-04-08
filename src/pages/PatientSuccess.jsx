import { Link, useParams } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Trophy, Sparkles, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePatientId } from '../hooks/usePatientId';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

export default function PatientSuccess({ patient: propPatient }) {
    const { t } = useTranslation();
    const { token } = useParams();
    const { patientId: hookPatientId, loading: loadingId } = usePatientId();
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);

    const resolvedPatientId = propPatient?.id || hookPatientId;

    useEffect(() => {
        if (resolvedPatientId) {
            loadProgress();
        }
    }, [resolvedPatientId]);

    const loadProgress = async () => {
        try {
            console.log('Loading progress for patient:', resolvedPatientId);
            const { data, error } = await supabase
                .from('patients')
                .select('progress, status')
                .eq('id', resolvedPatientId)
                .single();

            if (error) throw error;
            if (data) {
                console.log('Progress data:', data);
                setProgress(data.progress || 0);
            }
        } catch (err) {
            console.error('Error loading progress:', err);
        } finally {
            setLoading(false);
        }
    };

    const isComplete = progress >= 99; // Allow 99% as complete to be generous with rounding

    const isLoadingPatientId = !propPatient && loadingId;

    if (isLoadingPatientId || (resolvedPatientId && loading)) {
        return (
            <div className="success-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <Loader2 className="animate-spin" size={48} style={{ color: 'var(--color-primary-500)' }} />
                <p style={{ marginTop: '16px', color: 'var(--color-gray-500)', fontWeight: '600' }}>{t('Calcul de votre progression...')}</p>
            </div>
        );
    }

    return (
        <div className="success-page" style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Festive Animation Layers */}
            {isComplete && (
                <>
                    <div className="confetti-container">
                        {[...Array(30)].map((_, i) => (
                            <div key={i} className={`confetti-piece p${i + 1}`}></div>
                        ))}
                    </div>
                </>
            )}

            <div className="success-card fade-in" style={{ zIndex: 10, position: 'relative' }}>
                <div className={`success-icon ${isComplete ? 'celebrate' : ''}`} style={{ margin: '0 auto var(--spacing-6)' }}>
                    {isComplete ? <Trophy size={44} color="#D4AF37" /> : <CheckCircle size={40} />}
                </div>

                <h1 className="success-title">
                    {isComplete ? t("Félicitations !") : t("Bien reçu !")}
                </h1>

                <p className="success-message">
                    {isComplete
                        ? t("Vous avez atteint 100% de votre suivi de soins. Un grand merci pour votre assiduité tout au long de ce parcours !")
                        : t("Vos informations ont été transmises avec succès à l'équipe médicale.")}
                </p>

                {/* Progress Feedback if not complete */}
                {!isComplete && progress !== null && progress > 0 && (
                    <div style={{ marginBottom: 'var(--spacing-8)', width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--color-gray-500)', marginBottom: '8px' }}>
                            <span style={{ fontWeight: '600' }}>{t('Progression globale')}</span>
                            <span style={{ fontWeight: '700', color: 'var(--color-primary-600)' }}>{progress}%</span>
                        </div>
                        <div style={{ height: '10px', background: 'var(--color-gray-100)', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--color-gray-200)' }}>
                            <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--color-primary-400), var(--color-primary-600))', borderRadius: '20px', transition: 'width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}></div>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--color-gray-400)', marginTop: '12px', lineHeight: '1.4' }}>
                            {t("Il vous reste quelques étapes pour finaliser votre dossier et recevoir votre attestation de fin de parcours.")}
                        </p>
                    </div>
                )}

                {isComplete && (
                    <div style={{
                        background: '#FFF8E1',
                        padding: '12px 20px',
                        borderRadius: '12px',
                        marginBottom: 'var(--spacing-8)',
                        border: '1px solid #FFD700',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#B8860B',
                        fontWeight: '800',
                        fontSize: '14px',
                        boxShadow: '0 4px 6px rgba(212, 175, 55, 0.1)'
                    }}>
                        <Trophy size={18} />
                        <span>{t('PARCOURS 100% COMPLÉTÉ')}</span>
                    </div>
                )}

                {token && (
                    <Link
                        to={`/patient-portal/${token}`}
                        className="btn btn-primary"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '16px 32px',
                            borderRadius: '16px',
                            fontWeight: '800',
                            fontSize: '16px',
                            width: '100%',
                            justifyContent: 'center',
                            marginBottom: 'var(--spacing-6)',
                            boxShadow: '0 10px 15px -3px rgba(var(--color-primary-rgb), 0.3)'
                        }}
                    >
                        <ArrowLeft size={18} />
                        {t('Retour au portail')}
                    </Link>
                )}

                <div style={{ color: 'var(--color-gray-400)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-4)' }}>
                    SurgiLink • {t('Votre partenaire santé')}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0); }
                    50% { transform: translateY(-20px) rotate(10deg); }
                }
                .celebration-sparkles {
                    position: absolute;
                    top: 0; left: 0; width: 100%; height: 100%;
                    pointer-events: none;
                }
                .sparkle-1 { position: absolute; top: 10%; left: 10%; animation: float 3s ease-in-out infinite; }
                .sparkle-2 { position: absolute; top: 15%; right: 15%; animation: float 4s ease-in-out infinite; }
                .sparkle-3 { position: absolute; bottom: 20%; left: 15%; animation: float 5s ease-in-out infinite; }
                
                .celebrate {
                    animation: celebratePulse 1s ease infinite;
                    background: #FFF8E1 !important;
                    border: 2px solid #FFD700;
                    padding: 20px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100px;
                    height: 100px;
                }
                @keyframes celebratePulse {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); }
                    70% { transform: scale(1.1); box-shadow: 0 0 0 20px rgba(255, 215, 0, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
                }
                .confetti-container {
                    position: absolute;
                    top: 0; left: 0; width: 100%; height: 100%;
                    pointer-events: none;
                }
                .confetti-piece {
                    position: absolute;
                    width: 10px; height: 10px;
                    background: #ffd700;
                    top: -10px;
                    opacity: 0;
                }
                ${[...Array(30)].map((_, i) => `
                    .confetti-piece.p${i + 1} {
                        left: ${Math.random() * 100}%;
                        background: ${['#f2d74e', '#95c3de', '#ff9a91', '#f2d74e', '#a2cc85'][i % 5]};
                        animation: confettiFall ${3 + Math.random() * 3}s linear infinite;
                        animation-delay: ${Math.random() * 5}s;
                    }
                `).join('\n')}
                @keyframes confettiFall {
                    0% { transform: translateY(0) rotate(0); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
                .success-card {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(10px);
                    padding: 48px 40px;
                    border-radius: 40px;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.1);
                    max-width: 500px;
                    width: 90%;
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
            `}} />
        </div>
    );
}

