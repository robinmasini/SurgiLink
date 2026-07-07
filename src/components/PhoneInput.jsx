import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Phone } from 'lucide-react';

const countries = [
    { name: 'France', code: '+33', flag: '🇫🇷' },
    { name: 'Belgique', code: '+32', flag: '🇧🇪' },
    { name: 'Suisse', code: '+41', flag: '🇨🇭' },
    { name: 'Luxembourg', code: '+352', flag: '🇱🇺' },
    { name: 'Royaume-Uni', code: '+44', flag: '🇬🇧' },
    { name: 'États-Unis', code: '+1', flag: '🇺🇸' },
    { name: 'Espagne', code: '+34', flag: '🇪🇸' },
    { name: 'Italie', code: '+39', flag: '🇮🇹' },
    { name: 'Allemagne', code: '+49', flag: '🇩🇪' },
    { name: 'Portugal', code: '+351', flag: '🇵🇹' },
    { name: 'Canada', code: '+1', flag: '🇨🇦' },
    { name: 'Maroc', code: '+212', flag: '🇲🇦' },
    { name: 'Algérie', code: '+213', flag: '🇩🇿' },
    { name: 'Tunisie', code: '+216', flag: '🇹🇳' },
];

export default function PhoneInput({ value, onChange, placeholder = '6 00 00 00 00', error, onKeyDown, autoFocus }) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState(countries[0]);
    const dropdownRef = useRef(null);

    // Parse initial value to determine country if possible
    useEffect(() => {
        if (value && typeof value === 'string') {
            const found = countries.find(c => value.startsWith(c.code));
            if (found) {
                setSelectedCountry(found);
            }
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatValue = (val, countryCode) => {
        if (!val) return '';
        // Remove all non-numeric characters for processing
        const numbers = val.replace(/\D/g, '');

        if (countryCode === '+33') {
            // French format: X XX XX XX XX
            const chars = numbers.split('');
            let formatted = '';
            for (let i = 0; i < chars.length && i < 9; i++) {
                if (i === 1 || i === 3 || i === 5 || i === 7) formatted += ' ';
                formatted += chars[i];
            }
            return formatted;
        }

        // Default: just groups of 2 or 3? Let's stay simple for others
        // but maybe just group by 2 for general readability
        const chars = numbers.split('');
        let formatted = '';
        for (let i = 0; i < chars.length; i++) {
            if (i > 0 && i % 2 === 0 && countryCode !== '+1') formatted += ' ';
            formatted += chars[i];
        }
        return formatted;
    };

    const handleCountrySelect = (country) => {
        let rawValue = value ? value.replace(selectedCountry.code, '').replace(/\s/g, '') : '';
        if (rawValue.startsWith('0')) {
            rawValue = rawValue.substring(1);
        }
        setSelectedCountry(country);
        const formatted = formatValue(rawValue, country.code);
        onChange(`${country.code} ${formatted}`);
        setIsOpen(false);
    };

    const handleInputChange = (e) => {
        let rawInput = e.target.value;

        // Strip prefix if user pasted it
        if (rawInput.startsWith(selectedCountry.code)) {
            rawInput = rawInput.replace(selectedCountry.code, '');
        }

        // Clean, strip leading 0, and reformat
        let numbersOnly = rawInput.replace(/\D/g, '');
        if (numbersOnly.startsWith('0')) {
            numbersOnly = numbersOnly.substring(1);
        }
        const formatted = formatValue(numbersOnly, selectedCountry.code);

        onChange(`${selectedCountry.code} ${formatted}`);
    };

    const displayValue = value ? value.replace(selectedCountry.code, '').trim() : '';

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--color-white)',
                border: '1px solid var(--color-gray-200)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                transition: 'all var(--transition-fast)',
                boxShadow: isOpen ? '0 0 0 3px var(--color-primary-50)' : 'none',
                borderColor: error ? '#EF4444' : (isOpen ? 'var(--color-primary-400)' : 'var(--color-gray-200)')
            }}>
                {/* Country Selector */}
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '0 12px',
                        height: '46px',
                        borderRight: '1px solid var(--color-gray-100)',
                        cursor: 'pointer',
                        background: 'var(--color-gray-50)',
                        userSelect: 'none',
                        minWidth: '95px'
                    }}
                >
                    <span style={{ fontSize: '1.2rem' }}>{selectedCountry.flag}</span>
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-700)' }}>
                        {selectedCountry.code}
                    </span>
                    <ChevronDown size={14} style={{ color: 'var(--color-gray-400)', marginLeft: '2px' }} />
                </div>

                {/* Number Input */}
                <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                    <Phone size={14} style={{ position: 'absolute', left: '12px', color: 'var(--color-gray-400)' }} />
                    <input
                        type="tel"
                        className="input"
                        placeholder={placeholder}
                        value={displayValue}
                        onChange={handleInputChange}
                        onKeyDown={onKeyDown}
                        autoFocus={autoFocus}
                        style={{
                            border: 'none',
                            boxShadow: 'none',
                            paddingLeft: '34px',
                            height: '46px',
                            width: '100%'
                        }}
                    />
                </div>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div
                    ref={dropdownRef}
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        width: '240px',
                        maxHeight: '250px',
                        overflowY: 'auto',
                        background: 'var(--color-white)',
                        border: '1px solid var(--color-gray-200)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: 'var(--shadow-lg)',
                        zIndex: 1000,
                        padding: '4px'
                    }}
                >
                    {countries.map((country) => (
                        <div
                            key={country.code + country.name}
                            onClick={() => handleCountrySelect(country)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '8px 12px',
                                cursor: 'pointer',
                                borderRadius: 'var(--radius-md)',
                                transition: 'background 0.2s',
                                background: selectedCountry.code === country.code && selectedCountry.name === country.name ? 'var(--color-primary-50)' : 'transparent'
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'var(--color-gray-50)'}
                            onMouseLeave={(e) => e.target.style.background = selectedCountry.code === country.code && selectedCountry.name === country.name ? 'var(--color-primary-50)' : 'transparent'}
                        >
                            <span style={{ fontSize: '1.2rem' }}>{country.flag}</span>
                            <span style={{ flex: 1, fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-700)' }}>{country.name}</span>
                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)', fontWeight: 'var(--font-weight-medium)' }}>{country.code}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
