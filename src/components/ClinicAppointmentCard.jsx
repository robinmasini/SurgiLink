import { MapPin, Calendar, Clock } from 'lucide-react';
import clinicImage from '../assets/clinic.png';

export default function ClinicAppointmentCard({
    clinicName,
    appointmentDatetime
}) {
    // Format date and time
    const formatAppointmentDate = (datetime) => {
        if (!datetime) return 'Non définie';
        const date = new Date(datetime);
        return date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatAppointmentTime = (datetime) => {
        if (!datetime) return '';
        const date = new Date(datetime);
        return date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="card liquid-glass-effect" style={{
            position: 'relative',
            overflow: 'hidden',
            minHeight: '280px'
        }}>
            {/* Background Image - Fixed from assets */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '140px',
                backgroundImage: `url(${clinicImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'brightness(0.7)',
                zIndex: 0
            }} />

            {/* Content */}
            <div style={{
                position: 'relative',
                zIndex: 1,
                marginTop: '140px',
                padding: 'var(--spacing-4)'
            }}>
                {/* Header */}
                <div className="card-header" style={{ marginBottom: 'var(--spacing-4)' }}>
                    <div className="card-icon card-icon-primary">
                        <MapPin size={20} />
                    </div>
                    <h3>Clinique de Vitrolles</h3>
                </div>

                {/* Clinic Name */}
                <div style={{ marginBottom: 'var(--spacing-4)' }}>
                    <div style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-gray-500)',
                        textTransform: 'uppercase',
                        marginBottom: 'var(--spacing-1)'
                    }}>
                        Lieu
                    </div>
                    <div style={{
                        fontWeight: 'var(--font-weight-semibold)',
                        fontSize: 'var(--font-size-lg)',
                        color: 'var(--color-primary-600)'
                    }}>
                        {clinicName || 'Non renseigné'}
                    </div>
                </div>

                {/* Appointment Date & Time */}
                {appointmentDatetime && (
                    <div style={{
                        display: 'flex',
                        gap: 'var(--spacing-4)',
                        marginBottom: 'var(--spacing-4)'
                    }}>
                        <div style={{ flex: 1 }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-2)',
                                marginBottom: 'var(--spacing-1)'
                            }}>
                                <Calendar size={14} style={{ color: 'var(--color-gray-400)' }} />
                                <span style={{
                                    fontSize: 'var(--font-size-xs)',
                                    color: 'var(--color-gray-500)',
                                    textTransform: 'uppercase'
                                }}>
                                    Date
                                </span>
                            </div>
                            <div style={{ fontWeight: 'var(--font-weight-medium)' }}>
                                {formatAppointmentDate(appointmentDatetime)}
                            </div>
                        </div>
                        <div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-2)',
                                marginBottom: 'var(--spacing-1)'
                            }}>
                                <Clock size={14} style={{ color: 'var(--color-gray-400)' }} />
                                <span style={{
                                    fontSize: 'var(--font-size-xs)',
                                    color: 'var(--color-gray-500)',
                                    textTransform: 'uppercase'
                                }}>
                                    Heure
                                </span>
                            </div>
                            <div style={{
                                fontWeight: 'var(--font-weight-semibold)',
                                color: 'var(--color-primary-600)'
                            }}>
                                {formatAppointmentTime(appointmentDatetime)}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
