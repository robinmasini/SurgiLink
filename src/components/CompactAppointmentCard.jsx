import { MapPin, Calendar, Clock, Zap, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import clinicImageNew from '../assets/clinic_new.png';

export default function CompactAppointmentCard({
    clinicName,
    appointmentDate,
    appointmentTime,
    address = "La Tuilière II, Rue Bel air, 13127 Vitrolles",
    jValue = "J-5",
    variant = "pill", // "pill" (top bars) or "card" (clinic detail)
    hasPrescription = false,
    onDownloadPrescription = null,
    stayType = null,
    operation = null,
    style = {}
}) {
    const { t } = useTranslation();

    // Helper to format date in a short version
    const formatShortDate = (dateStr) => {
        if (!dateStr) return 'Date non définie';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('fr-FR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short'
            });
        } catch (e) {
            return dateStr;
        }
    };

    const formatLongDate = (dateStr) => {
        if (!dateStr) return 'Non définie';
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    if (variant === "pill") {
        return (
            <div style={{ display: 'flex', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-6)', flexWrap: 'wrap', alignItems: 'center', ...style }}>
                {/* Date/Time Pill */}
                <div style={{
                    background: 'white',
                    border: '1px solid var(--color-primary-100)',
                    padding: '10px 24px',
                    borderRadius: '25px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 2px 8px rgba(124, 58, 237, 0.08)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={18} style={{ color: 'var(--color-primary-500)' }} />
                        <span style={{ fontWeight: '700', color: 'var(--color-primary-700)' }}>{formatLongDate(appointmentDate)}</span>
                    </div>
                    <div style={{ width: '1px', height: '16px', background: 'var(--color-primary-100)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={18} style={{ color: 'var(--color-primary-500)' }} />
                        <span style={{ fontWeight: '700', color: 'var(--color-primary-700)' }}>{appointmentTime || '07:30'}</span>
                    </div>
                </div>

                {/* J-Condition Pill */}
                <div style={{
                    background: 'var(--color-primary-600)',
                    color: 'white',
                    padding: '10px 24px',
                    borderRadius: '25px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)'
                }}>
                    <Zap size={18} fill="currentColor" />
                    <span style={{ fontWeight: '800', fontSize: '18px' }}>{jValue}</span>
                </div>

                {/* Stay Type & Operation Pills */}
                {stayType && (
                    <div style={{
                        background: '#F5F7FA',
                        border: '1px solid #CFD8DC',
                        padding: '10px 24px',
                        borderRadius: '25px',
                        color: '#455A64',
                        fontWeight: '700',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        {stayType}
                    </div>
                )}
                {operation && (
                    <div style={{
                        background: '#FDF7F2',
                        border: '1px solid #EEDDCC',
                        padding: '10px 24px',
                        borderRadius: '25px',
                        color: '#6D8C7C',
                        fontWeight: '700',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        {operation}
                    </div>
                )}

                {/* Download Prescription Pill */}
                {hasPrescription && (
                    <button
                        onClick={onDownloadPrescription}
                        style={{
                            background: 'white',
                            border: '1px solid var(--color-primary-100)',
                            padding: '10px 24px',
                            borderRadius: '25px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            boxShadow: '0 2px 8px rgba(124, 58, 237, 0.08)',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '700',
                            color: 'var(--color-primary-700)',
                            transition: 'all 0.2s ease',
                            outline: 'none',
                            marginLeft: 'auto'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = 'var(--color-primary-50)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = 'white';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <Download size={18} style={{ color: 'var(--color-primary-500)' }} />
                        <span>{t('Télécharger mon ordonnance')}</span>
                    </button>
                )}
            </div>
        );
    }

    // Card variant (the horizontal clinic card)
    return (
        <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: 'var(--spacing-4)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-4)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            ...style
        }}>
            {/* Thumbnail */}
            <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '16px',
                overflow: 'hidden',
                flexShrink: 0
            }}>
                <img src={clinicImageNew} alt="Clinic" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ background: 'var(--color-primary-50)', padding: '6px', borderRadius: '8px', color: 'var(--color-primary-500)' }}>
                        <MapPin size={14} />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1A1A1A', margin: 0 }}>{clinicName}</h3>
                </div>
                <div style={{ fontSize: '13px', color: '#666', marginLeft: '30px', fontWeight: '500' }}>
                    {address}
                </div>
            </div>

            {/* Action CTA */}
            <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    borderRadius: '12px',
                    background: 'var(--color-primary-50)',
                    color: 'var(--color-primary-600)',
                    border: '1px solid var(--color-primary-100)',
                    fontWeight: '700',
                    fontSize: '14px',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(124, 58, 237, 0.05)'
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.background = 'var(--color-primary-100)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.background = 'var(--color-primary-50)';
                    e.currentTarget.style.transform = 'translateY(0)';
                }}
            >
                <MapPin size={18} />
                <span>M'y rendre</span>
            </a>
        </div>
    );
}
