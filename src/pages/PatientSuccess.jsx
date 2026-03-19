import { Link, useParams } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Trophy, Sparkles, Loader } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePatientId } from '../hooks/usePatientId';
import { supabase } from '../lib/supabase';

export default function PatientSuccess() {
    const { token } = useParams();
    const { patientId, loading: loadingId } = usePatientId();
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (patientId) {
            loadProgress();
        }
    }, [patientId]);

    const loadProgress = async () => {
        try {
            const { data, error } = await supabase
                .from('patients')
                .select('progress')
                .eq('id', patientId)
                .single();
            if (!error && data) {
                setProgress(data.progress || 0);
            }
        } catch (err) {
            console.error('Error loading progress:', err);
        } finally {
            setLoading(false);
        }
    };

    const isComplete = progress === 100;

    if (loadingId || (patientId && loading)) {
        return (
            <div className="success-page">
                <Loader className="animate-spin" size={48} style={{ color: 'var(--color-primary-500)' }} />
            </div>
        );
    }

    return (
        <div className="success-page" style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Festive Animation Layers */}
            {isComplete && (
                <>
                    <div className="confetti-container">
                        {[...Array(20)].map((_, i) => (
                            <div key={i} className={`confetti-piece p${i + 1}`}></div>
                        ))}
                    </div>
                    <div style={{ position: 'absolute', top: '10%', left: '10%', animation: 'float 3s ease-in-out infinite' }}>
                        <Sparkles size={32} color="#FFD700" />
                    </div>
                    <div style={{ position: 'absolute', top: '15%', right: '15%', animation: 'float 4s ease-in-out infinite' }}>
                        <Sparkles size={24} color="#FFD700" />
                    </div>
                    <div style={{ position: 'absolute', bottom: '20%', left: '15%', animation: 'float 5s ease-in-out infinite' }}>
                        <Sparkles size={28} color="#FFD700" />
                    </div>
                </>
            )}

            <div className="success-card fade-in" style={{ zIndex: 2, position: 'relative' }}>
                <div className={`success-icon ${isComplete ? 'celebrate' : ''}`} style={{ margin: '0 auto var(--spacing-6)' }}>
                    {isComplete ? <Trophy size={40} color="var(--color-primary-600)" /> : <CheckCircle size={40} />}
                </div>

                <h1 className="success-title">
                    {isComplete ? "Félicitations !" : "Bien reçu !"}
                </h1>

                <p className="success-message">
                    {isComplete
                        ? "Vous avez complété l'intégralité de votre suivi de soins. Félicitations pour votre assiduité !"
                        : "Vos informations ont été transmises avec succès à l'équipe médicale."}
                </p>

                {isComplete && (
                    <div style={{
                        background: 'var(--color-primary-50)',
                        padding: 'var(--spacing-4)',
                        borderRadius: '16px',
                        marginBottom: 'var(--spacing-8)',
                        border: '1px solid var(--color-primary-100)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--color-primary-700)', fontWeight: 'bold' }}>
                            <Trophy size={20} />
                            <span>Parcours complété à 100%</span>
                        </div>
                    </div>
                )}

                {!isComplete && (
                    <p style={{ color: 'var(--color-gray-500)', fontSize: '14px', marginBottom: 'var(--spacing-8)' }}>
                        Vous pouvez encore modifier vos réponses ou consulter votre dossier via votre portail.
                    </p>
                )}

                {token && (
                    <Link
                        to={`/patient-portal/${token}`}
                        className="btn btn-primary"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '14px 28px',
                            borderRadius: '14px',
                            fontWeight: '700',
                            marginBottom: 'var(--spacing-8)'
                        }}
                    >
                        <ArrowLeft size={18} />
                        Retour à mon portail
                    </Link>
                )}

                <div style={{ color: 'var(--color-gray-400)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-4)' }}>
                    SurgiLink • Votre partenaire santé
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0); }
                    50% { transform: translateY(-20px) rotate(10deg); }
                }
                .celebrate {
                    animation: celebratePulse 1s ease infinite;
                    background: #FFF8E1 !important;
                    border: 2px solid #FFD700;
                }
                @keyframes celebratePulse {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); }
                    70% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(255, 215, 0, 0); }
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
                ${[...Array(20)].map((_, i) => `
                    .confetti-piece.p${i + 1} {
                        left: ${i * 5}%;
                        background: ${['#f2d74e', '#95c3de', '#ff9a91', '#f2d74e', '#a2cc85'][i % 5]};
                        animation: confettiFall ${3 + Math.random() * 2}s linear infinite;
                        animation-delay: ${Math.random() * 5}s;
                    }
                `).join('\n')}
                @keyframes confettiFall {
                    0% { transform: translateY(0) rotate(0); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
                .success-card {
                    background: rgba(255, 255, 255, 0.8);
                    backdrop-filter: blur(10px);
                    padding: 40px;
                    border-radius: 32px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.05);
                    max-width: 480px;
                    width: 90%;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                }
            `}} />
        </div>
    );
}

