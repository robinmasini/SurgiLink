import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Users, Search, Filter, Plus } from 'lucide-react';

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
                        />
                    </div>
                    <button className="btn btn-secondary">
                        <Filter size={16} />
                        Filtres
                    </button>
                    <button className="btn btn-primary">
                        <Plus size={16} />
                        Nouveau patient
                    </button>
                </div>

                {/* Patients Grid */}
                <div className="grid-3">
                    {patients.map((patient) => (
                        <div key={patient.id} className="card" style={{ cursor: 'pointer' }}>
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
                    ))}
                </div>
            </main>
        </div>
    );
}
