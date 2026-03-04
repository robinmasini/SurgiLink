import { calculateAge, formatDateFR, calculateDaysUntilSurgery } from '../utils/dateUtils';

export default function PatientJ7({ patient: propPatient, token: propToken }) {
    const navigate = useNavigate();
    const { token: urlToken } = useParams();
    const token = propToken || urlToken;
    const { patientId: hookPatientId, loading: hookLoading, error: hookError, isTokenMode: hookIsTokenMode } = usePatientId();

    // Resolve patient ID and mode from either props or hook
    const resolvedPatientId = propPatient?.id || hookPatientId;
    const loadingPatientId = !propPatient && hookLoading;
    const patientIdError = !propPatient && hookError;
    const isTokenMode = propPatient ? true : hookIsTokenMode;

    const [responses, setResponses] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [patient, setPatient] = useState(propPatient || null);
    const [riskFlags, setRiskFlags] = useState({ soft: [], hard: [] });

    const config = pathwayConfig.J7;

    useEffect(() => {
        if (resolvedPatientId) {
            loadResponses();
            if (!propPatient) loadPatientData();
        }
    }, [resolvedPatientId]);

    useEffect(() => {
        // Calculate risk flags whenever responses change
        const flags = calculateRiskFlagsSync();
        setRiskFlags(flags);
    }, [responses]);

    const loadPatientData = async () => {
        const { data } = await supabase.from('patients').select('*').eq('id', resolvedPatientId).single();
        if (data) setPatient(data);
    };

    const loadResponses = async () => {
        if (!resolvedPatientId) return;
        setLoading(true);
        const data = await getResponses(parseInt(resolvedPatientId), 'J7');
        setResponses(data);
        setLoading(false);
    };

    const calculateRiskFlagsSync = () => {
        const items = config.sections.flatMap(s => s.items);
        const flags = { soft: [], hard: [] };

        items.forEach(item => {
            if (!item.risk_flag_rule) return;

            const response = responses[item.id]?.main ?? responses[item.id];
            const rule = item.risk_flag_rule;

            let flagged = false;
            if (rule.condition === 'yes' && response === true) flagged = true;
            if (rule.condition === 'no' && response === false) flagged = true;

            if (flagged) {
                if (rule.type === 'hard') {
                    flags.hard.push({ itemId: item.id, label: item.label });
                } else {
                    flags.soft.push({ itemId: item.id, label: item.label });
                }
            }
        });

        return flags;
    };

    const handleChange = async (itemId, value) => {
        // Update local state
        setResponses(prev => ({ ...prev, [itemId]: value }));

        // Save to database
        if (resolvedPatientId) {
            await saveResponse(parseInt(resolvedPatientId), 'J7', itemId, value, false);
        }
    };

    const handleSubmit = async () => {
        setSaving(true);

        if (resolvedPatientId) {
            // Mark screen as completed
            await markScreenCompleted(parseInt(resolvedPatientId), 'J7');

            // Schedule state-based reminders for incomplete items
            await scheduleStateBasedReminders(parseInt(resolvedPatientId), 'J7');
        }

        setSaving(false);

        // Navigate back to portal if in token mode, otherwise to success page
        if (isTokenMode) {
            navigate(`/patient-portal/${token}/success`); // Assuming a success page exists or we'll create one
        } else {
            navigate('/patient/success');
        }
    };

    // Loading patient ID
    if (loadingPatientId) {
        return (
            <div className="patient-view" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div>Chargement...</div>
            </div>
        );
    }

    // Error loading patient ID
    if (patientIdError) {
        return (
            <div className="patient-view" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="card" style={{ maxWidth: '500px', textAlign: 'center', padding: 'var(--spacing-6)' }}>
                    <AlertCircle size={64} style={{ margin: '0 auto var(--spacing-4)', color: 'var(--color-danger-500)' }} />
                    <h2 style={{ marginBottom: 'var(--spacing-2)' }}>Accès non autorisé</h2>
                    <p style={{ color: 'var(--color-gray-600)' }}>{patientIdError}</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="patient-view" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div>Chargement...</div>
            </div>
        );
    }

    return (
        <div className="patient-view">
            {/* Header */}
            <div className="patient-header" style={{ padding: 'var(--spacing-6) var(--spacing-4)', textAlign: 'center', display: 'block' }}>
                <h2 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-1)' }}>Dossier Médical</h2>
                <div style={{ color: 'var(--color-primary-600)', fontWeight: 'var(--font-weight-semibold)' }}>J-7 • Préparation</div>
            </div>

            {/* Content */}
            <div className="patient-content fade-in">
                {patient && (
                    <CompactAppointmentCard
                        variant="pill"
                        clinicName={patient.clinic_name}
                        appointmentDate={patient.date}
                        appointmentTime={patient.surgery_time}
                        jValue={calculateDaysUntilSurgery(patient.date)}
                        style={{ justifyContent: 'center', marginBottom: 'var(--spacing-6)' }}
                    />
                )}

                {/* Time Alert */}
                <AlertBanner
                    type="info"
                    title="Arrivée prévue à 07:30"
                    message="Rendez-vous à l'accueil principal. Prévoyez d'arriver 15 min avant. À apporter : pièce d'identité + documents."
                />


                {/* Sections */}
                {config.sections.map((section) => (
                    <div key={section.id}>
                        {/* Section Header */}
                        <div className="step-section" style={{ marginTop: 'var(--spacing-6)' }}>
                            <div className="step-header">
                                <span className="step-header-icon">
                                    {typeof section.icon === 'string' ? section.icon : <Scissors size={18} />}
                                </span>
                                <div>
                                    <div className="step-header-title">{section.title}</div>
                                    {section.subtitle && <div className="step-header-subtitle">{section.subtitle}</div>}
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        {section.items.map((item) => (
                            <QuestionRenderer
                                key={item.id}
                                item={item}
                                value={responses[item.id]?.main ?? responses[item.id]}
                                onChange={handleChange}
                                screen="J7"
                            />
                        ))}
                    </div>
                ))}

                {/* Submit Button */}
                <button
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%', marginTop: 'var(--spacing-6)' }}
                    onClick={handleSubmit}
                    disabled={saving}
                >
                    {saving ? 'Enregistrement...' : 'Valider et Envoyer mon dossier'}
                </button>
            </div>

            {/* FAB */}
            <button className="fab">
                <Sparkles size={24} />
            </button>
        </div>
    );
}
