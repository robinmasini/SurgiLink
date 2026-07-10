import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, CheckCircle, Loader, AlertCircle, Camera, Image as ImageIcon } from 'lucide-react';
import { getIntakeByToken, submitIntakeForm } from '../services/intakeService';
import logoSlMa from '../assets/logo-sl-ma.png';
import medecinImg from '../assets/medecin.png';

/* ─────────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────────── */
const CONSULTATION_ACTS = [
    // Visage
    { key: 'botox', label: 'Botox', group: 'Visage' },
    { key: 'acide_hyaluronique', label: 'Acide Hyaluronique', group: 'Visage' },
    { key: 'peeling', label: 'Peeling', group: 'Visage' },
    { key: 'paupieres', label: 'Paupières', group: 'Visage' },
    { key: 'lifting', label: 'Lifting', group: 'Visage' },
    { key: 'rhinoplastie', label: 'Rhinoplastie', group: 'Visage' },
    // Poitrine
    { key: 'protheses_mammaires', label: 'Prothèses mammaires', group: 'Poitrine' },
    { key: 'ptose_mammaire', label: 'Ptose mammaire', group: 'Poitrine' },
    // Intime
    { key: 'nymphoplastie', label: 'Nymphoplastie', group: 'Intime' },
    { key: 'penoplastie', label: 'Pénoplastie', group: 'Intime' },
    { key: 'ejaculation_precoce', label: 'Éjaculation Précoce', group: 'Intime' },
];

const ANTECEDENTS = [
    { key: 'cardiaque', label: 'Cardiaque / Vasculaire' },
    { key: 'endocrino', label: 'Endocrinologique' },
    { key: 'digestif', label: 'Digestif' },
    { key: 'hemato', label: 'Hématologique' },
    { key: 'infectieux', label: 'Infectieux' },
    { key: 'cancer', label: 'Cancer' },
    { key: 'neuro', label: 'Neurologique' },
    { key: 'psychique', label: 'Psychique' },
    { key: 'pulmonaire', label: 'Pulmonaire' },
    { key: 'renal', label: 'Rénal' },
];

const REFERRAL_OPTIONS = [
    { key: 'medecin', label: 'Médecin' },
    { key: 'ami', label: 'Ami(e)' },
    { key: 'internet', label: 'Internet' },
    { key: 'reseaux', label: 'Réseaux sociaux' },
];

const TOTAL_STEPS = 8;

/* ─────────────────────────────────────────────────────────────────
   HELPER: Field component
───────────────────────────────────────────────────────────────── */
function Field({ label, required, hint, children }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
            </label>
            {children}
            {hint && <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{hint}</span>}
        </div>
    );
}

