import { MapPin, Calendar, Clock } from 'lucide-react';

export default function CompactAppointmentCard({
    clinicName,
    appointmentDate, // Expected format: YYYY-MM-DD or full datetime
    appointmentTime, // Expected format: HH:mm
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

    return (
        <div
            className="glass-effect"
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--spacing-4)',
                padding: '12px 20px',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                margin: '0 auto var(--spacing-6)',
                maxWidth: 'fit-content',
                flexWrap: 'wrap',
                ...style
            }}
        >
            {/* Clinic Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                    color: 'var(--color-primary-600)',
                    background: 'var(--color-primary-50)',
                    padding: '6px',
                    borderRadius: '8px',
                    display: 'flex'
                }}>
                    <MapPin size={14} />
                </div>
                <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--color-gray-900)' }}>
                    {clinicName || 'Clinique de Vitrolles'}
                </div>
            </div>

            {/* Separator */}
            <div style={{ width: '1px', height: '20px', background: 'var(--color-gray-200)' }} />

            {/* Date Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={14} style={{ color: 'var(--color-gray-400)' }} />
                <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--color-gray-700)' }}>
                    {formatShortDate(appointmentDate)}
                </div>
            </div>

            {/* Time Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={14} style={{ color: 'var(--color-gray-400)' }} />
                <div style={{
                    fontWeight: '700',
                    fontSize: '14px',
                    color: 'var(--color-primary-600)',
                    background: 'var(--color-primary-50)',
                    padding: '2px 8px',
                    borderRadius: '6px'
                }}>
                    {appointmentTime || '07:30'}
                </div>
            </div>
        </div>
    );
}
