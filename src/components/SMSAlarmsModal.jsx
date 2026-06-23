import React from 'react';
import {
    X,
    Clock,
    ShieldCheck,
    Zap,
    Smartphone,
    RefreshCw,
    Loader2
} from 'lucide-react';
import { processPendingReminders } from '../services/reminderService';
import { supabase } from '../lib/supabase';

export default function SMSAlarmsModal({ isOpen, onClose }) {
    const [isProcessingCron, setIsProcessingCron] = React.useState(false);

    React.useEffect(() => {
        if (!isOpen) return;

        const checkAndFixOffsets = async () => {
            try {
                const { data, error } = await supabase
                    .from('app_settings')
                    .select('*')
                    .eq('key', 'reminder_offsets')
                    .maybeSingle();

                if (error) {
                    console.error("[SettingsAutoFix] Error fetching app settings:", error);
                    return;
                }

                if (data && data.value) {
                    const value = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
                    if (value.welcome !== -18) {
                        console.log("[SettingsAutoFix] Welcome offset is currently", value.welcome, ". Updating to -18...");
                        const updatedValue = { ...value, welcome: -18 };
                        const { error: updateError } = await supabase
                            .from('app_settings')
                            .update({ value: updatedValue })
                            .eq('key', 'reminder_offsets');

                        if (updateError) {
                            console.error("[SettingsAutoFix] Error updating settings:", updateError);
                        } else {
                            console.log("[SettingsAutoFix] Successfully updated welcome offset to -18 in the database.");
                        }
                    }
                }
            } catch (err) {
                console.error("[SettingsAutoFix] Unexpected error:", err);
            }
        };

        checkAndFixOffsets();
    }, [isOpen]);

    const handleForceCron = async () => {
        if (!window.confirm("Voulez-vous forcer l'analyse et l'envoi de tous les SMS en attente pour aujourd'hui ?")) {
            return;
        }
        setIsProcessingCron(true);
        try {
            const result = await processPendingReminders(supabase);
            if (result.blocked) {
                alert(`L'envoi automatique est bloqué : en dehors des heures autorisées (08h00 - 23h00).`);
            } else {
                alert(`Synchronisation terminée.\nSMS traités : ${result.processed}\nSMS envoyés avec succès : ${result.sent}\nÉchecs : ${result.failed}`);
            }
        } catch (error) {
            console.error("Erreur:", error);
            alert("Une erreur est survenue lors de l'envoi des SMS.");
        } finally {
            setIsProcessingCron(false);
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
                maxWidth: '600px',
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
                            <Smartphone size={24} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '800', margin: 0 }}>Planification & Délivrance SMS</h2>
                            <p style={{ fontSize: '12px', opacity: 0.8, margin: 0 }}>Règles d'envoi et conformité légale de l'assistant</p>
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

                {/* Content */}
                <div style={{ padding: 'var(--spacing-8)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
                    
                    {/* Time Window Section */}
                    <div className="card" style={{ 
                        padding: 'var(--spacing-5)', 
                        background: 'linear-gradient(135deg, #FFFDF5 0%, #FFF 100%)', 
                        border: '1px solid #FEF3C7',
                        borderRadius: '16px'
                    }}>
                        <div style={{ display: 'flex', gap: 'var(--spacing-4)' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                background: '#FEF3C7',
                                color: '#D97706',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <Clock size={22} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#92400E', margin: '0 0 6px 0' }}>
                                    Créneau Légal Obligatoire (8h00 - 20h00)
                                </h3>
                                <p style={{ fontSize: '13px', color: '#78350F', lineHeight: '1.5', margin: 0 }}>
                                    Conformément à la réglementation française des télécommunications, aucun SMS automatisé n'est expédié en dehors de la plage <strong>08h00 - 20h00</strong>. Les envois de nuit ou tôt le matin sont strictement bloqués pour le respect des patients.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Automatic Triggers Section */}
                    <div className="card" style={{ 
                        padding: 'var(--spacing-5)', 
                        background: 'var(--color-gray-50)', 
                        border: '1px solid var(--color-gray-100)',
                        borderRadius: '16px'
                    }}>
                        <div style={{ display: 'flex', gap: 'var(--spacing-4)' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                background: 'var(--color-primary-50)',
                                color: 'var(--color-primary-600)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <Zap size={22} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--color-primary-900)', margin: '0 0 6px 0' }}>
                                    Déclenchement Automatique Quotidien
                                </h3>
                                <p style={{ fontSize: '13px', color: 'var(--color-gray-600)', lineHeight: '1.5', margin: '0 0 12px 0' }}>
                                    Les rappels de dossier (Bienvenue, J-7, J-1, Jour J) programmés à <strong>8h30</strong> sont traités automatiquement via deux tâches planifiées indépendantes sur nos serveurs :
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--color-gray-700)' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-primary-500)' }} />
                                        <span><strong>Tâche Matin (8h30 locale)</strong> : Déclenchement à 8h30 en été (6h30 UTC) et 8h30 en hiver (7h30 UTC).</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--color-gray-700)' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-primary-500)' }} />
                                        <span><strong>Tâche Soir (18h00 locale)</strong> : Passage de sécurité à 18h00 en été (16h00 UTC) et 17h00 en hiver (16h00 UTC).</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Anti-Spam and Safety Section */}
                    <div className="card" style={{ 
                        padding: 'var(--spacing-5)', 
                        background: 'linear-gradient(135deg, #F0FDF4 0%, #FFF 100%)', 
                        border: '1px solid #DCFCE7',
                        borderRadius: '16px'
                    }}>
                        <div style={{ display: 'flex', gap: 'var(--spacing-4)' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                background: '#DCFCE7',
                                color: '#16A34A',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <ShieldCheck size={22} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#166534', margin: '0 0 6px 0' }}>
                                    Sécurités & Règles Anti-Spam
                                </h3>
                                <p style={{ fontSize: '13px', color: '#14532D', lineHeight: '1.5', margin: '0 0 10px 0' }}>
                                    Pour éviter toute sur-sollicitation et garantir le confort du patient, l'assistant applique les règles de sécurité suivantes :
                                </p>
                                <ul style={{ fontSize: '12px', color: '#14532D', margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
                                    <li><strong>Garde-fou horaire strict</strong> : Le code bloque instantanément l'exécution si une tâche automatique démarre avant 08h00 ou après 20h00 (par exemple à 7h30 en hiver).</li>
                                    <li><strong>Limite d'envoi</strong> : Un délai minimal de <strong>24 heures</strong> est imposé entre deux SMS pour un même patient.</li>
                                    <li><strong>Nombre maximal de rappels</strong> : 3 rappels automatiques au maximum sont envoyés par étape de suivi.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div style={{
                    padding: 'var(--spacing-6) var(--spacing-8)',
                    background: 'var(--color-gray-50)',
                    borderTop: '1px solid var(--color-gray-100)',
                    display: 'flex',
                    flexWrap: 'wrap-reverse',
                    gap: '16px',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <button
                        onClick={handleForceCron}
                        disabled={isProcessingCron}
                        style={{
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            gap: '8px', 
                            border: '1px solid rgba(109, 140, 124, 0.2)', 
                            background: 'linear-gradient(135deg, #f8faf9 0%, #eef2f0 100%)', 
                            color: 'var(--color-primary-700)', 
                            borderRadius: '14px', 
                            padding: '12px 20px', 
                            fontWeight: '700',
                            cursor: isProcessingCron ? 'not-allowed' : 'pointer',
                            boxShadow: '0 2px 8px rgba(109, 140, 124, 0.08)',
                            transition: 'all 0.2s ease',
                            flex: '1 1 auto',
                            minWidth: '200px'
                        }}
                        onMouseOver={(e) => {
                            if (isProcessingCron) return;
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(109, 140, 124, 0.15)';
                            e.currentTarget.style.background = 'linear-gradient(135deg, #ffffff 0%, #f3f6f4 100%)';
                        }}
                        onMouseOut={(e) => {
                            if (isProcessingCron) return;
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(109, 140, 124, 0.08)';
                            e.currentTarget.style.background = 'linear-gradient(135deg, #f8faf9 0%, #eef2f0 100%)';
                        }}
                    >
                        {isProcessingCron ? <Loader2 size={18} className="spin" /> : <RefreshCw size={18} />}
                        <span>Forcer le scan SMS</span>
                    </button>
                    <button
                        onClick={onClose}
                        className="btn btn-primary"
                        style={{
                            padding: '12px 32px',
                            borderRadius: '14px',
                            fontWeight: '700',
                            flex: '1 1 auto',
                            minWidth: '150px',
                            boxShadow: '0 4px 12px rgba(var(--color-primary-500-rgb), 0.3)'
                        }}
                    >
                        J'ai compris
                    </button>
                </div>
            </div>
        </div>
    );
}
