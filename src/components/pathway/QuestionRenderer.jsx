import { Info, AlertTriangle, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import DoctolibButton from './DoctolibButton';

/**
 * QuestionRenderer - Generic question component based on pathway config
 */
export default function QuestionRenderer({ item, value, onChange, screen }) {
    const [conditionalValue, setConditionalValue] = useState({});
    const [showInfo, setShowInfo] = useState(false);

    const handleChange = (newValue) => {
        onChange(item.id, newValue);

        // Reset conditional fields if condition no longer met
        if (item.conditional_field || item.conditional_fields) {
            setConditionalValue({});
        }
    };

    const handleConditionalChange = (fieldId, fieldValue) => {
        const updated = { ...conditionalValue, [fieldId]: fieldValue };
        setConditionalValue(updated);

        // Merge conditional values into main response
        onChange(item.id, {
            main: value,
            conditional: updated
        });
    };

    const renderInput = () => {
        switch (item.type) {
            case 'yes_no':
                return (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 'var(--spacing-4)',
                        marginTop: 'var(--spacing-4)'
                    }}>
                        <button
                            className={`btn btn-lg ${value === true ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => handleChange(true)}
                            style={{
                                height: '80px',
                                fontSize: 'var(--font-size-xl)',
                                fontWeight: 'var(--font-weight-bold)',
                                borderRadius: 'var(--radius-full)',
                                border: value === true ? '2px solid var(--color-primary-600)' : '2px solid var(--color-gray-200)',
                                boxShadow: value === true ? '0 10px 15px -3px rgba(var(--color-primary-rgb), 0.3)' : 'none',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                        >
                            OUI
                        </button>
                        <button
                            className={`btn btn-lg ${value === false ? 'btn-danger' : 'btn-secondary'}`}
                            onClick={() => handleChange(false)}
                            style={{
                                height: '80px',
                                fontSize: 'var(--font-size-xl)',
                                fontWeight: 'var(--font-weight-bold)',
                                borderRadius: 'var(--radius-full)',
                                border: value === false ? '2px solid var(--color-danger-600)' : '2px solid var(--color-gray-200)',
                                background: value === false ? 'var(--color-danger-500)' : 'white',
                                color: value === false ? 'white' : 'var(--color-gray-700)',
                                boxShadow: value === false ? '0 10px 15px -3px rgba(var(--color-danger-rgb), 0.3)' : 'none',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                        >
                            NON
                        </button>
                    </div>
                );

            case 'tri_state':
                return (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--spacing-3)',
                        marginTop: 'var(--spacing-4)'
                    }}>
                        {item.options.map(option => (
                            <button
                                key={option.value}
                                className={`btn btn-lg ${value === option.value ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => handleChange(option.value)}
                                style={{
                                    height: '70px',
                                    fontSize: 'var(--font-size-lg)',
                                    fontWeight: 'var(--font-weight-semibold)',
                                    borderRadius: 'var(--border-radius-xl)',
                                    border: value === option.value ? '2px solid var(--color-primary-600)' : '2px solid var(--color-gray-200)',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                );

            case 'multi_check':
                const selectedValues = Array.isArray(value) ? value : [];
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                        {item.options.map(option => (
                            <label
                                key={option.value}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-2)',
                                    padding: 'var(--spacing-3)',
                                    border: '1px solid var(--color-gray-300)',
                                    borderRadius: 'var(--border-radius-lg)',
                                    cursor: 'pointer',
                                    background: selectedValues.includes(option.value) ? 'var(--color-primary-50)' : 'white'
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedValues.includes(option.value)}
                                    onChange={(e) => {
                                        const updated = e.target.checked
                                            ? [...selectedValues, option.value]
                                            : selectedValues.filter(v => v !== option.value);
                                        handleChange(updated);
                                    }}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <span style={{ fontSize: 'var(--font-size-sm)' }}>{option.label}</span>
                            </label>
                        ))}
                    </div>
                );

            case 'slider_0_10': {
                const sliderVal = value !== undefined && value !== null ? value : 5;
                return (
                    <div>
                        <input
                            type="range"
                            min="0"
                            max="10"
                            value={sliderVal}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                handleChange(val);
                            }}
                            style={{
                                width: '100%',
                                height: '8px',
                                borderRadius: '4px',
                                background: `linear-gradient(to right, var(--color-success-500) 0%, var(--color-warning-500) 50%, var(--color-danger-500) 100%)`
                            }}
                        />
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginTop: 'var(--spacing-2)',
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--color-gray-600)'
                        }}>
                            <span>0 (Aucune)</span>
                            <span style={{ fontWeight: 'var(--font-weight-bold)', fontSize: 'var(--font-size-xl)', color: 'var(--color-gray-900)' }}>
                                {sliderVal}
                            </span>
                            <span>10 (Insupportable)</span>
                        </div>
                    </div>
                );
            }

            case 'text':
                return (
                    <textarea
                        value={value || ''}
                        onChange={(e) => handleChange(e.target.value)}
                        placeholder={item.placeholder || ''}
                        rows={item.multiline ? 4 : 2}
                        style={{
                            width: '100%',
                            padding: 'var(--spacing-3)',
                            border: '1px solid var(--color-gray-300)',
                            borderRadius: 'var(--border-radius-lg)',
                            fontSize: 'var(--font-size-base)',
                            fontFamily: 'inherit',
                            resize: 'vertical'
                        }}
                    />
                );

            case 'select': {
                // Options may be plain strings OR objects { value, label }
                const normalizedOptions = (item.options || []).map(opt =>
                    typeof opt === 'string' ? { value: opt, label: opt } : opt
                );
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-4)' }}>
                        {normalizedOptions.map(option => (
                            <button
                                key={option.value}
                                type="button"
                                className={`btn btn-lg ${value === option.value ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => handleChange(option.value)}
                                style={{
                                    height: '64px',
                                    fontSize: 'var(--font-size-base)',
                                    fontWeight: 'var(--font-weight-semibold)',
                                    borderRadius: 'var(--border-radius-xl)',
                                    border: value === option.value ? '2px solid var(--color-primary-600)' : '2px solid var(--color-gray-200)',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                );
            }
            case 'rating':
                return (
                    <div style={{ marginTop: 'var(--spacing-2)' }}>
                        <div style={{
                            position: 'relative',
                            padding: 'var(--spacing-4) 0'
                        }}>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                step="1"
                                value={value || 5}
                                onChange={(e) => handleChange(parseInt(e.target.value))}
                                style={{
                                    width: '100%',
                                    height: '12px',
                                    borderRadius: '6px',
                                    appearance: 'none',
                                    background: `linear-gradient(to right, 
                                        var(--color-danger-500) 0%, 
                                        var(--color-warning-500) 50%, 
                                        var(--color-success-500) 100%)`,
                                    cursor: 'pointer',
                                    outline: 'none'
                                }}
                            />
                            {/* Value Display */}
                            <div style={{
                                position: 'absolute',
                                left: `${((value || 5) - 1) * (100 / 9)}%`,
                                top: '-10px',
                                transform: 'translateX(-50%)',
                                background: 'white',
                                border: '2px solid var(--color-primary-500)',
                                color: 'var(--color-primary-700)',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: 'bold',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                pointerEvents: 'none',
                                transition: 'left 0.1s ease-out'
                            }}>
                                {value || 5}/10
                            </div>
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--color-gray-500)',
                            marginTop: '4px',
                            fontWeight: '500'
                        }}>
                            <span>1 (Pas du tout satisfait)</span>
                            <span>10 (Très satisfait)</span>
                        </div>
                    </div>
                );

            default:
                return <div>Type de question non supporté: {item.type}</div>;
        }
    };

    const renderConditionalFields = () => {
        // Single conditional field
        if (item.conditional_field) {
            const shouldShow = item.conditional_field.show_if === value ||
                (item.conditional_field.show_if_contains && Array.isArray(value) && value.includes(item.conditional_field.show_if_contains));

            if (!shouldShow) return null;

            const field = item.conditional_field;
            return (
                <div style={{ marginTop: 'var(--spacing-4)' }}>
                    <label style={{ display: 'block', marginBottom: 'var(--spacing-2)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                        {field.label}
                    </label>
                    {field.type === 'text' || field.type === 'slider_0_10' ? (
                        <textarea
                            value={conditionalValue[field.id || 'conditional'] || ''}
                            onChange={(e) => handleConditionalChange(field.id || 'conditional', e.target.value)}
                            placeholder={field.placeholder || ''}
                            rows={3}
                            style={{
                                width: '100%',
                                padding: 'var(--spacing-3)',
                                border: '1px solid var(--color-gray-300)',
                                borderRadius: 'var(--border-radius-lg)',
                                fontSize: 'var(--font-size-sm)',
                                fontFamily: 'inherit'
                            }}
                        />
                    ) : null}
                </div>
            );
        }

        // Multiple conditional fields
        if (item.conditional_fields) {
            const shouldShow = item.conditional_fields.show_if === value;
            if (!shouldShow) return null;

            return (
                <div style={{ marginTop: 'var(--spacing-4)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                    {item.conditional_fields.fields.map(field => (
                        <div key={field.id}>
                            <label style={{ display: 'block', marginBottom: 'var(--spacing-2)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                                {field.label}
                            </label>
                            {field.type === 'text' && (
                                <input
                                    type="text"
                                    value={conditionalValue[field.id] || ''}
                                    onChange={(e) => handleConditionalChange(field.id, e.target.value)}
                                    placeholder={field.placeholder || ''}
                                    style={{
                                        width: '100%',
                                        padding: 'var(--spacing-3)',
                                        border: '1px solid var(--color-gray-300)',
                                        borderRadius: 'var(--border-radius-lg)',
                                        fontSize: 'var(--font-size-sm)'
                                    }}
                                />
                            )}
                            {field.type === 'slider_0_10' && (
                                <QuestionRenderer
                                    item={{ ...field, id: field.id }}
                                    value={conditionalValue[field.id] || 0}
                                    onChange={(id, val) => handleConditionalChange(id, val)}
                                    screen={screen}
                                />
                            )}
                        </div>
                    ))}
                </div>
            );
        }

        return null;
    };

    const renderAlert = () => {
        // Alert if "no" response
        if (item.alert_if_no && value === false) {
            return (
                <div className="alert-banner alert-banner-danger" style={{ marginTop: 'var(--spacing-4)' }}>
                    <AlertTriangle size={18} />
                    <div>
                        <div className="alert-card-header" style={{ marginBottom: 0 }}>{item.alert_if_no.header}</div>
                        <div className="alert-card-message">{item.alert_if_no.message}</div>
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="question-card" style={{
            padding: 'var(--spacing-6)',
            borderRadius: 'var(--border-radius-2xl)',
            border: '2px solid var(--color-gray-100)',
            marginBottom: 'var(--spacing-6)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)'
        }}>
            {/* Warning Banner (if any) */}
            {item.warning_banner && (
                <div className={`alert-banner alert-banner-${item.warning_banner.type}`} style={{ marginBottom: 'var(--spacing-4)' }}>
                    <AlertTriangle size={18} />
                    <div style={{ fontSize: 'var(--font-size-sm)' }}>
                        <strong>Important :</strong> {item.warning_banner.message}
                    </div>
                </div>
            )}

            {/* Info Banner (if any) */}
            {item.info_banner && (
                <div className={`alert-banner alert-banner-${item.info_banner.type}`} style={{ marginBottom: 'var(--spacing-4)' }}>
                    <Info size={18} />
                    <div style={{ fontSize: 'var(--font-size-sm)' }}>
                        {item.info_banner.message}
                    </div>
                </div>
            )}

            {/* Question Title */}
            <div className="question-title" style={{
                fontSize: 'var(--font-size-xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-gray-900)',
                lineHeight: '1.4'
            }}>{item.label}</div>

            {/* Input */}
            {renderInput()}

            {/* Alert based on response */}
            {renderAlert()}

            {/* Conditional fields */}
            {renderConditionalFields()}

            {/* Why important + Action Button */}
            {(item.why || item.action) && (
                <div style={{ marginTop: 'var(--spacing-4)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        onClick={() => setShowInfo(true)}
                        style={{
                            background: 'var(--color-primary-50)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-primary-600)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <Info size={18} />
                    </button>
                </div>
            )}

            {/* Info Popup Overlay */}
            {showInfo && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(255, 255, 255, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: 'var(--spacing-6)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        animation: 'fadeIn 0.3s ease'
                    }}
                    onClick={() => setShowInfo(false)}
                >
                    <div
                        style={{
                            background: 'white',
                            borderRadius: '24px',
                            padding: 'var(--spacing-6)',
                            width: '100%',
                            maxWidth: '400px',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                            position: 'relative',
                            animation: 'slideUp 0.3s ease'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowInfo(false)}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                border: 'none',
                                background: 'var(--color-gray-100)',
                                borderRadius: '50%',
                                width: '30px',
                                height: '30px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--color-gray-500)'
                            }}
                        >
                            <X size={18} />
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--spacing-4)', color: 'var(--color-primary-600)' }}>
                            <Info size={24} />
                            <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Informations</h4>
                        </div>

                        {item.why && (
                            <div style={{ marginBottom: 'var(--spacing-4)' }}>
                                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-gray-400)', textTransform: 'uppercase', marginBottom: '4px' }}>Pourquoi est-ce important ?</div>
                                <div style={{ fontSize: '15px', lineHeight: '1.5', color: 'var(--color-gray-700)' }}>{item.why}</div>
                            </div>
                        )}

                        {item.action && (
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-gray-400)', textTransform: 'uppercase', marginBottom: '4px' }}>À faire maintenant</div>
                                <div style={{ fontSize: '15px', lineHeight: '1.5', color: 'var(--color-gray-700)' }}>{item.action}</div>
                            </div>
                        )}

                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: 'var(--spacing-6)', borderRadius: '14px' }}
                            onClick={() => setShowInfo(false)}
                        >
                            J'ai compris
                        </button>
                    </div>
                </div>
            )}

            {/* Special Doctolib Integration for Anesthesia question */}
            {(item.id === 'anesthesia_consultation' || item.label?.toLowerCase().includes('consultation d\'anesthésie')) && value !== true && (
                <div style={{ marginTop: 'var(--spacing-4)' }}>
                    <DoctolibButton />
                </div>
            )}
        </div>
    );
}
