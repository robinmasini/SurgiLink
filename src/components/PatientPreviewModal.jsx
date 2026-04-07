import { useState, useEffect } from 'react';
import { X, Clipboard, Clock, Activity, Loader, Scissors, User } from 'lucide-react';
import { pathwayConfig, getScreenItems } from '../config/pathway.config';
import { getResponses, saveResponse, markScreenCompleted } from '../services/pathwayService';
import QuestionRenderer from './pathway/QuestionRenderer';
import AlertBanner from './pathway/AlertBanner';

// All 7 SMS steps in order with their specific alert color coding
const ALL_TABS = [
    { key: 'J7', label: 'J-7', sublabel: 'Préparation', color: null },
    { key: 'J2', label: 'J-2', sublabel: 'Consignes', color: 'red' },
    { key: 'J1_PreOp', label: 'J-1', sublabel: 'Veille', color: 'red' },
    { key: 'J1', label: 'J+1', sublabel: 'Suivi', color: 'red' },
    { key: 'J4_Satisfaction', label: 'J+4', sublabel: 'Avis', color: 'orange' },
];

export default function PatientPreviewModal({ isOpen, onClose, patient, onResponseSaved, onStatusChange, initialScreen }) {
    const [activeTab, setActiveTab] = useState('J7');

    useEffect(() => {
        if (isOpen && initialScreen) {
            // Map common labels to the key if needed
            const mapping = {
                'J-7': 'J7',
                'J-2': 'J2',
                'J-1': 'J1_PreOp',
                'J+1': 'J1',
                'J+4': 'J4_Satisfaction',
                'E-SATIS': 'J4_Satisfaction'
            };
            const target = mapping[initialScreen] || initialScreen;
            if (ALL_TABS.some(t => t.key === target)) {
                setActiveTab(target);
            }
        }
    }, [isOpen, initialScreen]);
    const [responses, setResponses] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(null);
    const [validating, setValidating] = useState(false);
    // Per-tab completion: { J7: { answered, total }, ... }
    const [tabProgress, setTabProgress] = useState({});

    useEffect(() => {
        if (isOpen && patient?.id) {
            loadResponses();
        }
    }, [isOpen, patient?.id, activeTab]);

    // Load progress for all tabs when modal opens
    useEffect(() => {
        if (isOpen && patient?.id) {
            loadAllProgress();
        }
    }, [isOpen, patient?.id]);

    const loadResponses = async () => {
        setLoading(true);
        try {
            const data = await getResponses(patient.id, activeTab);
            setResponses(data);
        } catch (error) {
            console.error('Error loading responses:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAllProgress = async () => {
        const progress = {};
        for (const tab of ALL_TABS) {
            try {
                const data = await getResponses(patient.id, tab.key);
                const items = getScreenItems(tab.key).filter(i => i.required !== false);
                const answered = items.filter(i => {
                    const v = data[i.id];
                    return v !== undefined && v !== null && v !== '';
                }).length;
                progress[tab.key] = { answered, total: items.length };
            } catch {
                progress[tab.key] = { answered: 0, total: getScreenItems(tab.key).filter(i => i.required !== false).length };
            }
        }
        setTabProgress(progress);
    };

    const handleResponseChange = async (itemId, value) => {
        const oldResponses = { ...responses };
        setResponses(prev => ({ ...prev, [itemId]: value }));
        setSaving(itemId);

        try {
            const res = await saveResponse(patient.id, activeTab, itemId, value);
            if (res.success) {
                if (onResponseSaved) onResponseSaved(activeTab, itemId, value);
                // Update progress for current tab
                setTabProgress(prev => {
                    const items = getScreenItems(activeTab).filter(i => i.required !== false);
                    const newResponses = { ...responses, [itemId]: value };
                    const answered = items.filter(i => {
                        const v = newResponses[i.id];
                        return v !== undefined && v !== null && v !== '';
                    }).length;
                    return { ...prev, [activeTab]: { answered, total: items.length } };
                });
            } else {
                setResponses(oldResponses);
                alert("Erreur lors de l'enregistrement de la réponse.");
            }
        } catch (error) {
            console.error('Error saving response:', error);
            setResponses(oldResponses);
        } finally {
            setSaving(null);
        }
    };

    const handleValider = async () => {
        setValidating(true);
        try {
            const res = await markScreenCompleted(patient.id, activeTab);
            if (res.success) {
                if (onStatusChange) onStatusChange();
                alert(`Questionnaire ${activeTab} validé avec succès !`);
                onClose();
            } else {
                alert("Erreur lors de la validation du questionnaire.");
            }
        } catch (error) {
            console.error('Error validating screen:', error);
        } finally {
            setValidating(false);
        }
    };

    if (!isOpen) return null;

    const config = pathwayConfig[activeTab];
    const progress = tabProgress[activeTab] || { answered: 0, total: 0 };
    const progressPct = progress.total > 0 ? Math.round((progress.answered / progress.total) * 100) : 0;

    const getIcon = (sectionId) => {
        switch (sectionId) {
            case 'administrative': return <Clipboard size={18} />;
            case 'preparation': return <Scissors size={18} />;
            case 'companion': return <User size={18} />;
            case 'documents': return <Clipboard size={18} />;
            case 'fasting': return <Clock size={18} />;
            case 'hygiene': return <Activity size={18} />;
            case 'medical': return <Activity size={18} />;
            case 'safety': return <Activity size={18} />;
            case 'feedback': return <Activity size={18} />;
            default: return <Clipboard size={18} />;
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'var(--spacing-4)'
        }} onClick={onClose}>
            <div style={{
                background: 'white',
                width: '100%',
                maxWidth: '860px',
                height: '90vh',
                borderRadius: 'var(--border-radius-2xl)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{
                    padding: 'var(--spacing-5) var(--spacing-6)',
                    borderBottom: '1px solid var(--color-gray-100)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--color-white)'
                }}>
                    <div>
                        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '700', margin: 0 }}>
                            Aperçu Patient : {patient?.name}
                        </h2>
                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)', margin: '4px 0 0 0' }}>
                            Visualisez ce que le patient voit sur son portail
                        </p>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'var(--color-gray-50)',
                        border: 'none',
                        padding: '8px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        color: 'var(--color-gray-400)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs — scrollable horizontally for 7 tabs */}
                <div style={{
                    display: 'flex',
                    background: 'var(--color-gray-50)',
                    borderBottom: '1px solid var(--color-gray-100)',
                    overflowX: 'auto',
                    flexShrink: 0
                }}>
                    {ALL_TABS.map(tab => {
                        const p = tabProgress[tab.key];
                        const isComplete = p && p.total > 0 && p.answered === p.total;
                        const isActive = activeTab === tab.key;
                        const tabColor = tab.color === 'red'
                            ? '#dc2626'
                            : tab.color === 'orange'
                                ? '#ea580c'
                                : 'var(--color-primary-600)';
                        return (
                            <div
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    padding: '10px 16px',
                                    cursor: 'pointer',
                                    borderBottom: isActive ? `2px solid ${tabColor}` : '2px solid transparent',
                                    color: isActive ? tabColor : tab.color ? tabColor : 'var(--color-gray-500)',
                                    fontWeight: isActive ? '600' : '400',
                                    transition: 'all 0.2s',
                                    fontSize: 'var(--font-size-sm)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '2px',
                                    whiteSpace: 'nowrap',
                                    minWidth: '72px',
                                    flexShrink: 0
                                }}
                            >
                                <span style={{ fontWeight: '700', fontSize: '13px' }}>{tab.label}</span>
                                <span style={{ fontSize: '10px', opacity: 0.7 }}>{tab.sublabel}</span>
                                {/* Mini progress dot */}
                                {p && p.total > 0 && (
                                    <div style={{
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        background: isComplete
                                            ? 'var(--color-success-500)'
                                            : p.answered > 0
                                                ? 'var(--color-warning-500)'
                                                : 'var(--color-gray-300)',
                                        marginTop: '2px'
                                    }} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Per-tab progress bar */}
                <div style={{
                    padding: '10px var(--spacing-6) 8px',
                    background: 'white',
                    borderBottom: '1px solid var(--color-gray-100)',
                    flexShrink: 0
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', fontWeight: '500' }}>
                            Protocole {ALL_TABS.find(t => t.key === activeTab)?.label}
                        </span>
                        <span style={{
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: '700',
                            color: progressPct === 100
                                ? 'var(--color-success-600)'
                                : progressPct > 0
                                    ? 'var(--color-warning-600)'
                                    : 'var(--color-gray-400)'
                        }}>
                            {progress.answered}/{progress.total} questions · {progressPct}%
                        </span>
                    </div>
                    <div style={{
                        height: '6px',
                        background: 'var(--color-gray-100)',
                        borderRadius: '3px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            height: '100%',
                            width: `${progressPct}%`,
                            background: progressPct === 100
                                ? 'var(--color-success-500)'
                                : progressPct > 0
                                    ? 'var(--color-warning-500)'
                                    : 'transparent',
                            borderRadius: '3px',
                            transition: 'width 0.4s ease'
                        }} />
                    </div>
                </div>

                {/* Content Area */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: 'var(--spacing-6)',
                    background: '#f8fafc'
                }}>
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 'var(--spacing-4)' }}>
                            <Loader className="animate-spin" size={32} color="var(--color-primary-500)" />
                            <p style={{ color: 'var(--color-gray-500)' }}>Chargement de l'aperçu...</p>
                        </div>
                    ) : (
                        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                            {/* Patient Header (Mock of mobile view) */}
                            <div style={{
                                background: 'white',
                                borderRadius: '16px',
                                padding: 'var(--spacing-6)',
                                marginBottom: 'var(--spacing-6)',
                                textAlign: 'center',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                            }}>
                                <h3 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-1)' }}>Dossier Médical</h3>
                                <div style={{ color: 'var(--color-primary-600)', fontWeight: '600' }}>
                                    {ALL_TABS.find(t => t.key === activeTab)?.label} • {ALL_TABS.find(t => t.key === activeTab)?.sublabel}
                                </div>
                            </div>

                            {/* Time Alert for pre-op steps */}
                            {['J7', 'J2', 'J1_PreOp'].includes(activeTab) && (
                                <AlertBanner
                                    type="info"
                                    title={`Arrivée prévue à ${patient?.surgery_time || '07:30'}`}
                                    message="Rendez-vous à l'accueil principal. Prévoyez d'arriver 15 min avant. À apporter : pièce d'identité + documents."
                                />
                            )}

                            {/* Sections Mapping */}
                            {config?.sections.map((section) => (
                                <div key={section.id} style={{ marginTop: 'var(--spacing-8)' }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--spacing-3)',
                                        marginBottom: 'var(--spacing-4)'
                                    }}>
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '10px',
                                            background: 'var(--color-primary-50)',
                                            color: 'var(--color-primary-600)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {typeof section.icon === 'string' ? <span style={{ fontSize: '18px' }}>{section.icon}</span> : getIcon(section.id)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '700', color: 'var(--color-gray-900)' }}>{section.title}</div>
                                            {section.subtitle && <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)' }}>{section.subtitle}</div>}
                                        </div>
                                    </div>

                                    {section.items.map((item) => (
                                        <div key={item.id} style={{
                                            background: 'white',
                                            borderRadius: '12px',
                                            padding: 'var(--spacing-4)',
                                            marginBottom: 'var(--spacing-3)',
                                            border: '1px solid var(--color-gray-100)',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                                        }}>
                                            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', marginBottom: 'var(--spacing-2)' }}>{item.label}</div>
                                            <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                                                {item.type === 'yes_no' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleResponseChange(item.id, true)}
                                                            disabled={saving === item.id}
                                                            style={{
                                                                padding: '8px 16px',
                                                                borderRadius: '8px',
                                                                fontSize: 'var(--font-size-xs)',
                                                                background: responses[item.id] === true ? 'var(--color-primary-500)' : 'var(--color-gray-50)',
                                                                color: responses[item.id] === true ? 'white' : 'var(--color-gray-400)',
                                                                border: 'none',
                                                                flex: 1,
                                                                textAlign: 'center',
                                                                cursor: 'pointer',
                                                                fontWeight: responses[item.id] === true ? '600' : '400',
                                                                transition: 'all 0.2s',
                                                                opacity: saving === item.id ? 0.7 : 1
                                                            }}
                                                        >OUI</button>
                                                        <button
                                                            onClick={() => handleResponseChange(item.id, false)}
                                                            disabled={saving === item.id}
                                                            style={{
                                                                padding: '8px 16px',
                                                                borderRadius: '8px',
                                                                fontSize: 'var(--font-size-xs)',
                                                                background: responses[item.id] === false ? 'var(--color-primary-500)' : 'var(--color-gray-50)',
                                                                color: responses[item.id] === false ? 'white' : 'var(--color-gray-400)',
                                                                border: 'none',
                                                                flex: 1,
                                                                textAlign: 'center',
                                                                cursor: 'pointer',
                                                                fontWeight: responses[item.id] === false ? '600' : '400',
                                                                transition: 'all 0.2s',
                                                                opacity: saving === item.id ? 0.7 : 1
                                                            }}
                                                        >NON</button>
                                                    </>
                                                )}
                                                {item.type === 'text' && (
                                                    <textarea
                                                        value={responses[item.id] || ''}
                                                        onChange={(e) => setResponses(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                        onBlur={(e) => handleResponseChange(item.id, e.target.value)}
                                                        placeholder="Saisir une réponse..."
                                                        style={{
                                                            padding: '12px',
                                                            borderRadius: '8px',
                                                            background: 'var(--color-gray-50)',
                                                            color: 'var(--color-gray-800)',
                                                            fontSize: 'var(--font-size-sm)',
                                                            flex: 1,
                                                            minHeight: '80px',
                                                            border: '1px solid transparent',
                                                            outline: 'none',
                                                            resize: 'none',
                                                            width: '100%',
                                                            fontFamily: 'inherit',
                                                            transition: 'border-color 0.2s',
                                                            borderColor: saving === item.id ? 'var(--color-primary-300)' : 'transparent'
                                                        }}
                                                    />
                                                )}
                                                {item.type === 'slider_0_10' && (
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                            <span style={{ fontSize: '10px', color: 'var(--color-gray-400)' }}>0</span>
                                                            <span style={{ fontSize: '10px', color: 'var(--color-gray-400)' }}>5</span>
                                                            <span style={{ fontSize: '10px', color: 'var(--color-gray-400)' }}>10</span>
                                                        </div>
                                                        <div style={{
                                                            height: '24px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            position: 'relative',
                                                            cursor: 'pointer'
                                                        }} onClick={(e) => {
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            const x = e.clientX - rect.left;
                                                            const val = Math.round((x / rect.width) * 10);
                                                            handleResponseChange(item.id, Math.max(0, Math.min(10, val)));
                                                        }}>
                                                            <div style={{
                                                                height: '8px',
                                                                background: 'var(--color-gray-100)',
                                                                borderRadius: '4px',
                                                                width: '100%',
                                                                position: 'relative'
                                                            }}>
                                                                <div style={{
                                                                    position: 'absolute',
                                                                    left: 0, top: 0, bottom: 0,
                                                                    width: responses[item.id] !== undefined ? `${responses[item.id] * 10}%` : 0,
                                                                    background: 'var(--color-primary-200)',
                                                                    borderRadius: '4px'
                                                                }} />
                                                                {responses[item.id] !== undefined && (
                                                                    <div style={{
                                                                        position: 'absolute',
                                                                        left: `${responses[item.id] * 10}%`,
                                                                        top: '50%',
                                                                        transform: 'translate(-50%, -50%)',
                                                                        width: '20px',
                                                                        height: '20px',
                                                                        borderRadius: '50%',
                                                                        background: 'var(--color-primary-500)',
                                                                        border: '3px solid white',
                                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                                                        zIndex: 2
                                                                    }} />
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div style={{ textAlign: 'center', marginTop: '8px', fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--color-primary-600)' }}>
                                                            {responses[item.id] !== undefined ? `${responses[item.id]} / 10` : 'Non renseigné'}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}

                            {/* Info Box Footer */}
                            <div style={{
                                marginTop: 'var(--spacing-10)',
                                padding: 'var(--spacing-6)',
                                background: 'white',
                                borderRadius: '16px',
                                border: '1px solid var(--color-gray-100)',
                                textAlign: 'center'
                            }}>
                                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)', margin: 0 }}>
                                    Les modifications sont enregistrées automatiquement
                                </p>
                            </div>

                            {/* Validation Button */}
                            <div style={{ marginTop: 'var(--spacing-8)', marginBottom: 'var(--spacing-12)' }}>
                                <button
                                    onClick={handleValider}
                                    disabled={validating}
                                    style={{
                                        width: '100%',
                                        padding: 'var(--spacing-4)',
                                        borderRadius: '12px',
                                        background: 'var(--color-primary-600)',
                                        color: 'white',
                                        border: 'none',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 'var(--spacing-2)',
                                        transition: 'all 0.2s',
                                        opacity: validating ? 0.7 : 1
                                    }}
                                >
                                    {validating ? (
                                        <>
                                            <Loader className="animate-spin" size={18} />
                                            Validation en cours...
                                        </>
                                    ) : (
                                        <>Valider le questionnaire {ALL_TABS.find(t => t.key === activeTab)?.label}</>
                                    )}
                                </button>
                                <p style={{
                                    fontSize: 'var(--font-size-xs)',
                                    color: 'var(--color-gray-400)',
                                    textAlign: 'center',
                                    marginTop: 'var(--spacing-3)'
                                }}>
                                    En validant, vous confirmez que les informations sont exactes et complètes.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div style={{
                    padding: 'var(--spacing-4) var(--spacing-6)',
                    borderTop: '1px solid var(--color-gray-100)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    background: 'white'
                }}>
                    <button onClick={onClose} className="btn btn-primary">
                        Fermer l'aperçu
                    </button>
                </div>
            </div>
        </div>
    );
}
