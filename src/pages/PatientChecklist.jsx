import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    LogOut,
    Clock,
    Check,
    Info,
    Scissors,
    AlertTriangle,
    User
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

export default function PatientChecklist() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { patientId } = useParams();
    const [patient, setPatient] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [jeune, setJeune] = useState(false);
    const [douche, setDouche] = useState(null);
    const [epilation, setEpilation] = useState(null);
    const [anesthesie, setAnesthesie] = useState(null);
    const [bilanSanguin, setBilanSanguin] = useState(null);
    const [allergie, setAllergie] = useState(null);
    const [accompagnant, setAccompagnant] = useState(null);

    // Load patient data
    useEffect(() => {
        const loadPatient = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('patients')
                    .select('*')
                    .eq('id', patientId)
                    .single();

                if (error) throw error;
                setPatient(data);
            } catch (err) {
                console.error('Error loading patient:', err);
            } finally {
                setIsLoading(false);
            }
        };

        if (patientId) {
            loadPatient();
        }
    }, [patientId]);

    const handleSubmit = () => {
        navigate(`/patient/${patientId}/success`);
    };

    if (isLoading) {
        return (
            <div className="patient-view" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto var(--spacing-4)' }}></div>
                    <p>{t('Chargement...')}</p>
                </div>
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="patient-view" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <div style={{ textAlign: 'center', color: 'var(--color-gray-500)' }}>
                    <p>{t('Patient introuvable')}</p>
                    <button className="btn btn-primary" onClick={() => navigate('/patients')}>{t('Retour à la liste')}</button>
                </div>
            </div>
        );
    }

    const firstName = patient.name.split(' ')[0];

    return (
        <div className="patient-view">
            {/* Header */}
            <div className="patient-header">
                <div className="patient-header-left">
                    <h2>{t('Bonjour')} {firstName}</h2>
                    <span>{patient.days_until || 'J-0'} • {patient.operation}</span>
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
                {/* Time Alert */}
                <div className="alert-banner alert-banner-primary" style={{ marginBottom: 'var(--spacing-6)' }}>
                    <Clock size={20} />
                    <div>
                        <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>{t('Arrivée prévue à 07:30')}</div>
                        <div style={{ opacity: 0.9, fontSize: 'var(--font-size-sm)' }}>{t("Rendez-vous à l'accueil principal. Prévoyez d'arriver 15 min avant.")}</div>
                    </div>
                </div>

                {/* Étape Administrative */}
                <div className="step-section">
                    <div className="step-header">
                        <span className="step-header-icon">📋</span>
                        <div>
                            <div className="step-header-title">{t('Étape Administrative')}</div>
                            <div className="step-header-subtitle">{t('Dernière ligne droite ! Vérifions ensemble que tout est prêt.')}</div>
                        </div>
                    </div>
                </div>

                {/* Consultation d'anesthésie */}
                <div className="question-card">
                    <div className="question-title">{t("Consultation d'anesthésie")}</div>
                    <div className="toggle-group">
                        <button
                            className={`toggle-btn ${anesthesie === true ? 'active' : ''}`}
                            onClick={() => setAnesthesie(true)}
                        >
                            {t('Oui')}
                        </button>
                        <button
                            className={`toggle-btn ${anesthesie === false ? 'active' : ''}`}
                            onClick={() => setAnesthesie(false)}
                        >
                            {t('Non')}
                        </button>
                    </div>
                    <div className="info-box" style={{ marginTop: 'var(--spacing-4)' }}>
                        <Info size={16} className="info-box-icon" />
                        <div>
                            <div className="info-box-title">{t('Pourquoi est-ce important ?')}</div>
                            <div className="info-box-text">{t("C'est une obligation légale de sécurité.")}</div>
                        </div>
                    </div>
                </div>

                {/* Bilan sanguin */}
                <div className="question-card">
                    <div className="question-title">Bilan sanguin</div>
                    <div className="toggle-group">
                        <button
                            className={`toggle-btn ${bilanSanguin === true ? 'active' : ''}`}
                            onClick={() => setBilanSanguin(true)}
                        >
                            Oui
                        </button>
                        <button
                            className={`toggle-btn ${bilanSanguin === false ? 'active' : ''}`}
                            onClick={() => setBilanSanguin(false)}
                        >
                            Non
                        </button>
                    </div>
                    <div className="info-box" style={{ marginTop: 'var(--spacing-4)' }}>
                        <Info size={16} className="info-box-icon" />
                        <div>
                            <div className="info-box-title">Pourquoi est-ce important ?</div>
                            <div className="info-box-text">Pour vérifier qu'il n'y a aucune contre-indication.</div>
                        </div>
                    </div>
                </div>

                {/* Préparation section */}
                <div className="step-section" style={{ marginTop: 'var(--spacing-6)' }}>
                    <div className="step-header">
                        <span className="step-header-icon"><Scissors size={18} /></span>
                        <div>
                            <div className="step-header-title">Préparation Épilation</div>
                        </div>
                    </div>
                </div>

                {/* Épilation warning */}
                <div className="question-card">
                    <div className="alert-banner alert-banner-warning" style={{ marginBottom: 'var(--spacing-4)' }}>
                        <AlertTriangle size={18} />
                        <div style={{ fontSize: 'var(--font-size-sm)' }}>
                            <strong>Important :</strong> L'épilation devra être faite à la <a href="#" style={{ color: 'var(--color-warning-600)' }}>crème dépilatoire</a> la veille de l'opération. Le rasoir est interdit.
                        </div>
                    </div>

                    <div className="question-title">Avez-vous acheté la crème et fait un test d'allergie ?</div>
                    <div className="toggle-group">
                        <button
                            className={`toggle-btn ${allergie === true ? 'active' : ''}`}
                            onClick={() => setAllergie(true)}
                        >
                            Oui, c'est prêt
                        </button>
                        <button
                            className={`toggle-btn ${allergie === false ? 'active' : ''}`}
                            onClick={() => setAllergie(false)}
                        >
                            Pas encore
                        </button>
                    </div>
                    <div className="info-box" style={{ marginTop: 'var(--spacing-4)' }}>
                        <Info size={16} className="info-box-icon" />
                        <div>
                            <div className="info-box-title">Pourquoi est-ce important ?</div>
                            <div className="info-box-text">Tester la crème à l'avance évite les réactions allergiques de dernière minute.</div>
                        </div>
                    </div>
                </div>

                {/* Retour à domicile - Critical */}
                <div className="question-card alert-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-4)' }}>
                        <User size={18} style={{ color: 'var(--color-gray-600)' }} />
                        <span className="question-title" style={{ marginBottom: 0 }}>Retour à domicile</span>
                    </div>

                    <div className="toggle-group">
                        <button
                            className={`toggle-btn ${accompagnant === true ? 'active' : ''}`}
                            onClick={() => setAccompagnant(true)}
                        >
                            Oui, j'ai quelqu'un
                        </button>
                        <button
                            className={`toggle-btn ${accompagnant === false ? 'active' : ''}`}
                            onClick={() => setAccompagnant(false)}
                        >
                            Non, je suis seul(e)
                        </button>
                    </div>

                    {accompagnant === false && (
                        <div className="alert-banner alert-banner-danger" style={{ marginTop: 'var(--spacing-4)' }}>
                            <AlertTriangle size={18} />
                            <div>
                                <div className="alert-card-header" style={{ marginBottom: 0 }}>Sortie compromise</div>
                                <div className="alert-card-message">Contactez-nous vite.</div>
                            </div>
                        </div>
                    )}

                    <div className="info-box" style={{ marginTop: 'var(--spacing-4)' }}>
                        <Info size={16} className="info-box-icon" />
                        <div>
                            <div className="info-box-title">Pourquoi est-ce important ?</div>
                            <div className="info-box-text">La loi interdit formellement de rentrer seul après une anesthésie.</div>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%', marginTop: 'var(--spacing-6)' }}
                    onClick={handleSubmit}
                >
                    Valider et Envoyer mon dossier
                </button>
            </div>
        </div>
    );
}
