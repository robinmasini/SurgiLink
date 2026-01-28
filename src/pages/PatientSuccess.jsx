import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

export default function PatientSuccess() {
    return (
        <div className="success-page">
            <div className="success-icon">
                <CheckCircle size={40} />
            </div>

            <h1 className="success-title">Bien reçu !</h1>

            <p className="success-message">
                Vos informations ont été transmises à l'équipe médicale.
                Nous vous contacterons si nécessaire.
            </p>

            <Link to="/patient/checklist" className="btn btn-secondary">
                Retour à l'accueil
            </Link>
        </div>
    );
}
