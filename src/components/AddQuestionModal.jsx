import { useState } from 'react';
import { X, HelpCircle, Send, Loader } from 'lucide-react';

export default function AddQuestionModal({ isOpen, onClose, onSave }) {
    const [question, setQuestion] = useState('');
    const [screen, setScreen] = useState('ALL');
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const milestones = [
        { id: 'ALL', label: 'Toutes les étapes' },
        { id: 'J7', label: 'J-7 Administratif' },
        { id: 'J2', label: 'J-2 Logistique' },
        { id: 'J1_PreOp', label: 'J-1 Confirmation' },
        { id: 'J1', label: 'J+1 Post-opératoire' },
        { id: 'J4_Satisfaction', label: 'J+4 Satisfaction' },
        { id: 'ESATIS', label: 'Enquête e-Satis' }
    ];

    const handleSave = async () => {
        if (!question.trim()) return;
        setIsSaving(true);
        try {
            await onSave(question, screen === 'ALL' ? null : screen);
            setQuestion('');
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
                            <HelpCircle size={18} />
                        </div>
                        <h3 style={{ margin: 0 }}>Ajouter une Question</h3>
                    </div>
                    <button onClick={onClose} className="btn-secondary" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-gray-400)' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ padding: 'var(--spacing-6)' }}>
                    <div style={{ marginBottom: 'var(--spacing-6)' }}>
                        <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-500)', marginBottom: '8px', textTransform: 'uppercase' }}>
                            Étape du parcours
                        </label>
                        <select
                            className="input"
                            value={screen}
                            onChange={(e) => setScreen(e.target.value)}
                            style={{
                                width: '100%',
                                padding: 'var(--spacing-3)',
                                background: 'white',
                                marginBottom: 'var(--spacing-4)',
                                border: '1px solid var(--color-gray-200)',
                                borderRadius: 'var(--radius-lg)'
                            }}
                        >
                            {milestones.map(m => (
                                <option key={m.id} value={m.id}>{m.label}</option>
                            ))}
                        </select>

                        <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-500)', marginBottom: '8px', textTransform: 'uppercase' }}>
                            Votre question
                        </label>
                        <textarea
                            className="input"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="Ex: Avez-vous bien arrêté de fumer depuis 1 mois ?"
                            style={{
                                width: '100%',
                                minHeight: '100px',
                                padding: 'var(--spacing-4)',
                                resize: 'vertical',
                                fontSize: 'var(--font-size-sm)',
                                lineHeight: '1.5',
                                background: 'white'
                            }}
                        />
                        <p style={{ fontSize: '11px', color: 'var(--color-gray-400)', marginTop: '8px' }}>
                            {screen === 'ALL'
                                ? "Cette question apparaîtra sur l'accueil du portail."
                                : `Cette question s'ajoutera à l'étape ${milestones.find(m => m.id === screen)?.label}.`}
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                        <button
                            className="btn btn-secondary"
                            style={{ flex: 1 }}
                            onClick={onClose}
                            disabled={isSaving}
                        >
                            Annuler
                        </button>
                        <button
                            className="btn btn-primary"
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-2)' }}
                            onClick={handleSave}
                            disabled={isSaving || !question.trim()}
                        >
                            {isSaving ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
                            {isSaving ? 'Ajout...' : 'Ajouter la question'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
