import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Users,
    CheckCircle,
    AlertTriangle,
    Calendar,
    ChevronLeft,
    Search,
    Filter
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const categoryConfigs = {
    'active': { title: 'Patients Actifs', icon: <Users size={24} />, color: 'var(--color-primary-500)', bg: 'var(--color-primary-50)' },
    'complete': { title: 'Protocoles Complets', icon: <CheckCircle size={24} />, color: 'var(--color-success-500)', bg: 'var(--color-success-50)' },
    'required': { title: 'Actions Requises', icon: <AlertTriangle size={24} />, color: 'var(--color-warning-500)', bg: 'var(--color-warning-50)' },
    'weekly': { title: 'Interventions de la Semaine', icon: <Calendar size={24} />, color: 'var(--color-info-500)', bg: 'var(--color-info-50)' }
};

export default function CategoryReview() {
    const { category } = useParams();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [patients, setPatients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const config = categoryConfigs[category] || categoryConfigs['active'];

    useEffect(() => {
        const loadPatients = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('patients')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setPatients(data || []);
            } catch (err) {
                console.error('Error loading patients:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadPatients();
    }, []);

    // Filtering logic
    const filteredPatients = patients.filter(p => {
        const matchesCategory = (() => {
            if (category === 'complete') return p.progress === 100;
            if (category === 'required') return p.status === 'incomplete';
            if (category === 'weekly') return true; // simplified
            return true;
        })();

        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.operation.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesCategory && matchesSearch;
    });

    return (
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <main className="main-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
                    <button onClick={() => navigate('/dashboard')} className="btn btn-secondary btn-sm" style={{ padding: '8px' }}>
                        <ChevronLeft size={20} />
                    </button>
                    <Header
                        title={`Revue : ${config.title}`}
                        subtitle={`Liste détaillée des patients dans la catégorie ${config.title}`}
                    />
                </div>

                <div className="card glass-effect" style={{ marginBottom: 'var(--spacing-6)' }}>
                    <div style={{ display: 'flex', gap: 'var(--spacing-4)' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)' }} />
                            <input
                                className="input"
                                placeholder="Rechercher un patient..."
                                style={{ paddingLeft: '40px' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="btn btn-secondary" onClick={() => alert('Filtres bientôt disponibles')}>
                            <Filter size={18} />
                            Filtres
                        </button>
                    </div>
                </div>

                <div className="card">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-gray-100)' }}>
                                <th style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', fontWeight: 'var(--font-weight-medium)', textTransform: 'uppercase' }}>Patient</th>
                                <th style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', fontWeight: 'var(--font-weight-medium)', textTransform: 'uppercase' }}>Intervention</th>
                                <th style={{ textAlign: 'left', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', fontWeight: 'var(--font-weight-medium)', textTransform: 'uppercase' }}>Statut</th>
                                <th style={{ textAlign: 'right', padding: 'var(--spacing-3) var(--spacing-4)', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', fontWeight: 'var(--font-weight-medium)', textTransform: 'uppercase' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPatients.map((patient) => (
                                <tr key={patient.id} style={{ borderBottom: '1px solid var(--color-gray-50)' }}>
                                    <td style={{ padding: 'var(--spacing-4)' }}>
                                        <div style={{ fontWeight: 'var(--font-weight-medium)' }}>{patient.name}</div>
                                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)' }}>{patient.date}</div>
                                    </td>
                                    <td style={{ padding: 'var(--spacing-4)' }}>{patient.operation}</td>
                                    <td style={{ padding: 'var(--spacing-4)' }}>
                                        <div className="progress-bar" style={{ width: '100px' }}>
                                            <div className="progress-fill progress-fill-primary" style={{ width: `${patient.progress}%` }}></div>
                                        </div>
                                    </td>
                                    <td style={{ padding: 'var(--spacing-4)', textAlign: 'right' }}>
                                        <button onClick={() => navigate(`/patient/${patient.id}`)} className="btn btn-secondary btn-sm">
                                            Consulter
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}
