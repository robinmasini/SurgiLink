import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Calendar,
    User,
    Clipboard,
    History,
    ChevronLeft,
    Clock,
    Activity,
    ShieldCheck
} from 'lucide-react';

const patientsData = {
    1: {
        id: 1,
        name: 'Thomas Dupont',
        age: 42,
        operation: 'Arthroscopie Épaule',
        date: '21 Jan 2026',
        status: 'ready',
        progress: 100,
        history: [
            { date: '15 Mai 2024', title: 'Consultation Initiale', description: 'Douleurs persistantes épaule droite.' },
            { date: '02 Juin 2024', title: 'IRM Épaule', description: 'Déchirure partielle du labrum confirmée.' },
            { date: '10 Jan 2026', title: 'Bilan Pré-opératoire', description: 'Validation anesthésie et examens biologiques.' }
        ]
    },
    2: {
        id: 2,
        name: 'Marie Laurent',
        age: 35,
        operation: 'Chirurgie Pied',
        date: '22 Jan 2026',
        status: 'postop',
        progress: 60,
        history: [
            { date: '10 Nov 2025', title: 'Consultation Hallux Valgus', description: 'Gêne importante à la marche.' },
            { date: '15 Jan 2026', title: 'Radio de contrôle', description: 'Alignement osseux pré-opératoire.' }
        ]
    }
    // Fallback data for other IDs
};

export default function PatientReview() {
    const { id } = useParams();
    const navigate = useNavigate();
    const patient = patientsData[id] || {
        id: id,
        name: 'Patient Inconnu',
        age: '--',
        operation: 'Non spécifié',
        date: '--',
        history: []
    };

    return (
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <main className="main-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
                    <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm" style={{ padding: '8px' }}>
                        <ChevronLeft size={20} />
                    </button>
                    <Header
                        title={`Revue Patient : ${patient.name}`}
                        subtitle="Historique complet et suivi clinique"
                    />
                </div>

                <div className="grid-3" style={{ marginBottom: 'var(--spacing-8)' }}>
                    {/* Patient Info Card */}
                    <div className="card glass-effect">
                        <div className="card-header">
                            <div className="card-icon card-icon-primary">
                                <User size={20} />
                            </div>
                            <h3>Informations Générales</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                            <div>
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>Nom Complet</div>
                                <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>{patient.name}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>Âge</div>
                                <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>{patient.age} ans</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>Intervention Prévue</div>
                                <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>{patient.operation}</div>
                            </div>
                        </div>
                    </div>

                    {/* Status Card */}
                    <div className="card glass-effect">
                        <div className="card-header">
                            <div className="card-icon card-icon-success">
                                <Activity size={20} />
                            </div>
                            <h3>État du Protocole</h3>
                        </div>
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-4)' }}>
                            <div style={{ fontSize: 'var(--font-size-4xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary-500)' }}>
                                {patient.progress}%
                            </div>
                            <div className="progress-bar" style={{ margin: 'var(--spacing-4) 0' }}>
                                <div className="progress-fill progress-fill-primary" style={{ width: `${patient.progress}%` }}></div>
                            </div>
                            <div className="badge badge-success">Conformité validée</div>
                        </div>
                    </div>

                    {/* Next Steps Card */}
                    <div className="card glass-effect">
                        <div className="card-header">
                            <div className="card-icon card-icon-warning">
                                <Clock size={20} />
                            </div>
                            <h3>Prochaines Étapes</h3>
                        </div>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                            <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', fontSize: 'var(--font-size-sm)' }}>
                                <ShieldCheck size={16} color="var(--color-success-500)" />
                                Questionnaire pré-opératoire
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', fontSize: 'var(--font-size-sm)' }}>
                                <ShieldCheck size={16} color="var(--color-success-500)" />
                                Consultation anesthésie
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', fontSize: 'var(--font-size-sm)', opacity: 0.5 }}>
                                <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--color-gray-300)' }}></div>
                                Admission clinique (J-0)
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Surgical History / Traceability */}
                <div className="card">
                    <div className="card-header" style={{ marginBottom: 'var(--spacing-8)' }}>
                        <div className="card-icon card-icon-primary" style={{ background: 'var(--color-purple-50)', color: 'var(--color-purple-600)' }}>
                            <History size={20} />
                        </div>
                        <div>
                            <h3 style={{ marginBottom: '4px' }}>Historique de Traçabilité</h3>
                            <p style={{ fontSize: 'var(--font-size-sm)' }}>Registre des interventions et consultations précédentes</p>
                        </div>
                    </div>

                    <div className="timeline">
                        {patient.history.length > 0 ? patient.history.map((item, index) => (
                            <div key={index} className="timeline-item">
                                <div className="timeline-dot"></div>
                                <div className="timeline-content glass-effect">
                                    <div className="timeline-date">{item.date}</div>
                                    <div className="timeline-title">{item.title}</div>
                                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>{item.description}</div>
                                </div>
                            </div>
                        )) : (
                            <div style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--color-gray-400)' }}>
                                Aucun historique de traçabilité disponible pour ce patient.
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
