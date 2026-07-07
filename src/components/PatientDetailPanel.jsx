import React, { useState, useEffect } from 'react';
import {
    X,
    Phone,
    MessageSquare,
    CheckCircle,
    Clock,
    Calendar,
    FileText,
    ExternalLink,
    ChevronRight,
    AlertCircle,
    Copy,
    Check,
    Edit2,
    Trash2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import PatientStatusBadges from './PatientStatusBadges';
import { generatePatientToken } from '../services/tokenService';
import EditPatientModal from './EditPatientModal';


const STYLES = {
    panel: {
        position: 'sticky',
        top: 'var(--spacing-6)',
        background: 'white',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-primary-100)',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 120px)',
        overflow: 'hidden'
    },
    header: {
        padding: 'var(--spacing-5)',
        borderBottom: '1px solid var(--color-gray-100)',
        background: 'linear-gradient(to right, var(--color-primary-50), white)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    sectionTitle: {
        fontSize: 'var(--font-size-xs)',
        fontWeight: '700',
        color: 'var(--color-gray-400)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: 'var(--spacing-3)'
    },
    infoCard: {
        padding: 'var(--spacing-3)',
        background: 'var(--color-gray-50)',
        borderRadius: 'var(--radius-lg)'
    },
    actionButton: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--spacing-2)',
        padding: 'var(--spacing-3)',
        fontSize: 'var(--font-size-sm)',
        fontWeight: '700',
        borderRadius: 'var(--radius-lg)',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    }
};

