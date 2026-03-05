import { useState } from 'react';
import { Plus, X, User, Clipboard, Mail, Phone, Calendar, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import PhoneInput from './PhoneInput';
import InterventionSelect from './InterventionSelect';
import { scheduleTimeBasedReminders, sendManualReminder } from '../services/reminderService';
import { generatePatientToken } from '../services/tokenService';

export default function AddPatientModal({ isOpen, onClose, onPatientAdded }) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        operation: '',
        date: '',
        birthDate: '',
        phone: '+33 ',
        email: '',
        surgeonName: 'Christophe DESOUCHES',
        surgeryTime: 'Non-communiquée',
        stayType: 'Ambulatoire'
    });
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!formData.firstName || !formData.lastName || !formData.operation) {
            alert('Veuillez remplir le prénom, le nom et l\'intervention.');
            return;
        }


        setIsSaving(true);
        try {
            const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
            const { data, error } = await supabase
                .from('patients')
                .insert([
                    {
                        name: fullName,
                        operation: formData.operation,
                        date: formData.date || new Date().toISOString().split('T')[0],
                        birth_date: formData.birthDate || null,
                        phone: formData.phone,
                        email: formData.email,
                        surgeon_name: formData.surgeonName,
                        surgery_time: formData.surgeryTime,
                        stay_type: formData.stayType,
                        status: 'pending',
                        progress: 0,
                        days_until: 'J-0' // Default
                    }
                ])
                .select();

            if (error) {
                console.error('Error saving patient:', error);
                alert(`Erreur lors de l'enregistrement : ${error.message}`);
            } else {
                const newPatient = data[0];

                // 1. Generate Token Immediately
                const tokenRes = await generatePatientToken(newPatient.id);
                const token = tokenRes.success ? tokenRes.token : null;

                // 2. Schedule automated reminders (J-7, J-2, J-1)
                if (newPatient.date) {
                    const surgeryDate = new Date(newPatient.date);
                    console.log('Patient créé, planification des rappels pour:', surgeryDate);
                    await scheduleTimeBasedReminders(newPatient.id, surgeryDate);

                    alert(`Patient ${fullName} enregistré avec succès !`);
                    if (onPatientAdded) onPatientAdded({ ...newPatient, token });
                    onClose();
                    setFormData({
                        firstName: '',
                        lastName: '',
                        operation: '',
                        date: '',
                        birthDate: '',
                        phone: '',
                        email: '',
                        surgeonName: 'Christophe DESOUCHES',
                        surgeryTime: 'Non-communiquée',
                        stayType: 'Ambulatoire'
                    });
                }
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
            <div className="liquid-glass-modal" style={{ width: '100%', maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: 'var(--spacing-6)', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                        <div className="card-icon card-icon-primary" style={{ width: '32px', height: '32px' }}>
                            <Plus size={18} />
                        </div>
                        <h3 style={{ margin: 0 }}>Nouveau Patient</h3>
                    </div>
                    <button onClick={onClose} className="btn-secondary" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-gray-400)' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ padding: 'var(--spacing-6)' }}>
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
                            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-500)', marginBottom: '4px', textTransform: 'uppercase' }}>
                                Date de Naissance
                            </label>
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
                    </div>

                    <div style={{ marginTop: 'var(--spacing-8)', display: 'flex', gap: 'var(--spacing-3)' }}>
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
