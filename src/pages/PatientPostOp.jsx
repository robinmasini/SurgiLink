import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LogOut,
    Sparkles,
    Heart,
    Thermometer,
    Activity,
    Info
} from 'lucide-react';

export default function PatientPostOp() {
    const navigate = useNavigate();
    const [painLevel, setPainLevel] = useState(2);
    const [temperature, setTemperature] = useState(null);
    const [pansement, setPansement] = useState(null);
    const [nausees, setNausees] = useState(null);
    const [urine, setUrine] = useState(null);
    const [geneThoracique, setGeneThoracique] = useState(null);

    const handleSubmit = () => {
        navigate('/patient/feedback');
    };

    const getPainColor = (level) => {
        if (level <= 3) return 'var(--color-success-500)';
        if (level <= 6) return 'var(--color-warning-500)';
        return 'var(--color-danger-500)';
    };

    return (
        <div className="patient-view">
            {/* Header */}
            <div className="patient-header">
                <div className="patient-header-left">
                    <h2>Bonjour Paul</h2>
                    <span>J+1 • Ligamentoplastie Genou</span>
                </div>
                <button style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-gray-500)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px'
                }}>
                    <LogOut size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="patient-content fade-in">
                {/* Pain Scale */}
                <div className="question-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                            <Heart size={18} style={{ color: 'var(--color-danger-400)' }} />
                            <span className="question-title" style={{ marginBottom: 0 }}>Votre douleur</span>
                        </div>
                        <div
                            className="pain-value"
                            style={{ background: getPainColor(painLevel) }}
                        >
                            {painLevel}/10
                        </div>
                    </div>

                    <input
                        type="range"
                        min="0"
                        max="10"
                        value={painLevel}
                        onChange={(e) => setPainLevel(parseInt(e.target.value))}
                        className="pain-slider"
                        style={{ width: '100%' }}
                    />

                    <div className="info-box" style={{ marginTop: 'var(--spacing-4)' }}>
                        <Info size={16} className="info-box-icon" />
                        <div>
                            <div className="info-box-title">Pourquoi est-ce important ?</div>
                            <div className="info-box-text">Une bonne gestion de la douleur accélère votre rétablissement.</div>
                        </div>
                    </div>
                </div>

                {/* Température et Pansement */}
                <div className="grid-2" style={{ gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)' }}>
                    <div className="question-card" style={{ marginBottom: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-3)' }}>
                            <Thermometer size={16} style={{ color: 'var(--color-warning-500)' }} />
                            <span style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-sm)' }}>Température</span>
                        </div>
                        <div className="compact-toggle">
                            <button
                                className={`compact-toggle-btn ${temperature === true ? 'active-success' : ''}`}
                                onClick={() => setTemperature(true)}
                            >
                                OUI
                            </button>
                            <button
                                className={`compact-toggle-btn ${temperature === false ? 'active-danger' : ''}`}
                                onClick={() => setTemperature(false)}
                            >
                                NON
                            </button>
                        </div>
                    </div>

                    <div className="question-card" style={{ marginBottom: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-3)' }}>
                            <Activity size={16} style={{ color: 'var(--color-primary-500)' }} />
                            <span style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-sm)' }}>Pansement</span>
                        </div>
                        <div className="compact-toggle">
                            <button
                                className={`compact-toggle-btn ${pansement === true ? 'active-success' : ''}`}
                                onClick={() => setPansement(true)}
                            >
                                OUI
                            </button>
                            <button
                                className={`compact-toggle-btn ${pansement === false ? 'active-danger' : ''}`}
                                onClick={() => setPansement(false)}
                            >
                                NON
                            </button>
                        </div>
                    </div>
                </div>

                {/* Récupération générale */}
                <div className="question-card">
                    <h4 style={{ marginBottom: 'var(--spacing-5)' }}>Récupération générale</h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--color-gray-700)' }}>Nausées ?</span>
                            <div className="compact-toggle">
                                <button
                                    className={`compact-toggle-btn ${nausees === true ? 'active-success' : ''}`}
                                    onClick={() => setNausees(true)}
                                    style={{ minWidth: '50px' }}
                                >
                                    Oui
                                </button>
                                <button
                                    className={`compact-toggle-btn ${nausees === false ? 'active-danger' : ''}`}
                                    onClick={() => setNausees(false)}
                                    style={{ minWidth: '50px' }}
                                >
                                    Non
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--color-gray-700)' }}>Urine OK ?</span>
                            <div className="compact-toggle">
                                <button
                                    className={`compact-toggle-btn ${urine === true ? 'active-success' : ''}`}
                                    onClick={() => setUrine(true)}
                                    style={{ minWidth: '50px' }}
                                >
                                    Oui
                                </button>
                                <button
                                    className={`compact-toggle-btn ${urine === false ? 'active-danger' : ''}`}
                                    onClick={() => setUrine(false)}
                                    style={{ minWidth: '50px' }}
                                >
                                    Non
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                                <span style={{ opacity: 0.5 }}>⚠️</span>
                                <span style={{ color: 'var(--color-gray-700)' }}>Gêne thoracique ?</span>
                            </div>
                            <div className="compact-toggle">
                                <button
                                    className={`compact-toggle-btn ${geneThoracique === true ? 'active-success' : ''}`}
                                    onClick={() => setGeneThoracique(true)}
                                    style={{ minWidth: '50px' }}
                                >
                                    Oui
                                </button>
                                <button
                                    className={`compact-toggle-btn ${geneThoracique === false ? 'active-danger' : ''}`}
                                    onClick={() => setGeneThoracique(false)}
                                    style={{ minWidth: '50px' }}
                                >
                                    Non
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%', marginTop: 'var(--spacing-6)' }}
                    onClick={handleSubmit}
                >
                    Continuer
                </button>
            </div>

            {/* FAB */}
            <button className="fab">
                <Sparkles size={24} />
            </button>
        </div>
    );
}
