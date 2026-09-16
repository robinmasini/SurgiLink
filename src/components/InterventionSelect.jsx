import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Clipboard, Plus, X } from 'lucide-react';

const INTERVENTIONS = [
    {
        category: "Visage",
        options: [
            "Paupières",
            "Lifting",
            "Rhinoplastie",
            "Botox",
            "Acide Hyaluronique",
            "Peeling",
            "Rhinoplastie (nez) / rhinoseptoplastie",
            "Blépharoplastie / Paupières (sup/inf)",
            "Lifting cervico-facial (visage + cou)",
            "Mini-lift / lifting temporal (sourcils/haut du visage)",
            "Lifting frontal / lifting des sourcils",
            "Otoplastie (oreilles décollées)",
            "Génioplastie (menton : avancée/recul)",
            "Implants menton/joues",
            "Bichectomie (boules de Bichat)",
            "Lifting des lèvres (lip lift)",
            "Chirurgie des pommettes (implants / remodelage)",
            "Chirurgie des cicatrices du visage (révision, correction)"
        ]
    },
    {
        category: "Cou / double menton",
        options: [
            "Liposuccion du cou / sous-menton",
            "Platysmaplastie (bandes du cou) souvent associée au lifting"
        ]
    },
    {
        category: "Poitrine",
        options: [
            "Prothèses mammaires",
            "Ptose mammaire",
            "Prothèses mammaires / Augmentation mammaire (implants ou lipofilling)",
            "Ptose mammaire (affaissement de la poitrine)",
            "Réduction mammaire",
            "Lifting mammaire (mastopexie) avec ou sans implants",
            "Chirurgie de gynécomastie (poitrine chez l’homme)",
            "Chirurgie aréole/mamelon : réduction, correction d’inversion, asymétries"
        ]
    },
    {
        category: "Silhouette / ventre / taille",
        options: [
            "Liposuccion / lipoaspiration (ventre, hanches, cuisses, bras, dos, genoux, menton…)",
            "Abdominoplastie (plastie abdominale) + cure de diastasis (remise en tension des abdos)",
            "Mini-abdominoplastie",
            "Body contouring / liposculpture (dessiner la silhouette)"
        ]
    },
    {
        category: "Fesses / hanches",
        options: [
            "Lipofilling des fesses (BBL) (selon protocoles et sécurité)",
            "Lifting des fesses",
            "Prothèses fessières (moins fréquent)"
        ]
    },
    {
        category: "Bras / cuisses / peau relâchée",
        options: [
            "Brachioplastie (lifting des bras)",
            "Cruroplastie (lifting des cuisses)",
            "Lifting du dos / des flancs (selon cas)",
            "Bodylift (lifting circulaire après amaigrissement important)"
        ]
    },
    {
        category: "Intime",
        options: [
            "Nymphoplastie",
            "Pénoplastie",
            "Nymphoplastie / labioplastie (réduction des petites lèvres)",
            "Vaginoplastie (resserrement, selon indications)",
            "Pénoplastie (allongement/épaississement, selon techniques et indications)",
            "Éjaculation Précoce",
            "Liposuccion du pubis (mont de Vénus)"
        ]
    },
    {
        category: "Chirurgie post-perte de poids (post-bariatrique)",
        options: [
            "Bodylift",
            "Abdominoplastie étendue",
            "Lifting bras/cuisses/poitrine",
            "Corrections de surplus cutané multi-zones"
        ]
    },
    {
        category: "Autres actes souvent proposés en chirurgie plastique",
        options: [
            "Révision de cicatrices (césarienne, accidents, anciennes chirurgies)",
            "Chirurgie des lobes d’oreilles (déchirure, élongation)"
        ]
    }
];

