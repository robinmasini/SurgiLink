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
    AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import PatientStatusBadges from './PatientStatusBadges';

export default function PatientDetailPanel({ patient, responses = [], onClose }) {
    const [smsLogs, setSmsLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (patient) {
            loadSmsLogs();
        }
    }, [patient]);

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

    if (!patient) return null;

    return (
        <div className="patient-detail-panel fade-in" style={{
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
        }}>
            {/* Header */}
            <div style={{
                padding: 'var(--spacing-5)',
                borderBottom: '1px solid var(--color-gray-100)',
                background: 'linear-gradient(to right, var(--color-primary-50), white)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
            }}>
                <div>
                    <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '700', color: 'var(--color-gray-900)', marginBottom: 'var(--spacing-1)' }}>
                        {patient.name}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)' }}>
                        <Calendar size={14} />
                        <span>Chirurgie le {patient.formattedDate}</span>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    style={{ background: 'white', border: '1px solid var(--color-gray-200)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                    <X size={18} />
                </button>
            </div>

            <div style={{ padding: 'var(--spacing-5)', overflowY: 'auto', flex: 1 }}>
                {/* Stats Summary */}
                <div style={{ marginBottom: 'var(--spacing-6)' }}>
                    <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: '700', color: 'var(--color-gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--spacing-3)' }}>
                        Retours Patient
                    </div>
                    <PatientStatusBadges responses={responses} daysUntil={patient.daysUntil} patientStatus={patient.status} />
                </div>

                {/* Quick Info Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 'var(--spacing-3)',
                    marginBottom: 'var(--spacing-6)'
                }}>
                    <div style={{ padding: 'var(--spacing-3)', background: 'var(--color-gray-50)', borderRadius: 'var(--radius-lg)' }}>
                        <div style={{ fontSize: '10px', color: 'var(--color-gray-400)', textTransform: 'uppercase', fontWeight: '700' }}>Étape</div>
                        <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--color-primary-600)' }}>{patient.daysUntil}</div>
                    </div>
                    <div style={{ padding: 'var(--spacing-3)', background: 'var(--color-gray-50)', borderRadius: 'var(--radius-lg)' }}>
                        <div style={{ fontSize: '10px', color: 'var(--color-gray-400)', textTransform: 'uppercase', fontWeight: '700' }}>Mode de séjour</div>
                        <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600' }}>{patient.stay_type || 'Ambulatoire'}</div>
                    </div>
                </div>

                {/* Patient Portal Access */}
                <div style={{
                    padding: 'var(--spacing-4)',
                    background: 'var(--color-primary-50)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px dashed var(--color-primary-200)',
                    marginBottom: 'var(--spacing-6)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
                        <ExternalLink size={16} style={{ color: 'var(--color-primary-600)' }} />
                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: '700', color: 'var(--color-primary-700)' }}>Accès Patient Sécurisé</span>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--color-primary-600)', marginBottom: 'var(--spacing-3)' }}>
                        Lien unique envoyé par SMS pour consulter le protocole.
                    </p>
                    <button className="btn btn-sm btn-primary" style={{ width: '100%', fontSize: '11px', padding: '6px' }}>
                        Copier le lien
                    </button>
                </div>

                {/* Recent Activity */}
                <div style={{ marginBottom: 'var(--spacing-6)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
                        <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: '700', color: 'var(--color-gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Derniers Échanges
                        </div>
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
                gap: 'var(--spacing-2)'
            }}>
                <button
                    className="btn btn-primary"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-2)' }}
                    onClick={() => window.location.href = `tel:${patient.phone}`}
                >
                    <Phone size={18} /> Appeler
                </button>
                <button
                    className="btn btn-outline"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-2)' }}
                    onClick={() => window.location.href = `sms:${patient.phone}`}
                >
                    <MessageSquare size={18} /> SMS
                </button>
                <button
                    className="btn btn-outline"
                    style={{ width: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => window.location.href = `/patient/${patient.id}`}
                    title="Ouvrir la fiche complète"
                >
                    <ExternalLink size={18} />
                </button>
            </div>
        </div>
    );
}
