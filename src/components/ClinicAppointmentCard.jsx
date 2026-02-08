import { useState } from 'react';
import { MapPin, Calendar, Clock, Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ClinicAppointmentCard({
    patientId,
    clinicName,
    clinicImageUrl,
    appointmentDatetime,
    onUpdate
}) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);

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

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setUploadError('Veuillez sélectionner une image valide');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setUploadError('L\'image ne doit pas dépasser 5 MB');
            return;
        }

        setIsUploading(true);
        setUploadError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Non authentifié');

            // Create unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${patientId}/clinic.${fileExt}`;
            const filePath = `clinic-images/${fileName}`;

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('clinic-images')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('clinic-images')
                .getPublicUrl(fileName);

            // Update patient with new image URL
            const { error: updateError } = await supabase
                .from('patients')
                .update({ clinic_image_url: urlData.publicUrl })
                .eq('id', patientId);

            if (updateError) throw updateError;

            // Notify parent component
            if (onUpdate) onUpdate({ clinic_image_url: urlData.publicUrl });

        } catch (err) {
            console.error('Error uploading image:', err);
            setUploadError(err.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveImage = async () => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer l\'image de la clinique ?')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('patients')
                .update({ clinic_image_url: null })
                .eq('id', patientId);

            if (error) throw error;

            if (onUpdate) onUpdate({ clinic_image_url: null });
        } catch (err) {
            console.error('Error removing image:', err);
            setUploadError(err.message);
        }
    };

    return (
        <div className="card liquid-glass-effect" style={{
            position: 'relative',
            overflow: 'hidden',
            minHeight: '280px'
        }}>
            {/* Background Image */}
            {clinicImageUrl && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '140px',
                    backgroundImage: `url(${clinicImageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'brightness(0.7)',
                    zIndex: 0
                }} />
            )}

            {/* Remove Image Button */}
            {clinicImageUrl && (
                <button
                    onClick={handleRemoveImage}
                    style={{
                        position: 'absolute',
                        top: 'var(--spacing-3)',
                        right: 'var(--spacing-3)',
                        background: 'rgba(255, 255, 255, 0.9)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 2,
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = 'var(--color-danger-100)';
                        e.target.style.color = 'var(--color-danger-600)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.9)';
                        e.target.style.color = 'inherit';
                    }}
                    title="Supprimer l'image"
                >
                    <X size={16} />
                </button>
            )}

            {/* Content */}
            <div style={{
                position: 'relative',
                zIndex: 1,
                marginTop: clinicImageUrl ? '140px' : '0',
                padding: 'var(--spacing-4)'
            }}>
                {/* Header */}
                <div className="card-header" style={{ marginBottom: 'var(--spacing-4)' }}>
                    <div className="card-icon card-icon-primary">
                        <MapPin size={20} />
                    </div>
                    <h3>Rendez-vous Clinique</h3>
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

                {/* Upload Button */}
                <div style={{ marginTop: 'var(--spacing-4)' }}>
                    <label
                        htmlFor="clinic-image-upload"
                        className="btn btn-secondary btn-sm"
                        style={{
                            cursor: isUploading ? 'wait' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-2)'
                        }}
                    >
                        <Upload size={16} />
                        {isUploading ? 'Upload en cours...' : (clinicImageUrl ? 'Changer l\'image' : 'Ajouter une image')}
                    </label>
                    <input
                        id="clinic-image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                        style={{ display: 'none' }}
                    />
                </div>

                {/* Error Message */}
                {uploadError && (
                    <div style={{
                        marginTop: 'var(--spacing-3)',
                        padding: 'var(--spacing-2)',
                        background: 'var(--color-danger-50)',
                        color: 'var(--color-danger-600)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--font-size-sm)'
                    }}>
                        {uploadError}
                    </div>
                )}
            </div>
        </div>
    );
}