export default function InterventionSelect({ value, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const dropdownRef = useRef(null);

    // Track resize for mobile detection
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Parse existing value into an array
    const selectedOptions = value ? value.split(', ').filter(Boolean) : [];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (opt) => {
        let newOptions;
        if (selectedOptions.includes(opt)) {
            newOptions = selectedOptions.filter(o => o !== opt);
        } else {
            newOptions = [...selectedOptions, opt];
        }
        onChange(newOptions.join(', '));
    };

    const filteredInterventions = INTERVENTIONS.map(cat => ({
        ...cat,
        options: cat.options.filter(opt =>
            opt.toLowerCase().includes(search.toLowerCase())
        )
    })).filter(cat => cat.options.length > 0);

    const renderListContent = () => (
        <>
            {/* Custom Option */}
            {search.trim() && (
                <div
                    onClick={() => {
                        if (!selectedOptions.includes(search.trim())) {
                            toggleOption(search.trim());
                        }
                        setSearch("");
                    }}
                    style={{
                        padding: '12px 14px',
                        fontSize: '14px',
                        color: 'var(--color-primary-600)',
                        cursor: 'pointer',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        borderBottom: '1px solid var(--color-gray-100)',
                        background: 'var(--color-primary-50)',
                        marginBottom: '8px'
                    }}
                >
                    <Plus size={16} />
                    <div style={{ fontWeight: '600' }}>Ajouter "{search.trim()}"</div>
                </div>
            )}

            {filteredInterventions.map((cat, idx) => (
                <div key={idx} style={{ marginBottom: '10px' }}>
                    <div style={{
                        padding: '8px 12px 4px',
                        fontSize: '11px',
                        fontWeight: '800',
                        color: 'var(--color-gray-400)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>
                        {cat.category}
                    </div>
                    {cat.options.map((opt, optIdx) => {
                        const isSelected = selectedOptions.includes(opt);
                        return (
                            <div
                                key={optIdx}
                                onClick={() => toggleOption(opt)}
                                style={{
                                    padding: isMobile ? '12px 14px' : '9px 12px',
                                    fontSize: isMobile ? '15px' : '14px',
                                    color: isSelected ? 'var(--color-primary-700)' : '#374151',
                                    fontWeight: isSelected ? '700' : '500',
                                    cursor: 'pointer',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background: isSelected ? 'var(--color-primary-50)' : 'transparent',
                                    transition: 'background 0.15s',
                                    marginBottom: '2px'
                                }}
                            >
                                <span>{opt}</span>
                                {isSelected && <Check size={16} style={{ color: 'var(--color-primary-600)', flexShrink: 0 }} />}
                            </div>
                        );
                    })}
                </div>
            ))}
            {filteredInterventions.length === 0 && !search && (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-gray-400)', fontSize: '14px' }}>
                    Aucun résultat disponible
                </div>
            )}
        </>
    );

    return (
        <div style={{ position: 'relative', width: '100%' }} ref={dropdownRef}>
            {/* Field trigger */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'white',
                    border: '1.5px solid',
                    borderColor: isOpen ? 'var(--color-primary-400)' : '#E5E7EB',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    minHeight: '46px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    boxShadow: isOpen ? '0 0 0 3px rgba(37, 99, 235, 0.1)' : 'none',
                    flexWrap: 'wrap',
                    gap: '6px'
                }}
            >
                <Clipboard size={16} style={{ color: '#9CA3AF', marginRight: '6px', flexShrink: 0 }} />

                {selectedOptions.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', flex: 1 }}>
                        {selectedOptions.map((opt, i) => (
                            <span key={i} style={{
                                background: 'rgba(37, 99, 235, 0.08)',
                                color: '#1D4ED8',
                                padding: '3px 10px',
                                borderRadius: '16px',
                                fontSize: '12px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                {opt}
                                <X
                                    size={12}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleOption(opt);
                                    }}
                                    style={{ cursor: 'pointer' }}
                                />
                            </span>
                        ))}
                    </div>
                ) : (
                    <div style={{ flex: 1, color: '#9CA3AF', fontSize: '15px' }}>
                        Sélectionner une ou plusieurs interventions…
                    </div>
                )}

                <ChevronDown size={18} style={{ color: '#9CA3AF', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: 'auto', flexShrink: 0 }} />
            </div>

            {/* Selection UI: Desktop Dropdown vs Mobile Bottom Sheet Modal */}
            {isOpen && (
                isMobile ? (
                    /* ── Mobile Bottom Sheet Drawer Modal (Zero scroll traps!) ── */
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 10000,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        animation: 'fadeIn 0.2s ease-out'
                    }} onClick={() => setIsOpen(false)}>
                        <div
                            onClick={e => e.stopPropagation()}
                            style={{
                                background: 'white',
                                borderTopLeftRadius: '24px',
                                borderTopRightRadius: '24px',
                                maxHeight: '82vh',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                                boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
                                animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                            }}
                        >
                            {/* Drag Handle & Header */}
                            <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #F3F4F6', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ width: '36px', height: '4px', background: '#E5E7EB', borderRadius: '2px', alignSelf: 'center' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#111827' }}>
                                        Interventions ({selectedOptions.length})
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setIsOpen(false)}
                                        style={{ border: 'none', background: '#F3F4F6', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4B5563', cursor: 'pointer' }}
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                {/* Search Bar */}
                                <div style={{ position: 'relative' }}>
                                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                                    <input
                                        className="input"
                                        placeholder="Rechercher ou ajouter une intervention..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        style={{ paddingLeft: '38px', height: '42px', fontSize: '15px', borderRadius: '12px', border: '1.5px solid #E5E7EB', width: '100%', boxSizing: 'border-box' }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && search.trim()) {
                                                if (!selectedOptions.includes(search.trim())) {
                                                    toggleOption(search.trim());
                                                }
                                                setSearch("");
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Scrollable Items Container (Native Touch Inertia) */}
                            <div style={{
                                overflowY: 'auto',
                                flex: 1,
                                padding: '12px 16px',
                                WebkitOverflowScrolling: 'touch',
                                overscrollBehavior: 'contain'
                            }}>
                                {renderListContent()}
                            </div>

                            {/* Mobile Bottom Action Bar */}
                            <div style={{ padding: '12px 20px', borderTop: '1px solid #F3F4F6', background: 'white' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        borderRadius: '14px',
                                        border: 'none',
                                        background: 'var(--color-primary-600, #2563EB)',
                                        color: 'white',
                                        fontWeight: '700',
                                        fontSize: '15px',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                                    }}
                                >
                                    Valider la sélection {selectedOptions.length > 0 ? `(${selectedOptions.length})` : ''}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ── Desktop Floating Dropdown ── */
                    <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        maxHeight: '350px',
                        background: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                        border: '1px solid #E5E7EB',
                        zIndex: 1100,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        animation: 'slideIn 0.2s ease-out'
                    }}>
                        <div style={{ padding: '8px', borderBottom: '1px solid #F3F4F6', background: '#F9FAFB' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                                <input
                                    autoFocus
                                    className="input"
                                    placeholder="Rechercher ou ajouter..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{ paddingLeft: '32px', height: '36px', fontSize: '13px' }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && search.trim()) {
                                            if (!selectedOptions.includes(search.trim())) {
                                                toggleOption(search.trim());
                                            }
                                            setSearch("");
                                        }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>

                        <div style={{
                            overflowY: 'auto',
                            flex: 1,
                            padding: '6px',
                            WebkitOverflowScrolling: 'touch',
                            overscrollBehavior: 'contain'
                        }}>
                            {renderListContent()}
                        </div>
                    </div>
                )
            )}

            <style>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
}
