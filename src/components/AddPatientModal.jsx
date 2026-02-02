import { useState } from 'react';
import { Plus, X, User, Clipboard, Mail, Phone } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AddPatientModal({ isOpen, onClose, onPatientAdded }) {
    const [formData, setFormData] = useState({
        name: '',
        operation: '',
        date: '',
        phone: '',
        email: ''
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
                        phone: formData.phone,
                        email: formData.email,
                        status: 'pending',
                        progress: 0,
                        days_until: 'J-0' // Default
                    }
                ])
                .select();

            if (error) {
                console.error('Error saving patient:', error);
                // Fallback to local state update if table doesn't exist yet (for demo/dev)
                // In a real app, we'd handle the error properly
                alert(`Erreur lors de l'enregistrement : ${error.message}`);
            } else {
                alert(`Patient ${formData.name} enregistré avec succès !`);
                if (onPatientAdded) onPatientAdded(data[0]);
                onClose();
                setFormData({ name: '', operation: '', date: '', phone: '', email: '' });
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
                                <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-500)', marginBottom: '4px', textTransform: 'uppercase' }}>Date</label>
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
