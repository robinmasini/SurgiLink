import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Hash } from 'lucide-react';

/**
 * Ultra-ergonomic Birth Date Picker component for mobile and desktop.
 * Offers two modes:
 *  1. Molettes / Dropdowns (Jour, Mois, Année) - max year = current year (2026).
 *  2. Clavier / Saisie directe (JJ, MM, AAAA) with inputMode="numeric", auto-advancing focus, and year capping <= current year.
 *
 * @param {string} value - Date string in YYYY-MM-DD format (e.g. "1987-05-24")
 * @param {function} onChange - Callback function receiving ISO string "YYYY-MM-DD"
 * @param {boolean} disabled - Optional disabled state
 * @param {object} style - Optional container inline styles
 */
export default function BirthDatePicker({ value = '', onChange, disabled = false, style = {} }) {
    const currentYear = new Date().getFullYear();
    const [mode, setMode] = useState('select'); // 'select' | 'input'
    const [day, setDay] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');

    const dayRef = useRef(null);
    const monthRef = useRef(null);
    const yearRef = useRef(null);

    // Parse incoming value "YYYY-MM-DD" when value changes
    useEffect(() => {
        if (value && typeof value === 'string') {
            const cleanVal = value.split('T')[0];
            const parts = cleanVal.split('-');
            if (parts.length === 3) {
                const y = parts[0];
                const m = parts[1].padStart(2, '0');
                const d = parts[2].padStart(2, '0');
                setYear(y);
                setMonth(m);
                setDay(d);
                return;
            }
        }
        if (!value) {
            setDay('');
            setMonth('');
            setYear('');
        }
    }, [value]);

    const MONTHS = [
        { value: '01', label: 'Janvier' },
        { value: '02', label: 'Février' },
        { value: '03', label: 'Mars' },
        { value: '04', label: 'Avril' },
        { value: '05', label: 'Mai' },
        { value: '06', label: 'Juin' },
        { value: '07', label: 'Juillet' },
        { value: '08', label: 'Août' },
        { value: '09', label: 'Septembre' },
        { value: '10', label: 'Octobre' },
        { value: '11', label: 'Novembre' },
        { value: '12', label: 'Décembre' }
    ];

    // Generate years in reverse chronological order (current year down to 1915)
    const years = [];
    for (let y = currentYear; y >= 1915; y--) {
        years.push(String(y));
    }

    // Determine days count based on month and year
    const getDaysInMonth = (m, y) => {
        if (!m) return 31;
        const monthNum = parseInt(m, 10);
        if (monthNum === 2) {
            const yearNum = parseInt(y, 10);
            if (yearNum && ((yearNum % 4 === 0 && yearNum % 100 !== 0) || yearNum % 400 === 0)) {
                return 29;
            }
            return 28;
        }
        if ([4, 6, 9, 11].includes(monthNum)) {
            return 30;
        }
        return 31;
    };

    const maxDays = getDaysInMonth(month, year);
    const days = [];
    for (let d = 1; d <= maxDays; d++) {
        days.push(String(d).padStart(2, '0'));
    }

    // Helper to notify parent of date change
    const updateParent = (newDay, newMonth, newYear) => {
        if (newDay && newMonth && newYear && newYear.length === 4) {
            let validYear = parseInt(newYear, 10);
            if (validYear > currentYear) {
                validYear = currentYear;
            }
            const formattedYear = String(validYear);

            const maxForNew = getDaysInMonth(newMonth, formattedYear);
            let validDay = parseInt(newDay, 10);
            if (validDay > maxForNew) validDay = maxForNew;
            if (validDay < 1) validDay = 1;
            const formattedDay = String(validDay).padStart(2, '0');

            let validMonth = parseInt(newMonth, 10);
            if (validMonth > 12) validMonth = 12;
            if (validMonth < 1) validMonth = 1;
            const formattedMonth = String(validMonth).padStart(2, '0');

            const iso = `${formattedYear}-${formattedMonth}-${formattedDay}`;
            onChange(iso);
        } else {
            onChange('');
        }
    };

    // --- Dropdown Mode Handlers ---
    const handleDaySelect = (e) => {
        const val = e.target.value;
        setDay(val);
        updateParent(val, month, year);
    };

    const handleMonthSelect = (e) => {
        const val = e.target.value;
        setMonth(val);
        updateParent(day, val, year);
    };

    const handleYearSelect = (e) => {
        const val = e.target.value;
        setYear(val);
        updateParent(day, month, val);
    };

    // --- Direct Input Mode Handlers (with auto-focus & validation) ---
    const handleDayInput = (e) => {
        const raw = e.target.value.replace(/\D/g, '').slice(0, 2);
        setDay(raw);
        updateParent(raw, month, year);
        if (raw.length === 2 && monthRef.current) {
            monthRef.current.focus();
        }
    };

    const handleMonthInput = (e) => {
        const raw = e.target.value.replace(/\D/g, '').slice(0, 2);
        let val = raw;
        if (raw.length === 2 && parseInt(raw, 10) > 12) {
            val = '12';
        }
        setMonth(val);
        updateParent(day, val, year);
        if (val.length === 2 && yearRef.current) {
            yearRef.current.focus();
        }
    };

    const handleYearInput = (e) => {
        const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
        let val = raw;
        if (raw.length === 4) {
            const num = parseInt(raw, 10);
            if (num > currentYear) {
                val = String(currentYear);
            }
        }
        setYear(val);
        updateParent(day, month, val);
    };

    const handleKeyDown = (e, field) => {
        if (e.key === 'Backspace') {
            if (field === 'month' && !month && dayRef.current) {
                dayRef.current.focus();
            } else if (field === 'year' && !year && monthRef.current) {
                monthRef.current.focus();
            }
        }
    };

    const handleYearBlur = () => {
        if (year) {
            let num = parseInt(year, 10);
            if (isNaN(num)) return;
            if (num > currentYear) num = currentYear;
            if (num < 1900 && num > 99) num = 1915;
            const capped = String(num);
            setYear(capped);
            updateParent(day, month, capped);
        }
    };

    const selectStyle = {
        height: '46px',
        padding: '0 10px',
        fontSize: '14px',
        fontWeight: '600',
        color: '#111827',
        background: 'white',
        border: '1.5px solid #E5E7EB',
        borderRadius: '12px',
        outline: 'none',
        boxSizing: 'border-box',
        transition: 'all 0.15s'
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', ...style }}>
            {/* Header & Mode Switcher */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Saisie Ergonomique
                </span>
                <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: '8px', padding: '2px' }}>
                    <button
                        type="button"
                        onClick={() => setMode('select')}
                        disabled={disabled}
                        style={{
                            border: 'none',
                            background: mode === 'select' ? 'white' : 'transparent',
                            color: mode === 'select' ? '#2563EB' : '#6B7280',
                            fontWeight: mode === 'select' ? '700' : '500',
                            fontSize: '11px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: mode === 'select' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.15s'
                        }}
                    >
                        <Calendar size={12} />
                        Molettes
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('input')}
                        disabled={disabled}
                        style={{
                            border: 'none',
                            background: mode === 'input' ? 'white' : 'transparent',
                            color: mode === 'input' ? '#2563EB' : '#6B7280',
                            fontWeight: mode === 'input' ? '700' : '500',
                            fontSize: '11px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: mode === 'input' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.15s'
                        }}
                    >
                        <Hash size={12} />
                        Taper
                    </button>
                </div>
            </div>

            {/* Inputs / Selects Row */}
            {mode === 'select' ? (
                <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                    {/* Jour */}
                    <select
                        value={day}
                        onChange={handleDaySelect}
                        disabled={disabled}
                        style={{
                            ...selectStyle,
                            flex: '1 1 28%',
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 8px center',
                            backgroundSize: '12px'
                        }}
                        aria-label="Jour de naissance"
                    >
                        <option value="">Jour</option>
                        {days.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>

                    {/* Mois */}
                    <select
                        value={month}
                        onChange={handleMonthSelect}
                        disabled={disabled}
                        style={{
                            ...selectStyle,
                            flex: '1.4 1 44%',
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 8px center',
                            backgroundSize: '12px'
                        }}
                        aria-label="Mois de naissance"
                    >
                        <option value="">Mois</option>
                        {MONTHS.map(m => (
                            <option key={m.value} value={m.value}>{m.value} - {m.label}</option>
                        ))}
                    </select>

                    {/* Année (Capped <= currentYear) */}
                    <select
                        value={year}
                        onChange={handleYearSelect}
                        disabled={disabled}
                        style={{
                            ...selectStyle,
                            flex: '1 1 28%',
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 8px center',
                            backgroundSize: '12px'
                        }}
                        aria-label="Année de naissance"
                    >
                        <option value="">Année</option>
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            ) : (
                <div style={{ display: 'flex', gap: '6px', width: '100%', alignItems: 'center' }}>
                    {/* Jour Input */}
                    <input
                        ref={dayRef}
                        type="text"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        placeholder="JJ"
                        maxLength={2}
                        value={day}
                        onChange={handleDayInput}
                        disabled={disabled}
                        style={{ ...selectStyle, flex: '1 1 28%', textAlign: 'center', letterSpacing: '1px' }}
                        aria-label="Jour de naissance"
                    />

                    <span style={{ color: '#9CA3AF', fontWeight: 'bold' }}>/</span>

                    {/* Mois Input */}
                    <input
                        ref={monthRef}
                        type="text"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        placeholder="MM"
                        maxLength={2}
                        value={month}
                        onChange={handleMonthInput}
                        onKeyDown={(e) => handleKeyDown(e, 'month')}
                        disabled={disabled}
                        style={{ ...selectStyle, flex: '1 1 28%', textAlign: 'center', letterSpacing: '1px' }}
                        aria-label="Mois de naissance"
                    />

                    <span style={{ color: '#9CA3AF', fontWeight: 'bold' }}>/</span>

                    {/* Année Input (Restricted to <= currentYear) */}
                    <input
                        ref={yearRef}
                        type="text"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        placeholder={`AAAA`}
                        maxLength={4}
                        value={year}
                        onChange={handleYearInput}
                        onKeyDown={(e) => handleKeyDown(e, 'year')}
                        onBlur={handleYearBlur}
                        disabled={disabled}
                        style={{ ...selectStyle, flex: '1.4 1 44%', textAlign: 'center', letterSpacing: '1px' }}
                        aria-label="Année de naissance"
                    />
                </div>
            )}
        </div>
    );
}
