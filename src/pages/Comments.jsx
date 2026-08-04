import { useState, useEffect } from 'react';
import wppPhone from '../assets/wpp-phone.png';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import {
    MessageSquare,
    Search,
    User,
    Clock,
    ArrowRight,
    MessageCircle,
    Calendar,
    Filter
} from 'lucide-react';

export default function Comments() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [comments, setComments] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, verbatim, custom

    useEffect(() => {
        loadAllComments();
    }, []);

    const loadAllComments = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch all patients (to get names)
            const { data: patients, error: patientsError } = await supabase
                .from('patients')
                .select('id, name, operation');

            if (patientsError) throw patientsError;
            const patientMap = {};
            patients.forEach(p => patientMap[p.id] = p);

            // 2. Fetch all verbatim/comments from pathway_responses
            const { data: verbatimData, error: verbatimError } = await supabase
                .from('pathway_responses')
                .select('*')
                .in('item_id', ['verbatim', 'comment', 'commentaire'])
                .not('response', 'is', null);

            if (verbatimError) throw verbatimError;

            // 3. Fetch all custom questions responses
            const { data: customData, error: customError } = await supabase
                .from('custom_questions')
                .select('*')
                .not('response', 'is', null);

            if (customError) throw customError;

            const verbatimComments = (verbatimData || []).map(v => {
                const textVal = typeof v.response === 'string'
                    ? v.response
                    : (v.response?.value || v.response?.main || '');
                return {
                    id: `v-${v.id}`,
                    patientId: v.patient_id,
                    patientName: patientMap[v.patient_id]?.name || 'Patient Inconnu',
                    patientOp: patientMap[v.patient_id]?.operation || '',
                    type: 'Satisfaction J+4',
                    text: textVal,
                    timestamp: v.updated_at,
                    category: 'verbatim'
                };
            }).filter(c => c.text && typeof c.text === 'string' && c.text.trim() !== '');

            const customComments = (customData || []).map(c => ({
                id: `c-${c.id}`,
                patientId: c.patient_id,
                patientName: patientMap[c.patient_id]?.name || 'Patient Inconnu',
                patientOp: patientMap[c.patient_id]?.operation || '',
                type: 'Question Ponctuelle',
                text: c.response,
                question: c.question_text,
                timestamp: c.updated_at,
                category: 'custom'
            })).filter(c => c.text && typeof c.text === 'string' && c.text.trim() !== '');

            // 4. Combine and format
            const allComments = [
                ...verbatimComments,
                ...customComments
            ];

            // Sort by descending timestamp
            allComments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setComments(allComments);

        } catch (err) {
            console.error('Error loading comments:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredComments = comments.filter(c => {
        const matchesSearch = c.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.text.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'all' || c.category === filterType;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="dashboard-layout" style={{ minHeight: '100vh', background: 'var(--color-gray-50)' }}>
            <Sidebar />
            <main className="main-content">
                <Header
                    title="Commentaires Patients"
                    subtitle={`${comments.length} retours enregistrés au cabinet`}
                />

                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)' }} />
                        <input
                            type="text"
                            placeholder="Rechercher par patient ou contenu..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 12px 10px 40px',
                                borderRadius: '12px',
                                border: '1px solid var(--color-gray-200)',
                                outline: 'none',
                                background: 'white'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        {['all', 'verbatim', 'custom'].map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '10px',
                                    border: '1px solid',
                                    borderColor: filterType === type ? 'var(--color-primary-500)' : 'var(--color-gray-200)',
                                    background: filterType === type ? 'var(--color-primary-500)' : 'white',
                                    color: filterType === type ? 'white' : 'var(--color-gray-600)',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {type === 'all' ? 'Tous' : type === 'verbatim' ? 'Satisfaction J+4' : 'Questions Ponctuelles'}
                            </button>
                        ))}
                    </div>
                </div>

                {isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
                        <div className="spinner" style={{ borderColor: 'var(--color-primary-200)', borderTopColor: 'var(--color-primary-600)' }}></div>
                    </div>
                ) : filteredComments.length === 0 ? (
                    <div className="card" style={{ padding: '80px', textAlign: 'center', color: 'var(--color-gray-400)' }}>
                        <MessageCircle size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
                        <p>Aucun commentaire trouvé.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
                        {filteredComments.map(comment => (
                            <div key={comment.id} className="card glass-effect" style={{
                                padding: '24px',
                                border: '1px solid var(--color-primary-100)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px',
                                position: 'relative',
                                background: 'white',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                cursor: 'default'
                            }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: 'var(--color-primary-100)',
                                            color: 'var(--color-primary-700)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '14px',
                                            fontWeight: 'bold'
                                        }}>
                                            {comment.patientName.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-gray-900)' }}>
                                                {comment.patientName}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--color-gray-500)' }}>
                                                {comment.patientOp}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        background: comment.category === 'verbatim' ? 'var(--color-success-50)' : 'var(--color-info-50)',
                                        color: comment.category === 'verbatim' ? 'var(--color-success-700)' : 'var(--color-info-700)',
                                        fontSize: '10px',
                                        fontWeight: '700',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.02em'
                                    }}>
                                        {comment.type}
                                    </div>
                                </div>

                                <div style={{
                                    flex: 1,
                                    padding: '16px',
                                    background: 'var(--color-gray-50)',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    lineHeight: '1.6',
                                    color: 'var(--color-gray-800)',
                                    fontStyle: 'italic',
                                    border: '1px solid var(--color-gray-100)'
                                }}>
                                    {comment.question && (
                                        <div style={{ fontSize: '11px', color: 'var(--color-gray-400)', marginBottom: '8px', fontWeight: '600', fontStyle: 'normal' }}>
                                            Q: {comment.question}
                                        </div>
                                    )}
                                    "{comment.text}"
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-gray-400)', fontSize: '12px' }}>
                                        <Calendar size={14} />
                                        <span>{new Date(comment.timestamp).toLocaleDateString('fr-FR')} à {new Date(comment.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/patient/${comment.patientId}`)}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'var(--color-primary-600)',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        Voir dossier <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
