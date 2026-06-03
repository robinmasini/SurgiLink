import { useState, useEffect } from 'react';
import { Edit2, X, User, Clipboard, Mail, Phone, MapPin, Calendar, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import PhoneInput from './PhoneInput';
import InterventionSelect from './InterventionSelect';
import { scheduleTimeBasedReminders } from '../services/reminderService';

export default function EditPatientModal({ isOpen, onClose, patient, onPatientUpdated }) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        operation: '',
        date: '',
        birthDate: '',
        phone: '',
        email: '',
        clinicName: '',
        appointmentDatetime: '',
        surgeonName: '',
        surgeryTime: '',
        stayType: '',
        reminderTime: '08:30'
    });
    const [isSaving, setIsSaving] = useState(false);

    // Pre-fill form when patient data is available
    useEffect(() => {
        if (patient) {
            // Parse the date back to YYYY-MM-DD format from the formatted display
            let operationDate = patient.date;
            if (patient.date && patient.date !== 'Non définie') {
                // The date might be already in ISO format from DB or formatted
                // We need to handle both cases
                const dateMatch = patient.date.match(/\d{4}-\d{2}-\d{2}/);
                if (dateMatch) {
                    operationDate = dateMatch[0];
                } else {
                    // If it's formatted, we need to get it from the original data
                    // For now, we'll use the current value
                    operationDate = patient.date;
                }
            }

            const nameParts = (patient.name || '').split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            setFormData({
                firstName,
                lastName,
                operation: patient.operation || '',
                date: operationDate || '',
                birthDate: patient.birth_date || '',
                phone: patient.phone || '',
                email: patient.email || '',
                clinicName: patient.clinic_name || '',
                appointmentDatetime: patient.appointment_datetime ? new Date(patient.appointment_datetime).toISOString().slice(0, 16) : '',
                surgeonName: patient.surgeon_name || '',
                surgeryTime: patient.surgery_time || '07:30',
                stayType: patient.stay_type || 'Ambulatoire',
                reminderTime: patient.reminder_time || '08:30'
            });
        }
    }, [patient]);

    if (!isOpen || !patient) return null;

    const handleSave = async () => {
        if (!formData.firstName || !formData.lastName || !formData.operation) {
            alert('Veuillez remplir le prénom, le nom et l\'intervention.');
            return;
        }

        setIsSaving(true);
        try {
            const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
            const dateChanged = formData.date !== (patient.date || '');
            const timeChanged = formData.reminderTime !== (patient.reminder_time || '08:30');

            const { data, error } = await supabase
                .from('patients')
                .update({
                    name: fullName,
                    operation: formData.operation,
                    date: formData.date || null,
                    birth_date: formData.birthDate || null,
                    phone: formData.phone,
                    email: formData.email,
                    clinic_name: formData.clinicName || null,
                    appointment_datetime: formData.appointmentDatetime || null,
                    surgeon_name: formData.surgeonName,
                    surgery_time: formData.surgeryTime,
                    stay_type: formData.stayType,
                    reminder_time: formData.reminderTime
                })
                .eq('id', patient.id)
                .select();

            if (error) {
                console.error('Error updating patient:', error);
                alert(`Erreur lors de la mise à jour : ${error.message}`);
            } else {
                if (dateChanged || timeChanged) {
                    try {
                        console.log('Changement de date ou d\'heure détecté. Régénération du planning des SMS...');
                        // 1. Delete pending reminders
                        await supabase
                            .from('reminder_queue')
                            .delete()
                            .eq('patient_id', patient.id)
                            .eq('status', 'pending');

                        // 2. Reschedule with the new values
                        await scheduleTimeBasedReminders(patient.id, formData.date || null, { default: formData.reminderTime });
                    } catch (schedErr) {
                        console.error('Error automatic rescheduling:', schedErr);
                    }
                }

                alert(`Patient ${fullName} mis à jour avec succès !`);
                if (onPatientUpdated) onPatientUpdated(data[0]);
                onClose();
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            alert('Une erreur inattendue est survenue.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div
                className="liquid-glass-modal"
                style={{
                    width: '100%',
                    maxWidth: '550px',
                    maxHeight: '90vh',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ padding: 'var(--spacing-6)', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                        <div className="card-icon card-icon-primary" style={{ width: '32px', height: '32px' }}>
                            <Edit2 size={18} />
                        </div>
                        <h3 style={{ margin: 0 }}>Modifier Patient</h3>
                    </div>
                    <button onClick={onClose} className="btn-secondary" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-gray-400)' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{
                    padding: 'var(--spacing-6)',
                    overflowY: 'auto',
                    flex: 1
                }}>
                    <div style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
                        <div className="grid-2">
                            <div>
                                <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-500)', marginBottom: '4px', textTransform: 'uppercase' }}>Prénom</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)' }} />
                                    <input
                                        className="input"
                                        placeholder="Ex: Jean"
                                        style={{ paddingLeft: '40px' }}
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-500)', marginBottom: '4px', textTransform: 'uppercase' }}>Nom</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)' }} />
                                    <input
                                        className="input"
                                        placeholder="Ex: Martin"
                                        style={{ paddingLeft: '40px' }}
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-500)', marginBottom: '4px', textTransform: 'uppercase' }}>Date de Naissance</label>
                            <input
                                type="date"
                                className="input"
                                value={formData.birthDate}
                                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-500)', marginBottom: '4px', textTransform: 'uppercase' }}>Intervention</label>
                            <InterventionSelect
                                value={formData.operation}
                                onChange={(val) => setFormData({ ...formData, operation: val })}
                            />
                        </div>

                        <div className="grid-2">
                            <div>
                                <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-500)', marginBottom: '4px', textTransform: 'uppercase' }}>Chirurgien</label>
                                <input
                                    className="input"
                                    placeholder="Nom du médecin"
                                    value={formData.surgeonName}
                                    onChange={(e) => setFormData({ ...formData, surgeonName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-500)', marginBottom: '4px', textTransform: 'uppercase' }}>Type de séjour</label>
                                <select
                                    className="input"
                                    value={formData.stayType}
                                    onChange={(e) => setFormData({ ...formData, stayType: e.target.value })}
                                >
                                    <option value="Ambulatoire">Ambulatoire</option>
                                    <option value="Hospitalisation">Hospitalisation</option>
                                </select>
                            </div>
                        </div>


                        <div className="grid-2">
                            <div>
                                <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-500)', marginBottom: '4px', textTransform: 'uppercase' }}>Date d'intervention</label>
                                <div style={{ position: 'relative' }}>
                                    <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)', zIndex: 1 }} />
                                    <input
                                        type="date"
                                        className="input"
                                        style={{ paddingLeft: '40px' }}
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-500)', marginBottom: '4px', textTransform: 'uppercase' }}>Heure Chirurgie</label>
                                <div style={{ position: 'relative' }}>
                                    <Clock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)', zIndex: 1 }} />
                                    <input
                                        type="time"
                                        className="input"
                                        style={{ paddingLeft: '40px' }}
                                        value={formData.surgeryTime}
                                        onChange={(e) => setFormData({ ...formData, surgeryTime: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-500)', marginBottom: '4px', textTransform: 'uppercase' }}>Heure Rappel SMS (Défaut)</label>
                            <div style={{ position: 'relative' }}>
                                <Clock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary-400)', zIndex: 1 }} />
                                <input
                                    type="time"
                                    className="input"
                                    style={{ paddingLeft: '40px', border: '1px solid var(--color-primary-200)', background: 'var(--color-primary-50)' }}
                                    value={formData.reminderTime}
                                    onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                                />
                            </div>
                            <p style={{ fontSize: '10px', color: 'var(--color-gray-400)', marginTop: '4px' }}>
                                Cette heure sera utilisée pour tous les rappels automatiques (J-7, J-2, etc.)
                            </p>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-500)', marginBottom: '4px', textTransform: 'uppercase' }}>Téléphone</label>
                            <PhoneInput
                                value={formData.phone}
                                onChange={(val) => setFormData({ ...formData, phone: val })}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-500)', marginBottom: '4px', textTransform: 'uppercase' }}>Email</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)' }} />
                                <input
                                    type="email"
                                    className="input"
                                    placeholder="patient@email.com"
                                    style={{ paddingLeft: '40px' }}
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Clinic Information */}
                        <div style={{
                            marginTop: 'var(--spacing-5)',
                            paddingTop: 'var(--spacing-5)',
                            borderTop: '1px solid var(--color-gray-200)'
                        }}>
                            <h4 style={{
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: 'var(--font-weight-semibold)',
                                color: 'var(--color-gray-700)',
                                marginBottom: 'var(--spacing-3)'
                            }}>Informations Clinique</h4>

                            <div style={{ display: 'grid', gap: 'var(--spacing-3)' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-500)', marginBottom: '4px', textTransform: 'uppercase' }}>Nom de la Clinique</label>
                                    <div style={{ position: 'relative' }}>
                                        <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)' }} />
                                        <input
                                            className="input"
                                            placeholder="Ex: Clinique de Vitrolles"
                                            style={{ paddingLeft: '40px' }}
                                            value={formData.clinicName}
                                            onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-500)', marginBottom: '4px', textTransform: 'uppercase' }}>Date et Heure du Rendez-vous</label>
                                    <div style={{ position: 'relative' }}>
                                        <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)', zIndex: 1 }} />
                                        <input
                                            type="datetime-local"
                                            className="input"
                                            style={{ paddingLeft: '40px' }}
                                            value={formData.appointmentDatetime}
                                            onChange={(e) => setFormData({ ...formData, appointmentDatetime: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: 'var(--spacing-6)', display: 'flex', gap: 'var(--spacing-3)' }}>
                        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose} disabled={isSaving}>Annuler</button>
                        <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={isSaving}>
                            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
