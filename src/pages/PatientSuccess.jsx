import { Link, useParams } from 'react-router-dom';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import DoctolibButton from '../components/pathway/DoctolibButton';

export default function PatientSuccess() {
    const { token } = useParams();

    return (
        <div className="success-page">
            <div className="success-icon">
                <CheckCircle size={40} />
            </div>

            <h1 className="success-title">Bien reçu !</h1>

            <p className="success-message" style={{ marginBottom: 'var(--spacing-8)' }}>
                Vos informations ont été transmises avec succès à l'équipe médicale.
                Vous pouvez maintenant fermer cette fenêtre.
            </p>

            <div style={{ marginBottom: 'var(--spacing-8)' }}>
                <DoctolibButton />
            </div>

            {token && (
                <Link
                    to={`/patient-portal/${token}`}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'var(--color-primary-600)',
                        color: 'white',
                        padding: '12px 24px',
                        borderRadius: '12px',
                        textDecoration: 'none',
                        fontWeight: '600',
                        marginBottom: 'var(--spacing-8)',
                        boxShadow: '0 4px 12px rgba(var(--color-primary-rgb), 0.2)'
                    }}
                >
                    <ArrowLeft size={18} />
                    Retour à mon parcours
                </Link>
            )}

            <div style={{ color: 'var(--color-gray-400)', fontSize: 'var(--font-size-sm)' }}>
                SurgiLink • Votre partenaire santé
            </div>
        </div>
    );
}