function StyledInput({ ...props }) {
    return (
        <input
            style={{
                width: '100%',
                padding: '11px 14px',
                border: '1.5px solid #E5E7EB',
                borderRadius: '10px',
                fontSize: '15px',
                color: '#111827',
                background: 'white',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
                fontFamily: 'inherit',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--color-primary-500)'}
            onBlur={e => e.target.style.borderColor = '#E5E7EB'}
            {...props}
        />
    );
}

function YesNoGroup({ label, value, onChange, yesLabel = 'Oui', noLabel = 'Non', detail, detailValue, onDetailChange, detailPlaceholder }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>{label}</span>
            <div style={{ display: 'flex', gap: '10px' }}>
                {[{ val: false, lbl: noLabel }, { val: true, lbl: yesLabel }].map(({ val, lbl }) => (
                    <button
                        key={String(val)}
                        type="button"
                        onClick={() => onChange(val)}
                        style={{
                            padding: '8px 20px',
                            borderRadius: '30px',
                            border: '1.5px solid',
                            borderColor: value === val ? 'var(--color-primary-500)' : '#E5E7EB',
                            background: value === val ? 'rgba(var(--color-primary-rgb), 0.08)' : 'white',
                            color: value === val ? 'var(--color-primary-600)' : '#6B7280',
                            fontWeight: '700',
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                        }}
                    >
                        {lbl}
                    </button>
                ))}
            </div>
            {detail && value === true && (
                <StyledInput
                    placeholder={detailPlaceholder || 'Précisez…'}
                    value={detailValue || ''}
                    onChange={e => onDetailChange(e.target.value)}
                />
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────── */
export default function IntakeForm() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [phase, setPhase] = useState('loading'); // loading | error | tutorial | form | submitting | done
    const [tutorialStep, setTutorialStep] = useState(1);
    const [formStep, setFormStep] = useState(1);
    const [patient, setPatient] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Form data
    const [form, setForm] = useState({
        // Section 1
        last_name: '', first_name: '', maiden_name: '', birth_date: '',
        address: '', postal_code: '', city: '', phone: '', email: '',
        emergency_contact_name: '', emergency_contact_phone: '',
        // Section 2
        general_practitioner: '', gp_city: '', specialist: '', specialist_city: '',
        // Section 3
        profession: '', referral_source: [], referral_other: '',
        // Section 4
        height_cm: '', weight_kg: '',
        has_allergies: null, allergies_detail: '',
        is_smoker: null, cigarettes_per_day: '',
        has_treatment: null, treatment_detail: '',
        // Section 5
        consultation_reasons: [], consultation_other: '',
        // Section 6
        discomfort_level: '', discomfort_duration: '', previous_consultation: null,
        // Section 7
        antecedents: {}, antecedents_details: '',
        // Section 8
        has_aesthetic_interventions: null, aesthetic_satisfied: null,
        previous_surgery: null, previous_surgery_detail: '',
        surgical_complications: null, complications_detail: '',
        easy_hematomas: null, keloid_scars: null,
        autoimmune_family: null, autoimmune_detail: '',
        family_history_other: '',
        id_card_recto: '', id_card_verso: '',
        signed_city: '', signed_date: new Date().toISOString().split('T')[0],
    });

    const setF = useCallback((key, val) => setForm(prev => ({ ...prev, [key]: val })), []);

    const processImageToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1200;
                    const MAX_HEIGHT = 1200;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const load = async () => {
            const result = await getIntakeByToken(token);
            if (!result.success) {
                setErrorMsg(result.error || 'Lien invalide.');
                setPhase('error');
                return;
            }
            setPatient(result.patient);
            // Pre-fill name/phone from patient record if available
            if (result.patient) {
                const isNouveauPatient = result.patient.name === 'Nouveau patient';
                const nameParts = (result.patient.name || '').split(' ');
                setForm(prev => ({
                    ...prev,
                    first_name: isNouveauPatient ? '' : (nameParts[0] || ''),
                    last_name: isNouveauPatient ? '' : (nameParts.slice(1).join(' ') || ''),
                    phone: result.patient.phone || '',
                    email: result.patient.email || '',
                }));
            }
            // If already completed, show done directly
            if (result.intakeResponse?.form_completed) {
                setPhase('done');
            } else {
                setPhase('tutorial');
            }
        };
        load();
    }, [token]);

    const validateCurrentStep = () => {
        let error = '';
        switch (formStep) {
            case 1:
                if (!form.first_name || !form.last_name || !form.birth_date || !form.phone) {
                    error = 'Veuillez remplir les champs obligatoires (prénom, nom, date de naissance, téléphone).';
                } else if (!form.id_card_recto || !form.id_card_verso) {
                    error = 'Veuillez fournir votre pièce d\'identité recto et verso.';
                }
                break;
            case 2:
                break;
            case 3:
                if (form.referral_source.length === 0 && !form.referral_other) {
                    error = 'Veuillez indiquer comment vous avez connu le cabinet.';
                }
                break;
            case 4:
                if (!form.height_cm || !form.weight_kg) {
                    error = 'Veuillez renseigner votre taille et votre poids.';
                } else if (form.has_allergies === null || form.is_smoker === null || form.has_treatment === null) {
                    error = 'Veuillez répondre par Oui ou Non à toutes les questions médicales.';
                } else if (form.has_allergies && !form.allergies_detail) {
                    error = 'Veuillez préciser vos allergies.';
                } else if (form.has_treatment && !form.treatment_detail) {
                    error = 'Veuillez préciser votre traitement médical.';
                }
                break;
            case 5:
                if (form.consultation_reasons.length === 0 && !form.consultation_other) {
                    error = 'Veuillez sélectionner au moins un motif de consultation.';
                }
                break;
            case 6:
                if (!form.discomfort_level || !form.discomfort_duration) {
                    error = 'Veuillez qualifier votre gêne esthétique.';
                } else if (form.previous_consultation === null || form.has_aesthetic_interventions === null) {
                    error = 'Veuillez répondre par Oui ou Non aux questions (consultations et interventions précédentes).';
                } else if (form.has_aesthetic_interventions && form.aesthetic_satisfied === null) {
                    error = 'Veuillez préciser si vous étiez satisfait(e) de vos interventions esthétiques précédentes.';
                }
                break;
            case 7:
                break;
            case 8:
                if (form.previous_surgery === null || form.easy_hematomas === null || form.keloid_scars === null || form.autoimmune_family === null) {
                    error = 'Veuillez répondre à toutes les questions sur vos antécédents.';
                } else if (form.previous_surgery && !form.previous_surgery_detail) {
                    error = 'Veuillez préciser vos interventions chirurgicales précédentes.';
                } else if (form.surgical_complications && !form.complications_detail) {
                    error = 'Veuillez préciser les complications rencontrées.';
                } else if (form.autoimmune_family && !form.autoimmune_detail) {
                    error = 'Veuillez préciser les maladies auto-immunes.';
                } else if (!form.signed_city || !form.signed_date) {
                    error = 'Veuillez remplir la signature électronique (Lieu et Date).';
                }
                break;
            default:
                break;
        }

        if (error) {
            setErrorMsg(error);
            return false;
        } else {
            setErrorMsg('');
            return true;
        }
    };

    const handleNext = () => {
        if (validateCurrentStep()) {
            setFormStep(s => s + 1);
        }
    };

    const handleSubmit = async () => {
        setPhase('submitting');
        const result = await submitIntakeForm(token, form);
        if (result.success) {
            setPhase('done');
        } else {
            setErrorMsg(result.error || 'Une erreur est survenue lors de la soumission.');
            setPhase('form');
            setFormStep(TOTAL_STEPS);
        }
    };

    // ── Styles ──
    const pageStyle = {
        minHeight: '100dvh',
        background: 'linear-gradient(160deg, var(--color-primary-50) 0%, var(--color-primary-100) 50%, #EFF4F1 100%)',
        fontFamily: 'var(--font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    };

    const containerStyle = {
        width: '100%',
        maxWidth: '500px',
        padding: isMobile ? '16px 16px 32px' : '24px 20px 40px',
        boxSizing: 'border-box',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    };

    // ── Loading ──
    if (phase === 'loading') {
        return (
            <div style={{ ...pageStyle, alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                <Loader size={36} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary-500)' }} />
                <p style={{ color: '#6B7280', fontWeight: '500' }}>Chargement…</p>
            </div>
        );
    }

    // ── Error ──
    if (phase === 'error') {
        return (
            <div style={{ ...pageStyle, alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
                <div style={{ textAlign: 'center', maxWidth: '360px' }}>
                    <AlertCircle size={48} style={{ color: '#EF4444', marginBottom: '16px' }} />
                    <h2 style={{ color: '#111827', marginBottom: '8px' }}>Accès impossible</h2>
                    <p style={{ color: '#6B7280', lineHeight: 1.6 }}>{errorMsg}</p>
                </div>
            </div>
        );
    }

    // ── Done ──
    if (phase === 'done') {
        return (
            <div style={{ ...pageStyle, alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
                <div style={{ textAlign: 'center', maxWidth: '360px' }}>
                    {/* Logo sl-ma.png au-dessus */}
                    <img
                        src={logoSlMa}
                        alt="SurgiLink / Medical Alliance"
                        style={{ height: '80px', objectFit: 'contain', marginBottom: '28px' }}
                    />
                    {/* Pastille verte */}
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #10B981, #059669)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 20px',
                        boxShadow: '0 12px 30px rgba(16, 185, 129, 0.4)'
                    }}>
                        <CheckCircle size={40} color="white" />
                    </div>
                    <h2 style={{ color: '#111827', marginBottom: '10px', fontWeight: '800', fontSize: '22px' }}>
                        Merci !
                    </h2>
                    <p style={{ color: '#6B7280', lineHeight: 1.7, fontSize: '15px' }}>
                        Votre fiche de renseignements a bien été transmise au cabinet.
                        <br /><br />
                        Nous la prendrons en compte avant votre consultation.
                    </p>
                    <div style={{ marginTop: '24px', padding: '14px', background: 'white', borderRadius: '14px', border: '1px solid #E5E7EB', fontSize: '13px', color: '#6B7280' }}>
                        Vous pouvez fermer cette fenêtre.
                    </div>
                </div>
            </div>
        );
    }


    // ── Submitting ──
    if (phase === 'submitting') {
        return (
            <div style={{ ...pageStyle, alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                <Loader size={36} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary-500)' }} />
                <p style={{ color: '#6B7280', fontWeight: '500' }}>Envoi de votre fiche…</p>
            </div>
        );
    }

    // ── Tutorial ──
    if (phase === 'tutorial') {
        return (
            <div style={{ minHeight: '100dvh', background: '#FFFFFF', fontFamily: 'var(--font-family)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '100%', maxWidth: '500px', padding: isMobile ? '20px 20px 120px' : '28px 24px 120px', boxSizing: 'border-box', flex: 1, display: 'flex', flexDirection: 'column' }}>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', gap: '16px' }}>
                        <img src={logoSlMa} alt="SurgiLink / Medical Alliance" style={{ width: '100%', maxWidth: '220px', height: 'auto', objectFit: 'contain' }} />
                        {/* Sélecteur langue pill */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                            <select
                                defaultValue="fr"
                                style={{
                                    padding: '9px 32px 9px 14px',
                                    border: '1.5px solid #E5E7EB',
                                    borderRadius: '999px',
                                    background: '#F9FAFB',
                                    WebkitAppearance: 'none',
                                    appearance: 'none',
                                    outline: 'none',
                                    cursor: 'pointer',
                                    fontSize: '17px',
                                    fontFamily: 'var(--font-family)',
                                    fontWeight: '600',
                                    color: '#374151',
                                    minWidth: '72px',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                                }}
                            >
                                <option value="fr">🇫🇷</option>
                                <option value="en">🇬🇧</option>
                                <option value="nl">🇳🇱</option>
                            </select>
                            <svg style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9CA3AF' }} width="11" height="11" viewBox="0 0 12 12" fill="none">
                                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                    </div>

                    {/* Ligne 2 : Titre "Fiche de renseignements" sous le logo */}
                    <h1 style={{ margin: '0 0 20px', fontSize: isMobile ? '24px' : '28px', fontWeight: '700', color: '#111827', letterSpacing: '-0.02em', fontFamily: 'var(--font-family)', lineHeight: 1.15 }}>
                        Fiche de renseignements
                    </h1>

                    {/* Carte hero — fond vert, texte sur 3 lignes, infirmière à droite */}
                    <div style={{
                        position: 'relative',
                        borderRadius: '22px',
                        overflow: 'hidden',
                        background: 'linear-gradient(135deg, var(--color-primary-100) 0%, var(--color-primary-50) 100%)',
                        marginBottom: '14px',
                        minHeight: isMobile ? '230px' : '270px',
                        display: 'flex',
                        alignItems: 'stretch'
                    }}>
                        {/* Zone texte élargie pour 3 lignes */}
                        <div style={{ padding: '26px 10px 26px 24px', width: '63%', flexShrink: 0, zIndex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px' }}>
                            {/* Texte principal — 3 lignes forcées */}
                            <p style={{ margin: 0, fontSize: isMobile ? '16px' : '18px', color: '#111827', lineHeight: 1.55, fontFamily: 'var(--font-family)', fontWeight: '600' }}>
                                Répondez à la<br />
                                <span style={{ color: 'var(--color-primary-700)', fontWeight: '800' }}>Fiche de renseignements</span><br />
                                pour préparer votre consultation
                            </p>
                            {/* Texte secondaire */}
                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-primary-700)', lineHeight: 1.6, fontFamily: 'var(--font-family)', fontWeight: '400', opacity: 0.85 }}>
                                <strong style={{ fontWeight: '600' }}>Avant votre consultation</strong>, merci de compléter cette fiche afin de mieux préparer votre prise en charge.
                            </p>
                        </div>
                        {/* Infirmière à droite */}
                        <img
                            src={medecinImg}
                            alt="Praticien"
                            style={{
                                position: 'absolute',
                                right: 0,
                                bottom: 0,
                                height: isMobile ? '230px' : '270px',
                                width: 'auto',
                                objectFit: 'contain',
                                objectPosition: 'bottom right',
                                zIndex: 1
                            }}
                        />
                    </div>

                    {/* 3 items info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                            { icon: '⏱', text: 'Environ 5 minutes à compléter' },
                            { icon: '🔒', text: 'Données sécurisées et confidentielles' },
                            { icon: '📱', text: 'Remplissez depuis votre téléphone' },
                        ].map((item, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '11px 14px',
                                background: '#F9FAFB',
                                borderRadius: '12px',
                                border: '1px solid #F3F4F6',
                                fontSize: '13px', color: '#374151', fontWeight: '500',
                                fontFamily: 'var(--font-family)'
                            }}>
                                <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
                                <span>{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bouton CONTINUER fixé en bas */}
                <div style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0,
                    padding: '16px 20px 28px',
                    background: 'linear-gradient(to top, #FFFFFF 75%, transparent)',
                    display: 'flex', justifyContent: 'center', zIndex: 50
                }}>
                    <button
                        onClick={() => setPhase('form')}
                        style={{
                            width: '100%', maxWidth: '460px',
                            height: '56px',
                            background: 'linear-gradient(135deg, #4DC87E, #3AB56A)',
                            border: 'none', borderRadius: '30px', color: 'white',
                            fontWeight: '800', fontSize: '15px', cursor: 'pointer',
                            letterSpacing: '0.08em',
                            fontFamily: 'var(--font-family)',
                            boxShadow: '0 8px 28px rgba(58, 181, 106, 0.4)',
                            transition: 'transform 0.15s, box-shadow 0.15s'
                        }}
                        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(58, 181, 106, 0.5)'; }}
                        onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(58, 181, 106, 0.4)'; }}
                    >
                        CONTINUER
                    </button>
                </div>

                <style>{`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }




    // ── Form ──
    const STEP_LABELS = [
        'Informations personnelles',
        'Médecins référents',
        'Situation générale',
        'Données médicales',
        'Motif de consultation',
        'Ressenti esthétique',
        'Antécédents personnels',
        'Antécédents chirurgicaux',
    ];

    const toggleReferral = (key) => {
        const current = form.referral_source || [];
        setF('referral_source', current.includes(key) ? current.filter(k => k !== key) : [...current, key]);
    };

    const toggleAct = (key) => {
        const current = form.consultation_reasons || [];
        setF('consultation_reasons', current.includes(key) ? current.filter(k => k !== key) : [...current, key]);
    };

    const toggleAntecedent = (key) => {
        const current = form.antecedents || {};
        const existing = current[key] || { checked: false, detail: '' };
        setF('antecedents', { ...current, [key]: { ...existing, checked: !existing.checked } });
    };

    const setAntecedentDetail = (key, detail) => {
        const current = form.antecedents || {};
        setF('antecedents', { ...current, [key]: { ...(current[key] || {}), detail } });
    };

    const ChipButton = ({ active, onClick, children }) => (
        <button
            type="button"
            onClick={onClick}
            style={{
                padding: '8px 14px',
                borderRadius: '30px',
                border: '1.5px solid',
                borderColor: active ? 'var(--color-primary-500)' : '#E5E7EB',
                background: active ? 'rgba(var(--color-primary-rgb), 0.08)' : 'white',
                color: active ? 'var(--color-primary-600)' : '#6B7280',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap'
            }}
        >
            {active ? '✓ ' : ''}{children}
        </button>
    );

    const renderStep = () => {
        const inputStyle = {
            width: '100%', padding: '11px 14px',
            border: '1.5px solid #E5E7EB', borderRadius: '10px',
            fontSize: '15px', color: '#111827',
            background: 'white', outline: 'none',
            boxSizing: 'border-box', fontFamily: 'inherit',
        };

        switch (formStep) {
            /* ── Step 1: Informations personnelles ── */
            case 1:
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <Field label="Prénom" required>
                                <StyledInput value={form.first_name} onChange={e => setF('first_name', e.target.value)} placeholder="Marie" />
                            </Field>
                            <Field label="Nom" required>
                                <StyledInput value={form.last_name} onChange={e => setF('last_name', e.target.value)} placeholder="DUPONT" />
                            </Field>
                        </div>
                        <Field label="Nom de jeune fille / Homme" hint="Si différent du nom actuel">
                            <StyledInput value={form.maiden_name} onChange={e => setF('maiden_name', e.target.value)} placeholder="Optionnel" />
                        </Field>
                        <Field label="Date de naissance" required>
                            <StyledInput type="date" value={form.birth_date} onChange={e => setF('birth_date', e.target.value)} />
                        </Field>
                        <Field label="Adresse">
                            <StyledInput value={form.address} onChange={e => setF('address', e.target.value)} placeholder="12 rue de la Paix" />
                        </Field>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                            <Field label="Code postal">
                                <StyledInput value={form.postal_code} onChange={e => setF('postal_code', e.target.value)} placeholder="75001" inputMode="numeric" />
                            </Field>
                            <Field label="Ville">
                                <StyledInput value={form.city} onChange={e => setF('city', e.target.value)} placeholder="Paris" />
                            </Field>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <Field label="Téléphone" required>
                                <StyledInput type="tel" value={form.phone} onChange={e => setF('phone', e.target.value)} placeholder="+33 6 12 34 56 78" />
                            </Field>
                            <Field label="Email">
                                <StyledInput type="email" value={form.email} onChange={e => setF('email', e.target.value)} placeholder="email@exemple.fr" />
                            </Field>
                        </div>
                        <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '12px', border: '1px solid #F3F4F6' }}>
                            <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>
                                Personne à prévenir en cas d'urgence
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <Field label="Nom">
                                    <StyledInput value={form.emergency_contact_name} onChange={e => setF('emergency_contact_name', e.target.value)} placeholder="Nom" />
                                </Field>
                                <Field label="Téléphone">
                                    <StyledInput type="tel" value={form.emergency_contact_phone} onChange={e => setF('emergency_contact_phone', e.target.value)} placeholder="+33 6…" />
                                </Field>
                            </div>
                        </div>

                        {/* ID Card Upload */}
                        <div style={{ background: '#F9FAFB', borderRadius: '14px', padding: '14px', border: '1px solid #F3F4F6' }}>
                            <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: '800', color: 'var(--color-primary-500)', textTransform: 'uppercase' }}>
                                Pièce d'identité
                            </p>
                            <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#6B7280' }}>
                                Veuillez nous transmettre une copie de votre pièce d'identité (recto/verso) pour votre dossier.
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>
                                    <label style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        background: form.id_card_recto ? '#ECFDF5' : 'white',
                                        border: `2px dashed ${form.id_card_recto ? '#10B981' : '#D1D5DB'}`,
                                        borderRadius: '12px', padding: '16px 8px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center'
                                    }}>
                                        {form.id_card_recto ? (
                                            <>
                                                <CheckCircle size={28} color="#10B981" style={{ marginBottom: '8px' }} />
                                                <span style={{ fontSize: '13px', fontWeight: '700', color: '#065F46' }}>Recto chargé</span>
                                            </>
                                        ) : (
                                            <>
                                                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', color: '#9CA3AF' }}>
                                                    <Camera size={22} />
                                                    <ImageIcon size={22} />
                                                </div>
                                                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-primary-600)' }}>Ajouter Recto</span>
                                                <span style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '4px' }}>Photo ou Galerie</span>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    const b64 = await processImageToBase64(e.target.files[0]);
                                                    setF('id_card_recto', b64);
                                                }
                                            }}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                </div>
                                <div>
                                    <label style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        background: form.id_card_verso ? '#ECFDF5' : 'white',
                                        border: `2px dashed ${form.id_card_verso ? '#10B981' : '#D1D5DB'}`,
                                        borderRadius: '12px', padding: '16px 8px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center'
                                    }}>
                                        {form.id_card_verso ? (
                                            <>
                                                <CheckCircle size={28} color="#10B981" style={{ marginBottom: '8px' }} />
                                                <span style={{ fontSize: '13px', fontWeight: '700', color: '#065F46' }}>Verso chargé</span>
                                            </>
                                        ) : (
                                            <>
                                                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', color: '#9CA3AF' }}>
                                                    <Camera size={22} />
                                                    <ImageIcon size={22} />
                                                </div>
                                                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-primary-600)' }}>Ajouter Verso</span>
                                                <span style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '4px' }}>Photo ou Galerie</span>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    const b64 = await processImageToBase64(e.target.files[0]);
                                                    setF('id_card_verso', b64);
                                                }
                                            }}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            /* ── Step 2: Médecins référents ── */
            case 2:
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ background: '#F9FAFB', borderRadius: '14px', padding: '14px', border: '1px solid #F3F4F6' }}>
                            <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Médecin traitant</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                                <Field label="Dr.">
                                    <StyledInput value={form.general_practitioner} onChange={e => setF('general_practitioner', e.target.value)} placeholder="Nom du médecin" />
                                </Field>
                                <Field label="Ville">
                                    <StyledInput value={form.gp_city} onChange={e => setF('gp_city', e.target.value)} placeholder="Marseille" />
                                </Field>
                            </div>
                        </div>
                        <div style={{ background: '#F9FAFB', borderRadius: '14px', padding: '14px', border: '1px solid #F3F4F6' }}>
                            <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>Spécialiste suivi (le cas échéant)</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                                <Field label="Dr.">
                                    <StyledInput value={form.specialist} onChange={e => setF('specialist', e.target.value)} placeholder="Nom du spécialiste" />
                                </Field>
                                <Field label="Ville">
                                    <StyledInput value={form.specialist_city} onChange={e => setF('specialist_city', e.target.value)} placeholder="Lyon" />
                                </Field>
                            </div>
                        </div>
                    </div>
                );

            /* ── Step 3: Situation générale ── */
            case 3:
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <Field label="Profession">
                            <StyledInput value={form.profession} onChange={e => setF('profession', e.target.value)} placeholder="Ex : infirmière, ingénieur…" />
                        </Field>
                        <div>
                            <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>
                                Comment avez-vous connu le cabinet ?
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {REFERRAL_OPTIONS.map(opt => (
                                    <ChipButton
                                        key={opt.key}
                                        active={form.referral_source.includes(opt.key)}
                                        onClick={() => toggleReferral(opt.key)}
                                    >
                                        {opt.label}
                                    </ChipButton>
                                ))}
                            </div>
                        </div>
                        <Field label="Autre précision">
                            <StyledInput value={form.referral_other} onChange={e => setF('referral_other', e.target.value)} placeholder="Ex : recommandé par un ami…" />
                        </Field>
                    </div>
                );

            /* ── Step 4: Données médicales ── */
            case 4:
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <Field label="Taille (cm)">
                                <StyledInput type="number" value={form.height_cm} onChange={e => setF('height_cm', e.target.value)} placeholder="Ex : 165" inputMode="numeric" min="100" max="220" />
                            </Field>
                            <Field label="Poids (kg)">
                                <StyledInput type="number" value={form.weight_kg} onChange={e => setF('weight_kg', e.target.value)} placeholder="Ex : 62" inputMode="numeric" min="30" max="250" />
                            </Field>
                        </div>
                        <YesNoGroup
                            label="Avez-vous des allergies ?"
                            value={form.has_allergies}
                            onChange={v => setF('has_allergies', v)}
                            detail
                            detailValue={form.allergies_detail}
                            onDetailChange={v => setF('allergies_detail', v)}
                            detailPlaceholder="Précisez vos allergies…"
                        />
                        <YesNoGroup
                            label="Fumez-vous ?"
                            value={form.is_smoker}
                            onChange={v => setF('is_smoker', v)}
                            detail
                            detailValue={form.cigarettes_per_day}
                            onDetailChange={v => setF('cigarettes_per_day', v)}
                            detailPlaceholder="Nombre de cigarettes par jour"
                        />
                        <YesNoGroup
                            label="Avez-vous un traitement médical en cours ?"
                            value={form.has_treatment}
                            onChange={v => setF('has_treatment', v)}
                            detail
                            detailValue={form.treatment_detail}
                            onDetailChange={v => setF('treatment_detail', v)}
                            detailPlaceholder="Nom(s) du ou des traitements…"
                        />
                    </div>
                );

            /* ── Step 5: Motif de consultation ── */
            case 5: {
                const groups = [...new Set(CONSULTATION_ACTS.map(a => a.group))];
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>
                            Sélectionnez un ou plusieurs actes qui vous intéressent :
                        </p>
                        {groups.map(group => (
                            <div key={group}>
                                <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '800', color: 'var(--color-primary-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {group}
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {CONSULTATION_ACTS.filter(a => a.group === group).map(act => (
                                        <ChipButton
                                            key={act.key}
                                            active={form.consultation_reasons.includes(act.key)}
                                            onClick={() => toggleAct(act.key)}
                                        >
                                            {act.label}
                                        </ChipButton>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <Field label="Autre motif">
                            <StyledInput value={form.consultation_other} onChange={e => setF('consultation_other', e.target.value)} placeholder="Précisez si besoin…" />
                        </Field>
                    </div>
                );
            }

            /* ── Step 6: Ressenti esthétique ── */
            case 6:
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '700', color: '#374151' }}>
                                Comment qualifieriez-vous votre gêne esthétique ?
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {[{ val: 'tres_importante', lbl: 'Très importante' }, { val: 'moyenne', lbl: 'Moyenne' }, { val: 'legere', lbl: 'Légère' }].map(({ val, lbl }) => (
                                    <ChipButton key={val} active={form.discomfort_level === val} onClick={() => setF('discomfort_level', val)}>
                                        {lbl}
                                    </ChipButton>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '700', color: '#374151' }}>
                                Depuis combien de temps ressentez-vous cette gêne ?
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {[{ val: 'peu', lbl: 'Peu de temps' }, { val: 'longtemps', lbl: 'Longtemps' }, { val: 'toujours', lbl: 'Toujours' }].map(({ val, lbl }) => (
                                    <ChipButton key={val} active={form.discomfort_duration === val} onClick={() => setF('discomfort_duration', val)}>
                                        {lbl}
                                    </ChipButton>
                                ))}
                            </div>
                        </div>
                        <YesNoGroup
                            label="Avez-vous déjà eu une consultation esthétique ?"
                            value={form.previous_consultation}
                            onChange={v => setF('previous_consultation', v)}
                        />
                        <div>
                            <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '700', color: '#374151' }}>
                                Avez-vous déjà eu des interventions esthétiques ?
                            </p>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {[{ val: false, lbl: 'Non' }, { val: true, lbl: 'Oui' }].map(({ val, lbl }) => (
                                    <ChipButton key={String(val)} active={form.has_aesthetic_interventions === val} onClick={() => setF('has_aesthetic_interventions', val)}>
                                        {lbl}
                                    </ChipButton>
                                ))}
                            </div>
                            {form.has_aesthetic_interventions === true && (
                                <div style={{ marginTop: '10px' }}>
                                    <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                                        Étiez-vous satisfait(e) ?
                                    </p>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {[{ val: false, lbl: 'Non' }, { val: true, lbl: 'Oui' }].map(({ val, lbl }) => (
                                            <ChipButton key={String(val)} active={form.aesthetic_satisfied === val} onClick={() => setF('aesthetic_satisfied', val)}>
                                                {lbl}
                                            </ChipButton>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );

            /* ── Step 7: Antécédents personnels ── */
            case 7:
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#6B7280', lineHeight: 1.6 }}>
                            Avez-vous des antécédents dans les domaines suivants ? Cochez ceux qui vous concernent et précisez si nécessaire.
                        </p>
                        {ANTECEDENTS.map(ant => {
                            const entry = form.antecedents[ant.key] || { checked: false, detail: '' };
                            return (
                                <div key={ant.key} style={{
                                    padding: '12px 14px',
                                    background: entry.checked ? 'rgba(var(--color-primary-rgb), 0.05)' : '#F9FAFB',
                                    border: '1.5px solid',
                                    borderColor: entry.checked ? 'var(--color-primary-300)' : '#F3F4F6',
                                    borderRadius: '12px',
                                    transition: 'all 0.15s'
                                }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                                        <input
                                            type="checkbox"
                                            checked={entry.checked}
                                            onChange={() => toggleAntecedent(ant.key)}
                                            style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary-500)', cursor: 'pointer', flexShrink: 0 }}
                                        />
                                        {ant.label}
                                    </label>
                                    {entry.checked && (
                                        <StyledInput
                                            style={{ marginTop: '8px' }}
                                            placeholder="Précisez (ex : hypertension traitée depuis 2018)…"
                                            value={entry.detail}
                                            onChange={e => setAntecedentDetail(ant.key, e.target.value)}
                                        />
                                    )}
                                </div>
                            );
                        })}
                        <Field label="Précisions complémentaires">
                            <StyledInput value={form.antecedents_details} onChange={e => setF('antecedents_details', e.target.value)} placeholder="Tout autre renseignement utile…" />
                        </Field>
                    </div>
                );

            /* ── Step 8: Antécédents chirurgicaux & familiaux + Signature ── */
            case 8:
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <div style={{ background: '#F9FAFB', borderRadius: '14px', padding: '14px', border: '1px solid #F3F4F6' }}>
                            <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: '800', color: 'var(--color-primary-500)', textTransform: 'uppercase' }}>
                                Antécédents chirurgicaux
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <YesNoGroup
                                    label="Avez-vous déjà été opéré(e) ?"
                                    value={form.previous_surgery}
                                    onChange={v => setF('previous_surgery', v)}
                                    detail
                                    detailValue={form.previous_surgery_detail}
                                    onDetailChange={v => setF('previous_surgery_detail', v)}
                                    detailPlaceholder="Précisez (type d'opération, année)…"
                                />
                                <YesNoGroup
                                    label="Y a-t-il eu des complications ?"
                                    value={form.surgical_complications}
                                    onChange={v => setF('surgical_complications', v)}
                                    detail
                                    detailValue={form.complications_detail}
                                    onDetailChange={v => setF('complications_detail', v)}
                                    detailPlaceholder="Décrivez les complications…"
                                />
                                <YesNoGroup
                                    label="Hématomes faciles ?"
                                    value={form.easy_hematomas}
                                    onChange={v => setF('easy_hematomas', v)}
                                />
                                <YesNoGroup
                                    label="Cicatrices rouges ou épaisses (chéloïdes) ?"
                                    value={form.keloid_scars}
                                    onChange={v => setF('keloid_scars', v)}
                                />
                            </div>
                        </div>

                        <div style={{ background: '#F9FAFB', borderRadius: '14px', padding: '14px', border: '1px solid #F3F4F6' }}>
                            <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: '800', color: 'var(--color-primary-500)', textTransform: 'uppercase' }}>
                                Antécédents familiaux
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <YesNoGroup
                                    label="Maladies auto-immunes dans la famille ?"
                                    value={form.autoimmune_family}
                                    onChange={v => setF('autoimmune_family', v)}
                                    detail
                                    detailValue={form.autoimmune_detail}
                                    onDetailChange={v => setF('autoimmune_detail', v)}
                                    detailPlaceholder="Précisez…"
                                />
                                <Field label="Autres antécédents familiaux">
                                    <StyledInput value={form.family_history_other} onChange={e => setF('family_history_other', e.target.value)} placeholder="Ex : diabète, cancer…" />
                                </Field>
                            </div>
                        </div>



                        {/* Signature */}
                        <div style={{ background: 'white', borderRadius: '14px', padding: '16px', border: '1.5px solid #E5E7EB' }}>
                            <p style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: '700', color: '#374151' }}>
                                ✍️ Signature électronique
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <Field label="Fait à">
                                    <StyledInput value={form.signed_city} onChange={e => setF('signed_city', e.target.value)} placeholder="Marseille" />
                                </Field>
                                <Field label="Le">
                                    <StyledInput type="date" value={form.signed_date} onChange={e => setF('signed_date', e.target.value)} />
                                </Field>
                            </div>
                            <div style={{ marginTop: '12px', padding: '12px', background: '#F9FAFB', borderRadius: '10px', fontSize: '12px', color: '#6B7280', lineHeight: 1.6 }}>
                                En soumettant ce formulaire, je certifie que les informations renseignées sont exactes et sincères. Je comprends qu'elles seront utilisées dans le cadre de ma prise en charge médicale au cabinet du Dr Desouches.
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

const progress = (formStep / TOTAL_STEPS) * 100;

    return (
        <div style={pageStyle}>
            <div style={containerStyle}>
            {/* ── Logo à gauche ── */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: '8px', marginBottom: '14px' }}>
                <img src={logoSlMa} alt="SurgiLink / Medical Alliance" style={{ height: isMobile ? '65px' : '82px', objectFit: 'contain' }} />
            </div>

            {/* ── Step indicator à gauche, sous le logo ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '13px', fontWeight: '800', flexShrink: 0
                }}>{formStep}</div>
                <div>
                    <p style={{ margin: 0, fontSize: '10px', fontWeight: '700', color: 'var(--color-primary-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Étape {formStep} sur {TOTAL_STEPS}
                    </p>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#374151' }}>
                        {STEP_LABELS[formStep - 1]}
                    </p>
                </div>
            </div>


                {/* Progress bar */}
                <div style={{ height: '5px', background: '#E5E7EB', borderRadius: '10px', marginBottom: '20px', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%',
                        width: `${progress}%`,
                        background: 'linear-gradient(90deg, var(--color-primary-500), var(--color-primary-300))',
                        borderRadius: '10px',
                        transition: 'width 0.4s ease'
                    }} />
                </div>

                {/* Form content */}
                <div style={{
                    background: 'white',
                    borderRadius: '20px',
                    padding: isMobile ? '18px' : '24px',
                    boxShadow: '0 6px 24px rgba(0,0,0,0.07)',
                    border: '1px solid rgba(0,0,0,0.05)',
                    flex: 1,
                    overflowY: 'auto',
                    marginBottom: '16px'
                }}>
                    <h2 style={{ margin: '0 0 18px', fontSize: isMobile ? '16px' : '18px', fontWeight: '800', color: '#111827' }}>
                        {formStep}. {STEP_LABELS[formStep - 1]}
                    </h2>
                    {renderStep()}
                    {errorMsg && (
                        <div style={{ marginTop: '16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px', fontSize: '13px', color: '#DC2626' }}>
                            ⚠️ {errorMsg}
                        </div>
                    )}
                </div>

                {/* Navigation buttons */}
                <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                    {formStep > 1 && (
                        <button
                            onClick={() => setFormStep(s => s - 1)}
                            style={{
                                height: '50px',
                                padding: '0 20px',
                                background: 'white',
                                border: '1.5px solid #E5E7EB',
                                borderRadius: '14px',
                                color: '#6B7280',
                                fontWeight: '700',
                                fontSize: '14px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.15s'
                            }}
                        >
                            <ArrowLeft size={18} /> Retour
                        </button>
                    )}
                    {formStep < TOTAL_STEPS ? (
                        <button
                            onClick={handleNext}
                            style={{
                                flex: 1,
                                height: '50px',
                                background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))',
                                border: 'none',
                                borderRadius: '14px',
                                color: 'white',
                                fontWeight: '800',
                                fontSize: '15px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: '0 6px 18px rgba(var(--color-primary-rgb), 0.35)',
                                transition: 'all 0.15s',
                                letterSpacing: '0.02em'
                            }}
                        >
                            Continuer <ArrowRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                if (validateCurrentStep()) {
                                    handleSubmit();
                                }
                            }}
                            style={{
                                flex: 1,
                                height: '50px',
                                background: 'linear-gradient(135deg, #059669, #10B981)',
                                border: 'none',
                                borderRadius: '14px',
                                color: 'white',
                                fontWeight: '800',
                                fontSize: '15px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: '0 6px 18px rgba(16,185,129,0.35)',
                                letterSpacing: '0.02em'
                            }}
                        >
                            <CheckCircle size={20} /> Envoyer ma fiche
                        </button>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                input[type="date"]::-webkit-calendar-picker-indicator {
                    cursor: pointer;
                    opacity: 0.6;
                }
            `}</style>
        </div>
    );
}
