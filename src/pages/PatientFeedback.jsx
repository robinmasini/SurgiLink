import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LogOut,
    Sparkles,
    Star,
    Info
} from 'lucide-react';

export default function PatientFeedback() {
    const navigate = useNavigate();
    const [npsScore, setNpsScore] = useState(null);
    const [comment, setComment] = useState('');

    const handleSubmit = () => {
        navigate('/patient/success');
    };

    return (
        <div className="patient-view">
            {/* Header */}
            <div className="patient-header">
                <div className="patient-header-left">
                    <h2>Bonjour Marie</h2>
                    <span>J+2 • Chirurgie Pied</span>
                </div>
                <button
                    style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--color-gray-500)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px'
                    }}
                    onClick={() => navigate('/login')}
                >
                    <LogOut size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="patient-content fade-in">
                {/* Step Header */}
                <div className="step-section">
                    <div className="step-header" style={{
                        background: 'var(--color-warning-50)',
                        borderLeftColor: 'var(--color-warning-500)'
                    }}>
                        <Star size={18} style={{ color: 'var(--color-warning-500)' }} />
                        <div>
                            <div className="step-header-title" style={{ color: 'var(--color-warning-600)' }}>Votre Avis</div>
                            <div className="step-header-subtitle" style={{ color: 'var(--color-success-500)' }}>
                                Dernière étape ! Votre retour nous aide à nous améliorer.
                            </div>
                        </div>
                    </div>
                </div>

                {/* NPS Score */}
                <div className="question-card">
                    <div className="question-title">Recommanderiez-vous notre clinique ?</div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)' }}>Pas du tout</span>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)' }}>Tout à fait</span>
                    </div>

                    <div className="nps-scale">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                            <button
                                key={score}
                                className={`nps-btn ${npsScore === score ? 'active' : ''}`}
                                onClick={() => setNpsScore(score)}
                            >
                                {score}
                            </button>
                        ))}
                    </div>

                    <div className="info-box" style={{ marginTop: 'var(--spacing-4)' }}>
                        <Info size={16} className="info-box-icon" />
                        <div>
                            <div className="info-box-title">Pourquoi est-ce important ?</div>
                            <div className="info-box-text">Ce score (NPS) est un indicateur clé de la qualité de nos services.</div>
                        </div>
                    </div>
                </div>

                {/* Free Comment */}
                <div className="question-card">
                    <div className="question-title">Commentaire libre</div>
                    <textarea
                        className="input"
                        placeholder="Racontez-nous votre expérience..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                </div>

                {/* Submit Button */}
                <button
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%', marginTop: 'var(--spacing-6)' }}
                    onClick={handleSubmit}
                >
                    Envoyer mon avis
                </button>
            </div>

            {/* FAB */}
            <button className="fab">
                <Sparkles size={24} />
            </button>
        </div>
    );
}