export default function PatientDetailPanel({ patient, responses = [], onClose }) {
    const [token, setToken] = useState(null);
    const [copied, setCopied] = useState(false);
    const [smsLogs, setSmsLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [pendingReminders, setPendingReminders] = useState([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    useEffect(() => {
        if (patient) {
            setToken(null);
            setSmsLogs([]);
            setPendingReminders([]);
            loadSmsLogs();
            loadPendingReminders();
            loadPatientToken();
        }
    }, [patient]);

    const loadPatientToken = async () => {
        try {
            const { data, error } = await supabase
                .from('patient_review_tokens')

                .select('token')
                .eq('patient_id', patient.id)
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) throw error;
            if (data && data.length > 0) setToken(data[0].token);
        } catch (err) {
             console.error('Error loading token', err);
        }
    };

    const handleCopyToken = async () => {
        if (!token) return;
        const textToCopy = `${window.location.origin}/patient-portal/${token}`;
        try {
            await navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Copy failed', err);
        }
    };

    const loadSmsLogs = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('sms_logs')
                .select('*')
                .eq('patient_id', patient.id)
                .order('created_at', { ascending: false })
                .limit(3);

            if (error) throw error;
            setSmsLogs(data || []);
        } catch (err) {
            console.error('Error loading SMS logs:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const loadPendingReminders = async () => {
        try {
            const { data, error } = await supabase
                .from('reminder_queue')
                .select('*')
                .eq('patient_id', patient.id)
                .eq('status', 'pending')
                .order('scheduled_for', { ascending: true })
                .limit(15);

            if (error) throw error;
            setPendingReminders(data || []);
        } catch (err) {
            console.error('Error loading pending reminders:', err);
        }
    };

    const handleDeletePatient = async () => {
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le patient ${patient.name} ?`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('patients')
                .delete()
                .eq('id', patient.id);

            if (error) throw error;

            alert('Patient supprimé avec succès.');
            onClose();
            window.location.reload();
        } catch (err) {
            console.error('Erreur lors de la suppression du patient:', err);
            alert('Une erreur est survenue lors de la suppression du patient.');
        }
    };

    if (!patient) return null;

    const portalUrl = token ? `${window.location.origin}/patient-portal/${token}` : null;

    return (
        <div className="patient-detail-panel fade-in" style={STYLES.panel}>
            {/* Header */}
            <div style={STYLES.header}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-1)' }}>
                        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '700', color: 'var(--color-gray-900)', margin: 0 }}>
                            {patient.name}
                        </h2>
                        <span className="badge" style={{ fontSize: '10px', fontWeight: '700', background: 'var(--color-gray-100)', color: 'var(--color-gray-600)', padding: '4px 8px', borderRadius: '12px', border: '1px solid var(--color-gray-200)' }}>
                            {patient.language ? patient.language.toUpperCase() : 'FR'}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)' }}>
                        <Calendar size={14} />
                        <span>Chirurgie le {patient.formattedDate}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        style={{ background: 'white', border: '1px solid var(--color-gray-200)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-gray-500)' }}
                        title="Modifier le patient"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={handleDeletePatient}
                        style={{ background: 'white', border: '1px solid var(--color-danger-200)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-danger-500)' }}
                        title="Supprimer le patient"
                    >
                        <Trash2 size={16} />
                    </button>
                    <div style={{ width: '1px', height: '24px', background: 'var(--color-gray-200)', margin: '0 4px' }} />
                    <button
                        onClick={onClose}
                        style={{ background: 'white', border: '1px solid var(--color-gray-200)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-gray-700)' }}
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div style={{ padding: 'var(--spacing-5)', overflowY: 'auto', flex: 1 }}>
                {/* Actions Group - Premium Polish */}
                <div style={{ 
                    marginBottom: 'var(--spacing-6)', 
                    padding: 'var(--spacing-4)', 
                    background: 'var(--color-primary-50)', 
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--color-primary-100)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--spacing-3)'
                }}>
                    <button
                        className="btn-primary"
                        style={{
                            ...STYLES.actionButton,
                            background: 'var(--color-primary-600)',
                            color: 'white',
                            boxShadow: '0 4px 12px rgba(var(--color-primary-rgb), 0.2)'
                        }}
                        onClick={() => window.location.href = `/patient/${patient.id}`}
                    >
                        <FileText size={18} /> Accéder à la fiche patient
                    </button>

                    <button
                        style={{
                            ...STYLES.actionButton,
                            background: 'white',
                            color: 'var(--color-primary-600)',
                            border: '1px solid var(--color-primary-200)',
                            opacity: 1
                        }}
                        onClick={async () => {
                            let currentToken = token;
                            if (!currentToken) {
                                // Auto-generate token if missing for "single click" access
                                const res = await generatePatientToken(patient.id);
                                if (res.success) {
                                    currentToken = res.token;
                                    setToken(res.token);
                                } else {
                                    alert('Erreur lors de la génération du lien portal.');
                                    return;
                                }
                            }
                            const url = `${window.location.origin}/patient-portal/${currentToken}`;
                            window.open(url, '_blank');
                        }}
                    >
                        <ExternalLink size={18} /> Ouvrir Portail Patient
                    </button>


                    {token && (
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            padding: 'var(--spacing-2) var(--spacing-3)',
                            background: 'rgba(255,255,255,0.5)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '11px',
                            color: 'var(--color-primary-600)',
                            marginTop: '4px'
                        }}>
                            <span style={{ fontWeight: '600' }}>Lien direct patient</span>
                            <button 
                                onClick={handleCopyToken}
                                style={{ 
                                    background: 'none', 
                                    border: 'none', 
                                    color: copied ? 'var(--color-success-600)' : 'var(--color-primary-600)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontWeight: '700'
                                }}
                            >
                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                {copied ? 'Copié !' : 'Copier'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Stats Summary */}
                <div style={{ marginBottom: 'var(--spacing-6)' }}>
                    <div style={STYLES.sectionTitle}>Retours Patient</div>
                    <PatientStatusBadges responses={responses} daysUntil={patient.daysUntil} patientStatus={patient.status} />
                </div>

                {/* Quick Info Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 'var(--spacing-3)',
                    marginBottom: 'var(--spacing-6)'
                }}>
                    <div style={STYLES.infoCard}>
                        <div style={{ fontSize: '10px', color: 'var(--color-gray-400)', textTransform: 'uppercase', fontWeight: '700' }}>Étape</div>
                        <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--color-primary-600)' }}>{patient.daysUntil}</div>
                    </div>
                    <div style={STYLES.infoCard}>
                        <div style={{ fontSize: '10px', color: 'var(--color-gray-400)', textTransform: 'uppercase', fontWeight: '700' }}>Mode de séjour</div>
                        <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600' }}>{patient.stay_type || 'Ambulatoire'}</div>
                    </div>
                </div>

                <div style={{ padding: 'var(--spacing-3)', background: 'var(--color-primary-50)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--spacing-6)', border: '1px solid var(--color-primary-100)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--color-primary-500)', textTransform: 'uppercase', fontWeight: '700' }}>Intervention</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: '700', color: 'var(--color-primary-900)' }}>{patient.operation || 'Non renseignée'}</div>
                </div>

                {/* Hospital Manager Extracted Fields */}
                {(patient.ipp || patient.stay_number || patient.weight || patient.height || patient.room_number || patient.referring_doctor) && (
                    <div style={{ 
                        marginBottom: 'var(--spacing-6)',
                        padding: 'var(--spacing-4)',
                        background: 'linear-gradient(to bottom, #F9FBFC, #F4F7F6)',
                        border: '1px solid #E2E8F0',
                        borderRadius: 'var(--radius-lg)'
                    }}>
                        <div style={{ 
                            fontSize: '10px', 
                            fontWeight: '800', 
                            color: '#0F70B7', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.5px',
                            marginBottom: 'var(--spacing-3)'
                        }}>
                            Données Administratives
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                            {patient.ipp && (
                                <div>
                                    <div style={{ color: 'var(--color-gray-400)', fontSize: '10px', textTransform: 'uppercase' }}>IPP</div>
                                    <div style={{ fontWeight: '600', color: 'var(--color-gray-800)' }}>{patient.ipp}</div>
                                </div>
                            )}
                            {patient.stay_number && (
                                <div>
                                    <div style={{ color: 'var(--color-gray-400)', fontSize: '10px', textTransform: 'uppercase' }}>N° séjour</div>
                                    <div style={{ fontWeight: '600', color: 'var(--color-gray-800)' }}>{patient.stay_number}</div>
                                </div>
                            )}
                            {patient.room_number && (
                                <div>
                                    <div style={{ color: 'var(--color-gray-400)', fontSize: '10px', textTransform: 'uppercase' }}>Chambre</div>
                                    <div style={{ fontWeight: '600', color: 'var(--color-gray-800)' }}>{patient.room_number}</div>
                                </div>
                            )}
                            {(patient.weight || patient.height) && (
                                <div>
                                    <div style={{ color: 'var(--color-gray-400)', fontSize: '10px', textTransform: 'uppercase' }}>Taille / Poids</div>
                                    <div style={{ fontWeight: '600', color: 'var(--color-gray-800)' }}>
                                        {patient.height || '—'} / {patient.weight || '—'}
                                    </div>
                                </div>
                            )}
                            {patient.referring_doctor && (
                                <div style={{ gridColumn: 'span 2' }}>
                                    <div style={{ color: 'var(--color-gray-400)', fontSize: '10px', textTransform: 'uppercase' }}>Médecin traitant</div>
                                    <div style={{ fontWeight: '600', color: 'var(--color-gray-800)' }}>
                                        {patient.referring_doctor}
                                        {patient.referring_doctor_phone && ` (${patient.referring_doctor_phone})`}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Reminder Queue */}
                <div style={{ marginBottom: 'var(--spacing-6)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
                        <div style={STYLES.sectionTitle}>Prochains Rappels</div>
                        <Calendar size={14} style={{ color: 'var(--color-gray-400)' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                        {pendingReminders.length === 0 ? (
                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-400)', textAlign: 'center', padding: 'var(--spacing-2)', border: '1px dashed var(--color-gray-100)', borderRadius: 'var(--radius-md)' }}>
                                Aucun rappel planifié
                            </div>
                        ) : pendingReminders.map((rem, idx) => (
                            <div key={idx} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-3)',
                                padding: '10px',
                                background: 'white',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-gray-100)'
                            }}>
                                <Clock size={14} style={{ color: 'var(--color-primary-600)' }} />
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-gray-900)' }}>{rem.screen}</div>
                                    <div style={{ fontSize: '10px', color: 'var(--color-gray-500)' }}>
                                        {new Date(rem.scheduled_for).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <button
                                        onClick={() => {
                                            const mapping = {
                                                'Bienvenue': '',
                                                'J-7': 'j7',
                                                'J-1': 'j1-preop',
                                                'J-J': '',
                                                'J+1': 'j1',
                                                'J+4': 'j4',
                                                'E-SATIS': 'e-satis'
                                            };
                                            const path = mapping[rem.screen] || '';
                                            const url = token ? `${window.location.origin}/patient-portal/${token}${path ? '/' + path : ''}` : null;
                                            if (url) window.open(url, '_blank');
                                            else alert('Lien non disponible.');
                                        }}
                                        style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-primary-600)', fontSize: '10px', cursor: 'pointer', marginTop: '4px', textDecoration: 'underline' }}
                                    >
                                        Aperçu questionnaire
                                    </button>
                                </div>

                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div style={{ marginBottom: 'var(--spacing-6)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
                        <div style={STYLES.sectionTitle}>Derniers Échanges</div>
                        <Clock size={14} style={{ color: 'var(--color-gray-400)' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                        {smsLogs.length === 0 ? (
                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-400)', textAlign: 'center', padding: 'var(--spacing-4)' }}>
                                Aucun SMS envoyé récemment
                            </div>
                        ) : smsLogs.map((log, idx) => (
                            <div key={idx} style={{
                                display: 'flex',
                                gap: 'var(--spacing-3)',
                                padding: 'var(--spacing-3)',
                                background: 'white',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-gray-100)'
                            }}>
                                <div style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    background: 'var(--color-success-50)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <MessageSquare size={12} style={{ color: 'var(--color-success-600)' }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: '600' }}>SMS {log.template_key}</div>
                                    <div style={{ fontSize: '10px', color: 'var(--color-gray-400)' }}>
                                        {new Date(log.created_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                <div style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--color-success-600)', fontWeight: '700' }}>
                                    ENVOYÉ
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div style={{
                padding: 'var(--spacing-5)',
                background: 'var(--color-gray-50)',
                borderTop: '1px solid var(--color-gray-100)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-3)'
            }}>

                <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                    <button
                        style={{
                            ...STYLES.actionButton,
                            flex: 1,
                            background: '#f3f4f6',
                            color: 'var(--color-gray-700)',
                            padding: '10px',
                            fontWeight: '600'
                        }}
                        onClick={() => window.location.href = `tel:${patient.phone}`}
                    >
                        <Phone size={18} /> Appeler
                    </button>
                    <button
                        style={{
                            ...STYLES.actionButton,
                            flex: 1,
                            background: '#f3f4f6',
                            color: 'var(--color-gray-700)',
                            padding: '10px',
                            fontWeight: '600'
                        }}
                        onClick={() => window.location.href = `sms:${patient.phone}`}
                    >
                        <MessageSquare size={18} /> SMS
                    </button>
                </div>
            </div>
            
            <EditPatientModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                patient={patient}
                onPatientUpdated={() => {
                    setIsEditModalOpen(false);
                    onClose();
                    window.location.reload();
                }}
            />
        </div>
    );
}
