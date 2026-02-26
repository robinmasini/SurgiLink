import { useState } from 'react';
import { Plus, X, User, Clipboard, Mail, Phone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { scheduleTimeBasedReminders, sendManualReminder } from '../services/reminderService';
import { generatePatientToken } from '../services/tokenService';

export default function AddPatientModal({ isOpen, onClose, onPatientAdded }) {
    const [formData, setFormData] = useState({
        name: '',
        operation: '',
        date: '',
        birthDate: '',
        phone: '',
        email: '',
        surgeonName: 'Christophe DESOUCHES',
        surgeryTime: '07:30',
        stayType: 'Ambulatoire'
    });
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!formData.name || !formData.operation) {
            alert('Veuillez remplir au moins le nom et l\'intervention.');
            return;
        }

        setIsSaving(true);
        try {
            const { data, error } = await supabase
                .from('patients')
                .insert([
                    {
                        name: formData.name,
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

                    // 3. Immediate J-7 Send if surgery is within 7 days
                    const daysUntil = Math.ceil((surgeryDate - new Date()) / (1000 * 60 * 60 * 24));
                    console.log('Jours avant intervention:', daysUntil);

                    if (daysUntil <= 7) {
                        console.log('Déclenchement immédiat du SMS J-7...');
                        const smsRes = await sendManualReminder(
                            newPatient.id,
                            'J7',
                            null,
                            'j7_reminder',
                            { ...newPatient, token }
                        );
                        console.log('Résultat SMS immédiat:', smsRes);

                        if (smsRes.success) {
                            alert(`Patient ${formData.name} enregistré et SMS de bienvenue envoyé !`);
                        } else {
                            alert(`Patient enregistré mais le SMS n'a pas pu être envoyé : ${smsRes.error || 'Erreur inconnue'}`);
                        }
                    } else {
                        alert(`Patient ${formData.name} enregistré avec succès ! (SMS planifié pour J-7)`);
                    }
                    if (onPatientAdded) onPatientAdded({ ...newPatient, token });
                    onClose();
                    setFormData({
                        name: '',
                        operation: '',
                        date: '',
                        birthDate: '',
                        phone: '',
                        email: '',
                        surgeonName: 'Christophe DESOUCHES',
                        surgeryTime: '07:30',
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
                        <div>
                            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-500)', marginBottom: '4px', textTransform: 'uppercase' }}>Nom Complet</label>
                            <div style={{ position: 'relative' }}>
                                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)' }} />
                                <input
                                    className="input"
                                    placeholder="Ex: Jean Martin"
                                    style={{ paddingLeft: '40px' }}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-500)', marginBottom: '4px', textTransform: 'uppercase' }}>Intervention</label>
                            <div style={{ position: 'relative' }}>
                                <Clipboard size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)' }} />
                                <input
                                    className="input"
                                    placeholder="Ex: Rhinoplastie"
                                    style={{ paddingLeft: '40px' }}
                                    value={formData.operation}
                                    onChange={(e) => setFormData({ ...formData, operation: e.target.value })}
                                />
                            </div>
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
                            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-500)', marginBottom: '4px', textTransform: 'uppercase' }}>Date de Naissance</label>
                            <input
                                type="date"
                                className="input"
                                value={formData.birthDate}
                                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                            />
                        </div>

                        <div className="grid-3">
                            <div>
                                <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-500)', marginBottom: '4px', textTransform: 'uppercase' }}>Date d'intervention</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-500)', marginBottom: '4px', textTransform: 'uppercase' }}>Heure</label>
                                <input
                                    type="time"
                                    className="input"
                                    value={formData.surgeryTime}
                                    onChange={(e) => setFormData({ ...formData, surgeryTime: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-500)', marginBottom: '4px', textTransform: 'uppercase' }}>Téléphone</label>
                                <div style={{ position: 'relative' }}>
                                    <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)' }} />
                                    <input
                                        className="input"
                                        placeholder="06 00 00 00 00"
                                        style={{ paddingLeft: '40px' }}
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
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
