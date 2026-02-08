import { useState, useEffect } from 'react';
import { Edit2, X, User, Clipboard, Mail, Phone } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function EditPatientModal({ isOpen, onClose, patient, onPatientUpdated }) {
    const [formData, setFormData] = useState({
        name: '',
        operation: '',
        date: '',
        birthDate: '',
        phone: '',
        email: ''
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

            setFormData({
                name: patient.name || '',
                operation: patient.operation || '',
                date: operationDate || '',
                birthDate: patient.birth_date || '',
                phone: patient.phone || '',
                email: patient.email || ''
            });
        }
    }, [patient]);

    if (!isOpen || !patient) return null;

    const handleSave = async () => {
        if (!formData.name || !formData.operation) {
            alert('Veuillez remplir au moins le nom et l\'intervention.');
            return;
        }

        setIsSaving(true);
        try {
            const { data, error } = await supabase
                .from('patients')
                .update({
                    name: formData.name,
                    operation: formData.operation,
                    date: formData.date || null,
                    birth_date: formData.birthDate || null,
                    phone: formData.phone,
                    email: formData.email
                })
                .eq('id', patient.id)
                .select();

            if (error) {
                console.error('Error updating patient:', error);
                alert(`Erreur lors de la mise à jour : ${error.message}`);
            } else {
                alert(`Patient ${formData.name} mis à jour avec succès !`);
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
            <div className="liquid-glass-modal" style={{ width: '100%', maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
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

                        <div>
                            <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-500)', marginBottom: '4px', textTransform: 'uppercase' }}>Date de Naissance</label>
                            <input
                                type="date"
                                className="input"
                                value={formData.birthDate}
                                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                            />
                        </div>

                        <div className="grid-2">
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
