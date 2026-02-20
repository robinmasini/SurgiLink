import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Clock, CheckCircle, AlertCircle, XCircle, Loader } from 'lucide-react';
import { getPatientPathwayStatus, getIncompleteItemsWithReminders } from '../services/pathwayService';
import { sendManualReminder } from '../services/reminderService';
import { getSMSHistory, canSendReminder } from '../services/d7networksService';
import { getPatientTokens, generatePatientToken } from '../services/tokenService';
import AlertBanner from './pathway/AlertBanner';
import { ExternalLink, Copy, ShieldCheck } from 'lucide-react';

/**
 * PatientPathwayTracker - Staff interface for tracking pathway completion and sending reminders
 */
export default function PatientPathwayTracker() {
    const { patientId } = useParams();
    const [status, setStatus] = useState({});
    const [incompleteItems, setIncompleteItems] = useState({});
    const [smsHistory, setSmsHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(null);
    const [token, setToken] = useState(null);

    // Mock patient data for testing with Robin MASINI
    const patient = {
        id: parseInt(patientId),
        name: 'Robin MASINI',
        phone: '+33621457812', // Placeholder, user will provide real one if needed or edit in DB
        date: '2026-02-14',
        arrival_time: '07:30'
    };

    useEffect(() => {
        loadData();
    }, [patientId]);

    const loadData = async () => {
        setLoading(true);

        // Load pathway status
        const pathwayStatus = await getPatientPathwayStatus(parseInt(patientId));
        setStatus(pathwayStatus);

        // Load incomplete items for each screen
        const incomplete = {};
        for (const screen of ['J7', 'J2', 'J1']) {
            const items = await getIncompleteItemsWithReminders(parseInt(patientId), screen);
            if (items.length > 0) {
                incomplete[screen] = items;
            }
        }
        setIncompleteItems(incomplete);

        // Load SMS history
        const history = await getSMSHistory(parseInt(patientId));
        setSmsHistory(history);

        // Load Token
        const tokens = await getPatientTokens(parseInt(patientId));
        const activeToken = tokens.find(t => t.is_active);
        if (activeToken) {
            setToken(activeToken.token);
        }

        setLoading(false);
    };

    const handleGenerateToken = async () => {
        const res = await generatePatientToken(parseInt(patientId));
        if (res.success) {
            setToken(res.token);
            alert('Lien d’accès généré !');
        }
    };

    const copyToClipboard = () => {
        const url = `${window.location.origin}/patient-portal/${token}`;
        navigator.clipboard.writeText(url);
        alert('Lien copié dans le presse-papier !');
    };

    const handleSendReminder = async (screen, itemId, templateKey) => {
        setSending(`${screen}_${itemId}`);

        const result = await sendManualReminder(
            parseInt(patientId),
            screen,
            itemId,
            templateKey,
            { ...patient, token }
        );

        if (result.success) {
            alert(`SMS envoyé avec succès ! ID: ${result.messageId}`);
            loadData(); // Refresh data
        } else if (!result.canSend) {
            alert(`Impossible d'envoyer : ${result.reason}`);
        } else {
            alert(`Erreur lors de l'envoi : ${result.error}`);
        }

        setSending(null);
    };

    const getStatusIcon = (screenStatus) => {
        if (!screenStatus) return <AlertCircle size={20} color="var(--color-gray-400)" />;

        if (screenStatus.isComplete) {
            return <CheckCircle size={20} color="var(--color-success-500)" />;
        } else if (screenStatus.percentage > 50) {
            return <Clock size={20} color="var(--color-warning-500)" />;
        } else {
            return <XCircle size={20} color="var(--color-danger-500)" />;
        }
    };

    const getStatusText = (screenStatus) => {
        if (!screenStatus) return 'Non commencé';
        if (screenStatus.isComplete) return 'Complété';
        return `${screenStatus.completed}/${screenStatus.total} (${screenStatus.percentage}%)`;
    };

    if (loading) {
        return (
            <div style={{ padding: 'var(--spacing-6)' }}>
                <Loader className="animate-spin" />
            </div>
        );
    }

    const hasIncomplete = Object.keys(incompleteItems).length > 0;

    return (
        <div style={{ padding: 'var(--spacing-6)', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: 'var(--spacing-6)' }}>
                <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-2)' }}>
                    Suivi Parcours Ambulatoire
                </h2>
                <p style={{ color: 'var(--color-gray-600)' }}>
                    Patient: {patient.name} • Intervention: {patient.date}
                </p>

                <div style={{ display: 'flex', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-4)' }}>
                    {token ? (
                        <>
                            <a
                                href={`/patient-portal/${token}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-secondary btn-sm"
                                style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}
                            >
                                <ExternalLink size={16} />
                                Voir le Portail Patient
                            </a>
                            <button
                                onClick={copyToClipboard}
                                className="btn btn-secondary btn-sm"
                                style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}
                            >
                                <Copy size={16} />
                                Copier le lien
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleGenerateToken}
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}
                        >
                            <ShieldCheck size={16} />
                            Générer un lien d'accès
                        </button>
                    )}
                </div>
            </div>

            {/* Global Status */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: 'var(--spacing-4)',
                marginBottom: 'var(--spacing-6)'
            }}>
                {['J7', 'J2', 'J1'].map(screen => (
                    <div
                        key={screen}
                        style={{
                            padding: 'var(--spacing-4)',
                            border: '1px solid var(--color-gray-300)',
                            borderRadius: 'var(--border-radius-lg)',
                            background: 'white',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--spacing-3)'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                                {getStatusIcon(status[screen])}
                                <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>{screen}</span>
                            </div>
                            <button
                                onClick={() => handleSendReminder(screen, null, `${screen.toLowerCase()}_reminder`)}
                                disabled={sending === `${screen}_null`}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '4px 8px', fontSize: 'var(--font-size-xs)' }}
                                title={`Envoyer le SMS général ${screen}`}
                            >
                                {sending === `${screen}_null` ? <Loader size={12} className="animate-spin" /> : <Send size={12} />}
                                <span style={{ marginLeft: '4px' }}>SMS {screen}</span>
                            </button>
                        </div>
                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>
                            {getStatusText(status[screen])}
                        </div>
                    </div>
                ))}
            </div>

            {/* Incomplete Items Alert */}
            {!hasIncomplete && (
                <AlertBanner
                    type="success"
                    title="✅ Parcours complété"
                    message="Le patient a complété toutes les étapes du parcours ambulatoire."
                />
            )}

            {/* Incomplete Items with Reminder Buttons */}
            {hasIncomplete && (
                <>
                    <AlertBanner
                        type="warning"
                        title="Éléments manquants"
                        message="Certaines informations ne sont pas encore complétées. Vous pouvez relancer le patient."
                    />

                    <div style={{ marginTop: 'var(--spacing-6)' }}>
                        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-4)' }}>
                            Actions de relance
                        </h3>

                        {Object.entries(incompleteItems).map(([screen, items]) => (
                            <div key={screen} style={{ marginBottom: 'var(--spacing-6)' }}>
                                <h4 style={{
                                    fontSize: 'var(--font-size-base)',
                                    fontWeight: 'var(--font-weight-medium)',
                                    marginBottom: 'var(--spacing-3)',
                                    color: 'var(--color-gray-700)'
                                }}>
                                    {screen} - {items.length} élément(s) manquant(s)
                                </h4>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                                    {items.map(item => {
                                        const isSending = sending === `${screen}_${item.id}`;
                                        const lastSMS = smsHistory.find(sms => sms.linked_item_id === item.id);

                                        return (
                                            <div
                                                key={item.id}
                                                style={{
                                                    padding: 'var(--spacing-4)',
                                                    border: '1px solid var(--color-gray-200)',
                                                    borderRadius: 'var(--border-radius-md)',
                                                    background: 'var(--color-gray-50)',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--spacing-1)' }}>
                                                        {item.label}
                                                    </div>
                                                    {lastSMS && (
                                                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>
                                                            Dernière relance : {new Date(lastSMS.sent_at).toLocaleDateString('fr-FR')} à {new Date(lastSMS.sent_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    )}
                                                </div>

                                                <button
                                                    className="btn btn-sm"
                                                    onClick={() => handleSendReminder(screen, item.id, item.reminderPolicy.sms_template_key)}
                                                    disabled={isSending}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 'var(--spacing-2)',
                                                        background: 'var(--color-primary-600)',
                                                        color: 'white'
                                                    }}
                                                >
                                                    {isSending ? (
                                                        <>
                                                            <Loader size={16} className="animate-spin" />
                                                            <span>Envoi...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Send size={16} />
                                                            <span>Relancer par SMS</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* SMS History */}
            {smsHistory.length > 0 && (
                <div style={{ marginTop: 'var(--spacing-8)' }}>
                    <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-4)' }}>
                        Historique des SMS ({smsHistory.length})
                    </h3>

                    <div style={{
                        border: '1px solid var(--color-gray-300)',
                        borderRadius: 'var(--border-radius-lg)',
                        overflow: 'hidden'
                    }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--color-gray-100)', borderBottom: '1px solid var(--color-gray-300)' }}>
                                    <th style={{ padding: 'var(--spacing-3)', textAlign: 'left', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>Date</th>
                                    <th style={{ padding: 'var(--spacing-3)', textAlign: 'left', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>Écran</th>
                                    <th style={{ padding: 'var(--spacing-3)', textAlign: 'left', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>Template</th>
                                    <th style={{ padding: 'var(--spacing-3)', textAlign: 'left', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {smsHistory.slice(0, 10).map((sms, index) => (
                                    <tr key={sms.id} style={{ borderBottom: index < smsHistory.length - 1 ? '1px solid var(--color-gray-200)' : 'none' }}>
                                        <td style={{ padding: 'var(--spacing-3)', fontSize: 'var(--font-size-sm)' }}>
                                            {new Date(sms.sent_at || sms.created_at).toLocaleDateString('fr-FR')} {new Date(sms.sent_at || sms.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td style={{ padding: 'var(--spacing-3)', fontSize: 'var(--font-size-sm)' }}>{sms.screen || '-'}</td>
                                        <td style={{ padding: 'var(--spacing-3)', fontSize: 'var(--font-size-sm)' }}>{sms.template_key}</td>
                                        <td style={{ padding: 'var(--spacing-3)' }}>
                                            <span style={{
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontSize: 'var(--font-size-xs)',
                                                fontWeight: 'var(--font-weight-medium)',
                                                background: sms.status === 'sent' || sms.status === 'delivered' ? 'var(--color-success-100)' : sms.status === 'failed' ? 'var(--color-danger-100)' : 'var(--color-gray-200)',
                                                color: sms.status === 'sent' || sms.status === 'delivered' ? 'var(--color-success-700)' : sms.status === 'failed' ? 'var(--color-danger-700)' : 'var(--color-gray-700)'
                                            }}>
                                                {sms.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
