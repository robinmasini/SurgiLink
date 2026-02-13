import { useState, useEffect } from 'react';
import { X, Clipboard, Clock, Activity, Loader, Info, Scissors, User, Phone, Mail } from 'lucide-react';
import { pathwayConfig } from '../config/pathway.config';
import { getResponses } from '../services/pathwayService';
import QuestionRenderer from './pathway/QuestionRenderer';
import AlertBanner from './pathway/AlertBanner';
import { formatDateFR } from '../utils/dateUtils';

export default function PatientPreviewModal({ isOpen, onClose, patient }) {
    const [activeTab, setActiveTab] = useState('J7');
    const [responses, setResponses] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && patient?.id) {
            loadResponses();
        }
    }, [isOpen, patient?.id, activeTab]);

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

    if (!isOpen) return null;

    const config = pathwayConfig[activeTab];

    const getTabStyle = (tab) => ({
        padding: '12px 24px',
        cursor: 'pointer',
        borderBottom: activeTab === tab ? '2px solid var(--color-primary-500)' : '2px solid transparent',
        color: activeTab === tab ? 'var(--color-primary-600)' : 'var(--color-gray-500)',
        fontWeight: activeTab === tab ? '600' : '400',
        transition: 'all 0.2s',
        fontSize: 'var(--font-size-sm)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    });

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
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
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
                maxWidth: '800px',
                height: '90vh',
                borderRadius: 'var(--border-radius-2xl)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{
                    padding: 'var(--spacing-6)',
                    borderBottom: '1px solid var(--color-gray-100)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--color-white)'
                }}>
                    <div>
                        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '700', margin: 0 }}>Aperçu Patient : {patient?.name}</h2>
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

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    background: 'var(--color-gray-50)',
                    padding: '0 var(--spacing-6)',
                    borderBottom: '1px solid var(--color-gray-100)'
                }}>
                    <div style={getTabStyle('J7')} onClick={() => setActiveTab('J7')}>
                        J-7 Préparation
                    </div>
                    <div style={getTabStyle('J2')} onClick={() => setActiveTab('J2')}>
                        J-2 Consignes
                    </div>
                    <div style={getTabStyle('J1')} onClick={() => setActiveTab('J1')}>
                        J+1 Suivi
                    </div>
                    <div style={getTabStyle('J2_Satisfaction')} onClick={() => setActiveTab('J2_Satisfaction')}>
                        J+2 Avis
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
                                    {activeTab === 'J7' ? 'J-7 • Préparation' :
                                        activeTab === 'J2' ? 'J-2 • Consignes' :
                                            activeTab === 'J1' ? 'J+1 • Suivi' :
                                                'J+2 • Satisfaction'}
                                </div>
                            </div>

                            {/* Time Alert (Specific to J7/J2 logic if needed) */}
                            {['J7', 'J2'].includes(activeTab) && (
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
                                                        <div style={{
                                                            padding: '8px 16px',
                                                            borderRadius: '8px',
                                                            fontSize: 'var(--font-size-xs)',
                                                            background: responses[item.id] === true ? 'var(--color-primary-500)' : 'var(--color-gray-50)',
                                                            color: responses[item.id] === true ? 'white' : 'var(--color-gray-400)',
                                                            border: 'none',
                                                            flex: 1,
                                                            textAlign: 'center'
                                                        }}>OUI</div>
                                                        <div style={{
                                                            padding: '8px 16px',
                                                            borderRadius: '8px',
                                                            fontSize: 'var(--font-size-xs)',
                                                            background: responses[item.id] === false ? 'var(--color-danger-500)' : 'var(--color-gray-50)',
                                                            color: responses[item.id] === false ? 'white' : 'var(--color-gray-400)',
                                                            border: 'none',
                                                            flex: 1,
                                                            textAlign: 'center'
                                                        }}>NON</div>
                                                    </>
                                                )}
                                                {item.type === 'text' && (
                                                    <div style={{
                                                        padding: '12px',
                                                        borderRadius: '8px',
                                                        background: 'var(--color-gray-50)',
                                                        color: responses[item.id] ? 'var(--color-gray-800)' : 'var(--color-gray-300)',
                                                        fontSize: 'var(--font-size-sm)',
                                                        flex: 1,
                                                        minHeight: '40px',
                                                        whiteSpace: 'pre-wrap'
                                                    }}>
                                                        {responses[item.id] || 'Non renseigné'}
                                                    </div>
                                                )}
                                                {item.type === 'slider_0_10' && (
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                            <span style={{ fontSize: '10px', color: 'var(--color-gray-400)' }}>0</span>
                                                            <span style={{ fontSize: '10px', color: 'var(--color-gray-400)' }}>5</span>
                                                            <span style={{ fontSize: '10px', color: 'var(--color-gray-400)' }}>10</span>
                                                        </div>
                                                        <div style={{
                                                            height: '8px',
                                                            background: 'var(--color-gray-100)',
                                                            borderRadius: '4px',
                                                            position: 'relative'
                                                        }}>
                                                            {responses[item.id] !== undefined && (
                                                                <div style={{
                                                                    position: 'absolute',
                                                                    left: `${responses[item.id] * 10}%`,
                                                                    top: '50%',
                                                                    transform: 'translate(-50%, -50%)',
                                                                    width: '18px',
                                                                    height: '18px',
                                                                    borderRadius: '50%',
                                                                    background: 'var(--color-primary-500)',
                                                                    border: '3px solid white',
                                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                                }} />
                                                            )}
                                                        </div>
                                                        <div style={{ textAlign: 'center', marginTop: '8px', fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--color-primary-600)' }}>
                                                            {responses[item.id] !== undefined ? `${responses[item.id]} / 10` : 'Non renseigné'}
                                                        </div>
                                                    </div>
                                                )}
                                                {/* Add more types if needed, like tri_state or multi_check if they are used in J1/J2/J7 */}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}

                            {/* Info Box Footer Mock */}
                            <div style={{
                                marginTop: 'var(--spacing-10)',
                                padding: 'var(--spacing-6)',
                                background: 'white',
                                borderRadius: '16px',
                                border: '1px solid var(--color-gray-100)',
                                textAlign: 'center'
                            }}>
                                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)', margin: 0 }}>
                                    Mode aperçu lécture seule
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
