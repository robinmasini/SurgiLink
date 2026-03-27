import React, { useState, useEffect } from 'react';
import {
    X,
    Bell,
    Save,
    AlertTriangle,
    Clock,
    TrendingDown,
    RefreshCw,
    CheckCircle2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function SMSAlarmsModal({ isOpen, onClose, onSuccess }) {
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState({
        financial_impact_unit: 2450,
        status_rules: {
            no_portal_access_hours: 24,
            j7_incomplete_days: 7,
            j2_incomplete_days: 2,
            j3_critical_upgrade: 3,
            progress_warning_threshold: 50,
            progress_critical_threshold: 80
        },
        reminder_offsets: {
            welcome: -10,
            j7: -7,
            j2: -2,
            j1: -1,
            j0: 0,
            j1_postop: 1,
            j4_satisfaction: 4,
            esatis: 4
        }
    });

    useEffect(() => {
        if (isOpen) {
            loadSettings();
        }
    }, [isOpen]);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('app_settings')
                .select('*');

            if (error) throw error;

            if (data && data.length > 0) {
                const newSettings = { ...settings };
                data.forEach(item => {
                    if (item.key === 'financial_impact_unit') {
                        newSettings.financial_impact_unit = parseInt(item.value);
                    } else if (item.key === 'status_rules' || item.key === 'reminder_offsets') {
                        newSettings[item.key] = typeof item.value === 'string' ? JSON.parse(item.value) : item.value;
                    }
                });
                setSettings(newSettings);
            }
        } catch (err) {
            console.error('Error loading settings:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updates = [
                { key: 'financial_impact_unit', value: settings.financial_impact_unit.toString() },
                { key: 'status_rules', value: settings.status_rules },
                { key: 'reminder_offsets', value: settings.reminder_offsets }
            ];

            for (const update of updates) {
                const { error } = await supabase
                    .from('app_settings')
                    .upsert(update);
                if (error) throw error;
            }

            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error('Error saving settings:', err);
            alert('Erreur lors de la sauvegarde : ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(8px)',
            padding: '20px'
        }}>
            <div className="card fade-in" style={{
                width: '100%',
                maxWidth: '650px',
                background: 'white',
                borderRadius: 'var(--radius-2xl)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '90vh'
            }}>
                {/* Header */}
                <div style={{
                    padding: 'var(--spacing-6) var(--spacing-8)',
                    background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-800))',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Bell size={24} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '800', margin: 0 }}>Alarmes & Pilotage SMS</h2>
                            <p style={{ fontSize: '12px', opacity: 0.8, margin: 0 }}>Configurez les seuils de vigilance et l'impact économique</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        color: 'white',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                    }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: 'var(--spacing-8)', overflowY: 'auto' }}>
                    {isLoading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-4)', padding: 'var(--spacing-8)' }}>
                            <RefreshCw size={40} className="animate-spin" style={{ color: 'var(--color-primary-500)' }} />
                            <p style={{ color: 'var(--color-gray-500)', fontWeight: '600' }}>Chargement des réglages...</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>

                            {/* Financial Impact */}
                            <section>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-4)' }}>
                                    <TrendingDown size={18} style={{ color: 'var(--color-danger-500)' }} />
                                    <h3 style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-gray-500)', margin: 0 }}>
                                        Impact Économique Potentiel
                                    </h3>
                                </div>
                                <div className="card" style={{ padding: 'var(--spacing-5)', background: 'var(--color-gray-50)', border: '1px solid var(--color-gray-100)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>
                                                Coût moyen par patient non-validé (€)
                                            </label>
                                            <input
                                                type="number"
                                                className="input"
                                                value={settings.financial_impact_unit}
                                                onChange={(e) => setSettings({ ...settings, financial_impact_unit: parseInt(e.target.value) || 0 })}
                                                style={{ fontSize: '18px', fontWeight: '800' }}
                                            />
                                        </div>
                                        <div style={{
                                            padding: '12px 20px',
                                            background: 'white',
                                            borderRadius: '12px',
                                            border: '1px solid var(--color-gray-200)',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '10px', color: 'var(--color-gray-400)', fontWeight: '700', textTransform: 'uppercase' }}>Exemple (4 patients)</div>
                                            <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--color-danger-600)' }}>-{settings.financial_impact_unit * 4}€</div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Status Rules */}
                            <section>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-4)' }}>
                                    <AlertTriangle size={18} style={{ color: 'var(--color-warning-500)' }} />
                                    <h3 style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-gray-500)', margin: 0 }}>
                                        Règles des Éclairs (Vigilance)
                                    </h3>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
                                    <div className="card" style={{ padding: 'var(--spacing-4)' }}>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--color-warning-600)', marginBottom: '8px' }}>
                                            VIGILANCE PARTICULIÈRE (ALERTE)
                                        </label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div>
                                                <span style={{ fontSize: '11px', color: 'var(--color-gray-500)' }}>Pas d'accès au portail après :</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                                    <input
                                                        type="number"
                                                        className="input"
                                                        value={settings.status_rules.no_portal_access_hours}
                                                        onChange={(e) => setSettings({ ...settings, status_rules: { ...settings.status_rules, no_portal_access_hours: parseInt(e.target.value) || 0 } })}
                                                        style={{ padding: '4px 8px', width: '60px' }}
                                                    />
                                                    <span style={{ fontSize: '12px', fontWeight: '600' }}>Heures</span>
                                                </div>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: '11px', color: 'var(--color-gray-500)' }}>Questionnaire J-7 non-fait à :</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                                    <input
                                                        type="number"
                                                        className="input"
                                                        value={settings.status_rules.j7_incomplete_days}
                                                        onChange={(e) => setSettings({ ...settings, status_rules: { ...settings.status_rules, j7_incomplete_days: parseInt(e.target.value) || 0 } })}
                                                        style={{ padding: '4px 8px', width: '60px' }}
                                                    />
                                                    <span style={{ fontSize: '12px', fontWeight: '600' }}>Jours</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card" style={{ padding: 'var(--spacing-4)' }}>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--color-danger-600)', marginBottom: '8px' }}>
                                            VIGILANCE PRIORITAIRE (CRITIQUE)
                                        </label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div>
                                                <span style={{ fontSize: '11px', color: 'var(--color-gray-500)' }}>Protocole incomplet à partir de :</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                                    <input
                                                        type="number"
                                                        className="input"
                                                        value={settings.status_rules.j3_critical_upgrade}
                                                        onChange={(e) => setSettings({ ...settings, status_rules: { ...settings.status_rules, j3_critical_upgrade: parseInt(e.target.value) || 0 } })}
                                                        style={{ padding: '4px 8px', width: '60px' }}
                                                    />
                                                    <span style={{ fontSize: '12px', fontWeight: '600' }}>J-(x)</span>
                                                </div>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: '11px', color: 'var(--color-gray-500)' }}>Seuil critique de complétion :</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                                    <input
                                                        type="number"
                                                        className="input"
                                                        value={settings.status_rules.progress_critical_threshold}
                                                        onChange={(e) => setSettings({ ...settings, status_rules: { ...settings.status_rules, progress_critical_threshold: parseInt(e.target.value) || 0 } })}
                                                        style={{ padding: '4px 8px', width: '60px' }}
                                                    />
                                                    <span style={{ fontSize: '12px', fontWeight: '600' }}>%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* SMS Schedule */}
                            <section>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-4)' }}>
                                    <Clock size={18} style={{ color: 'var(--color-primary-500)' }} />
                                    <h3 style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-gray-500)', margin: 0 }}>
                                        Délais des Rappels SMS (Planification)
                                    </h3>
                                </div>
                                <div className="card" style={{ padding: 'var(--spacing-5)' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--spacing-4)' }}>
                                        {['j7', 'j2', 'j1', 'j0'].map(key => (
                                            <div key={key}>
                                                <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: 'var(--color-gray-400)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                    {key.toUpperCase()}
                                                </label>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <input
                                                        type="number"
                                                        className="input"
                                                        value={settings.reminder_offsets[key]}
                                                        onChange={(e) => setSettings({
                                                            ...settings,
                                                            reminder_offsets: { ...settings.reminder_offsets, [key]: parseInt(e.target.value) || 0 }
                                                        })}
                                                        style={{ padding: '4px 8px', fontWeight: '700' }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{
                                        marginTop: 'var(--spacing-4)',
                                        padding: 'var(--spacing-3)',
                                        background: 'var(--color-primary-50)',
                                        borderRadius: '8px',
                                        fontSize: '11px',
                                        color: 'var(--color-primary-700)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <Clock size={14} />
                                        Ces délais s'appliquent lors de la création d'un nouveau patient.
                                    </div>
                                </div>
                            </section>

                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: 'var(--spacing-6) var(--spacing-8)',
                    background: 'var(--color-gray-50)',
                    borderTop: '1px solid var(--color-gray-100)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 'var(--spacing-4)'
                }}>
                    <button
                        onClick={onClose}
                        className="btn btn-secondary"
                        style={{ padding: '10px 24px', borderRadius: '12px' }}
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || isLoading}
                        className="btn btn-primary"
                        style={{
                            padding: '10px 32px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-2)',
                            boxShadow: '0 4px 12px rgba(var(--color-primary-500-rgb), 0.3)'
                        }}
                    >
                        {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                        <span>{isSaving ? 'Enregistrement...' : 'Valider les réglages'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
