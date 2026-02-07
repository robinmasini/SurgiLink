import { useState, useEffect } from 'react';
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
import { supabase } from '../lib/supabase';

export default function PatientReview() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadPatient = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('patients')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                setPatient(data);
            } catch (err) {
                console.error('Error loading patient:', err);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            loadPatient();
        }
    }, [id]);

    if (isLoading) {
        return (
            <div style={{ display: 'flex' }}>
                <Sidebar />
                <main className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div className="spinner" style={{ margin: '0 auto var(--spacing-4)' }}></div>
                        <p>Chargement...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (!patient) {
        return (
            <div style={{ display: 'flex' }}>
                <Sidebar />
                <main className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                    <div style={{ textAlign: 'center', color: 'var(--color-gray-500)' }}>
                        <p style={{ marginBottom: 'var(--spacing-4)' }}>Patient introuvable</p>
                        <button className="btn btn-primary" onClick={() => navigate('/patients')}>Retour à la liste</button>
                    </div>
                </main>
            </div>
        );
    }

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
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>Téléphone</div>
                                <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>{patient.phone || 'Non renseigné'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>Email</div>
                                <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>{patient.email || 'Non renseigné'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>Intervention Prévue</div>
                                <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>{patient.operation}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase' }}>Date</div>
                                <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                                    {patient.date ? new Date(patient.date).toLocaleDateString('fr-FR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    }) : 'Non définie'}
                                </div>
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
                                {patient.progress || 0}%
                            </div>
                            <div className="progress-bar" style={{ margin: 'var(--spacing-4) 0' }}>
                                <div className="progress-fill progress-fill-primary" style={{ width: `${patient.progress || 0}%` }}></div>
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
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--color-gray-400)' }}>
                            <History size={48} style={{ marginBottom: 'var(--spacing-4)', opacity: 0.2 }} />
                            <p>L'historique de traçabilité sera disponible prochainement.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
