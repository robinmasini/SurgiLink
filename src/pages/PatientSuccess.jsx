import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

export default function PatientSuccess() {
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

            <div style={{ color: 'var(--color-gray-400)', fontSize: 'var(--font-size-sm)' }}>
                SurgiLink • Votre partenaire santé
            </div>
        </div>
    );
}
