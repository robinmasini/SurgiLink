import { MapPin, Calendar, Clock, Zap, Download } from 'lucide-react';
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
                    border: '1px solid #D7C4B0',
                    padding: '10px 24px',
                    borderRadius: '25px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 2px 8px rgba(215, 196, 176, 0.15)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={18} style={{ color: '#6D4C41' }} />
                        <span style={{ fontWeight: '700', color: '#6D4C41' }}>{formatLongDate(appointmentDate)}</span>
                    </div>
                    <div style={{ width: '1px', height: '16px', background: '#D7C4B0' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={18} style={{ color: '#6D4C41' }} />
                        <span style={{ fontWeight: '700', color: '#6D4C41' }}>{appointmentTime || '07:30'}</span>
                    </div>
                </div>

                {/* J-Condition Pill */}
                <div style={{
                    background: '#37474F',
                    color: 'white',
                    padding: '10px 24px',
                    borderRadius: '25px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                    <Zap size={18} fill="currentColor" />
                    <span style={{ fontWeight: '800', fontSize: '18px' }}>{jValue}</span>
                </div>

                {/* Download Prescription Pill */}
                {hasPrescription && (
                    <button
                        onClick={onDownloadPrescription}
                        style={{
                            background: 'white',
                            border: '1px solid #D7C4B0',
                            padding: '10px 24px',
                            borderRadius: '25px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            boxShadow: '0 2px 8px rgba(215, 196, 176, 0.15)',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '700',
                            color: '#6D4C41',
                            transition: 'all 0.2s ease',
                            outline: 'none',
                            marginLeft: 'auto'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = '#FDFCFB';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = 'white';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <Download size={18} style={{ color: '#6D4C41' }} />
                        <span>Télécharger mon ordonnance</span>
                    </button>
                )}

                {/* Second Row for Vital Info */}
                {(stayType || operation) && (
                    <div style={{
                        width: '100%',
                        display: 'flex',
                        gap: 'var(--spacing-3)',
                        marginTop: 'var(--spacing-4)',
                        flexWrap: 'wrap'
                    }}>
                        {stayType && (
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.5)',
                                border: '1px solid #D7C4B0',
                                padding: '8px 20px',
                                borderRadius: '20px',
                                color: '#6D4C41',
                                fontWeight: '700',
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                boxShadow: '0 2px 6px rgba(215, 196, 176, 0.1)'
                            }}>
                                {stayType}
                            </div>
                        )}
                        {operation && (
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.5)',
                                border: '1px solid #D7C4B0',
                                padding: '8px 20px',
                                borderRadius: '20px',
                                color: '#6D4C41',
                                fontWeight: '700',
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                boxShadow: '0 2px 6px rgba(215, 196, 176, 0.1)'
                            }}>
                                {operation}
                            </div>
                        )}
                    </div>
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
                    <div style={{ background: '#F5F5F5', padding: '6px', borderRadius: '8px', color: '#D7C4B0' }}>
                        <MapPin size={14} />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1A1A1A', margin: 0 }}>{clinicName}</h3>
                </div>
                <div style={{ fontSize: '13px', color: '#666', marginLeft: '30px', fontWeight: '500' }}>
                    {address}
                </div>
            </div>

            {/* Side Pills (Date/Time) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{
                    background: '#F5F7FA',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#455A64',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <Calendar size={14} />
                    {formatShortDate(appointmentDate)}
                </div>
                <div style={{
                    background: '#F5F7FA',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#455A64',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <Clock size={14} />
                    {appointmentTime || '07:30'}
                </div>
            </div>
        </div>
    );
}
