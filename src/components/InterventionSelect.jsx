import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Clipboard, Plus, X } from 'lucide-react';

const INTERVENTIONS = [
    {
        category: "Visage",
        options: [
            "Rhinoplastie (nez) / rhinoseptoplastie",
            "Blépharoplastie (paupières sup/inf)",
            "Lifting cervico-facial (visage + cou)",
            "Mini-lift / lifting temporal (sourcils/haut du visage)",
            "Lifting frontal / lifting des sourcils",
            "Otoplastie (oreilles décollées)",
            "Génioplastie (menton : avancée/recul)",
            "Implants menton/joues (plus rare selon cabinets)",
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
            "Augmentation mammaire (implants ou lipofilling)",
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
            "Nymphoplastie / labioplastie (réduction des petites lèvres)",
            "Vaginoplastie (resserrement, selon indications)",
            "Pénoplastie (allongement/épaississement, selon techniques et indications)",
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
    const dropdownRef = useRef(null);

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

    return (
        <div style={{ position: 'relative', width: '100%' }} ref={dropdownRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'var(--color-white)',
                    border: '1px solid var(--color-gray-200)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '8px 12px',
                    minHeight: '46px',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    boxShadow: isOpen ? '0 0 0 3px var(--color-primary-50)' : 'none',
                    borderColor: isOpen ? 'var(--color-primary-400)' : 'var(--color-gray-200)',
                    flexWrap: 'wrap',
                    gap: '4px'
                }}
            >
                <Clipboard size={16} style={{ color: 'var(--color-gray-400)', marginRight: '8px' }} />

                {selectedOptions.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', flex: 1 }}>
                        {selectedOptions.map((opt, i) => (
                            <span key={i} style={{
                                background: 'var(--color-primary-50)',
                                color: 'var(--color-primary-700)',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                {opt}
                                <X
                                    size={10}
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
                    <div style={{ flex: 1, color: 'var(--color-gray-400)', fontSize: 'var(--font-size-sm)' }}>
                        Sélectionner intervention(s)
                    </div>
                )}

                <ChevronDown size={16} style={{ color: 'var(--color-gray-400)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: 'auto' }} />
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    maxHeight: '350px',
                    background: 'var(--color-white)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-xl)',
                    border: '1px solid var(--color-gray-200)',
                    zIndex: 1100,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    animation: 'slideIn 0.2s ease-out'
                }}>
                    <div style={{ padding: '8px', borderBottom: '1px solid var(--color-gray-100)', background: 'var(--color-gray-50)' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)' }} />
                            <input
                                autoFocus
                                className="input"
                                placeholder="Rechercher ou ajouter..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ paddingLeft: '32px', height: '34px', fontSize: 'var(--font-size-xs)' }}
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

                    <div style={{ overflowY: 'auto', flex: 1, padding: '4px' }}>
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
                                    padding: '10px 12px',
                                    fontSize: 'var(--font-size-sm)',
                                    color: 'var(--color-primary-600)',
                                    cursor: 'pointer',
                                    borderRadius: 'var(--radius-md)',
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
                            <div key={idx}>
                                <div style={{
                                    padding: '8px 12px 4px',
                                    fontSize: '10px',
                                    fontWeight: 'var(--font-weight-bold)',
                                    color: 'var(--color-gray-400)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    {cat.category}
                                </div>
                                {cat.options.map((opt, optIdx) => (
                                    <div
                                        key={optIdx}
                                        onClick={() => toggleOption(opt)}
                                        style={{
                                            padding: '8px 12px',
                                            fontSize: 'var(--font-size-sm)',
                                            color: 'var(--color-gray-700)',
                                            cursor: 'pointer',
                                            borderRadius: 'var(--radius-md)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            background: selectedOptions.includes(opt) ? 'var(--color-primary-50)' : 'transparent',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!selectedOptions.includes(opt)) e.currentTarget.style.background = 'var(--color-gray-50)';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!selectedOptions.includes(opt)) e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        <span>{opt}</span>
                                        {selectedOptions.includes(opt) && <Check size={14} style={{ color: 'var(--color-primary-600)' }} />}
                                    </div>
                                ))}
                            </div>
                        ))}
                        {filteredInterventions.length === 0 && !search && (
                            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-gray-400)', fontSize: 'var(--font-size-sm)' }}>
                                Aucun résultat pour "{search}"
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
