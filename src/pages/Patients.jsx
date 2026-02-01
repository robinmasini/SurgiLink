import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Users, Search, Filter, Plus, X, User, Clipboard } from 'lucide-react';

function AddPatientModal({ isOpen, onClose }) {
    const [formData, setFormData] = useState({
        name: '',
        operation: '',
        date: '',
        contact: ''
    });

    if (!isOpen) return null;

    const handleSave = () => {
        if (!formData.name || !formData.operation) {
            alert('Veuillez remplir au moins le nom et l\'intervention.');
            return;
        }
        alert(`Patient ${formData.name} enregistré avec succès !`);
        onClose();
        setFormData({ name: '', operation: '', date: '', contact: '' });
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
                    </div>
                    <div style={{ marginTop: 'var(--spacing-8)', display: 'flex', gap: 'var(--spacing-3)' }}>
                        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Annuler</button>
                        <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>Enregistrer</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const patients = [
    {
        id: 1,
        name: 'Thomas Dupont',
        operation: 'Arthroscopie Épaule',
        date: '21 Jan 2026',
        status: 'ready',
        daysUntil: 'J-1',
        phone: '06 12 34 56 78',
        email: 'thomas.dupont@email.com'
    },
    {
        id: 2,
        name: 'Marie Laurent',
        operation: 'Chirurgie Pied',
        date: '22 Jan 2026',
        status: 'postop',
        daysUntil: 'J+2',
        phone: '06 23 45 67 89',
        email: 'marie.laurent@email.com'
    },
    {
        id: 3,
        name: 'Alain Bernard',
        operation: 'Cataracte',
        date: '27 Jan 2026',
        status: 'incomplete',
        daysUntil: 'J-7',
        phone: '06 34 56 78 90',
        email: 'alain.bernard@email.com'
    },
    {
        id: 4,
        name: 'Paul Martin',
        operation: 'Ligamentoplastie Genou',
        date: '19 Jan 2026',
        status: 'postop',
        daysUntil: 'J+1',
        phone: '06 45 67 89 01',
        email: 'paul.martin@email.com'
    },
    {
        id: 5,
        name: 'Sophie Petit',
        operation: 'Rhinoplastie',
        date: '28 Jan 2026',
        status: 'pending',
        daysUntil: 'J-8',
        phone: '06 56 78 90 12',
        email: 'sophie.petit@email.com'
    },
    {
        id: 6,
        name: 'Jean Moreau',
        operation: 'Lifting Visage',
        date: '30 Jan 2026',
        status: 'pending',
        daysUntil: 'J-10',
        phone: '06 67 89 01 23',
        email: 'jean.moreau@email.com'
    },
];

const getStatusBadge = (status) => {
    switch (status) {
        case 'ready':
            return <span className="badge badge-success">Prêt</span>;
        case 'incomplete':
            return <span className="badge badge-warning">Protocole incomplet</span>;
        case 'postop':
            return <span className="badge badge-info">Suivi post-op</span>;
        case 'pending':
            return <span className="badge badge-primary">En cours</span>;
        default:
            return null;
    }
};

const getDaysStyle = (daysUntil) => {
    if (daysUntil.startsWith('J+')) {
        return { color: 'var(--color-info-500)', fontWeight: 'var(--font-weight-semibold)' };
    }
    if (daysUntil === 'J-1') {
        return { color: 'var(--color-success-500)', fontWeight: 'var(--font-weight-semibold)' };
    }
    return { color: 'var(--color-primary-500)', fontWeight: 'var(--font-weight-semibold)' };
};

export default function Patients() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.operation.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <main className="main-content">
                <Header
                    title="Patients"
                    subtitle="Gestion et suivi de vos patients"
                />

                {/* Search and Filters */}
                <div style={{ display: 'flex', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search
                            size={18}
                            style={{
                                position: 'absolute',
                                left: '14px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--color-gray-400)'
                            }}
                        />
                        <input
                            type="text"
                            className="input"
                            placeholder="Rechercher un patient..."
                            style={{ paddingLeft: '44px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-secondary" onClick={() => alert('Filtres bientôt disponibles')}>
                        <Filter size={16} />
                        Filtres
                    </button>
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                        <Plus size={16} />
                        Nouveau patient
                    </button>
                </div>

                {/* Patients Grid */}
                <div className="grid-3">
                    {filteredPatients.length > 0 ? filteredPatients.map((patient) => (
                        <div key={patient.id} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/patient/${patient.id}`)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)' }}>
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, var(--color-primary-100), var(--color-primary-200))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'var(--font-weight-semibold)',
                                    color: 'var(--color-primary-600)',
                                    fontSize: 'var(--font-size-lg)'
                                }}>
                                    {patient.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ marginBottom: 'var(--spacing-1)' }}>{patient.name}</h4>
                                    <span style={{ ...getDaysStyle(patient.daysUntil), fontSize: 'var(--font-size-sm)' }}>{patient.daysUntil} • {patient.operation}</span>
                                </div>
                            </div>

                            <div style={{ marginBottom: 'var(--spacing-4)' }}>
                                {getStatusBadge(patient.status)}
                            </div>

                            <div style={{
                                padding: 'var(--spacing-3)',
                                background: 'var(--color-gray-50)',
                                borderRadius: 'var(--radius-lg)',
                                fontSize: 'var(--font-size-sm)',
                                color: 'var(--color-gray-600)'
                            }}>
                                <div style={{ marginBottom: 'var(--spacing-2)' }}>📅 {patient.date}</div>
                                <div style={{ marginBottom: 'var(--spacing-2)' }}>📱 {patient.phone}</div>
                                <div>✉️ {patient.email}</div>
                            </div>
                        </div>
                    )) : (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--spacing-12)', color: 'var(--color-gray-400)' }}>
                            <Users size={48} style={{ marginBottom: 'var(--spacing-4)', opacity: 0.2 }} />
                            <p>Aucun patient ne correspond à votre recherche.</p>
                        </div>
                    )}
                </div>

                <AddPatientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            </main>
        </div>
    );
}
