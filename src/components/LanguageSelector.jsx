import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export default function LanguageSelector() {
    const { i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
            <Globe size={18} style={{ color: 'var(--color-gray-500)' }} />
            <select 
                value={i18n.language || 'fr'} 
                onChange={(e) => changeLanguage(e.target.value)}
                style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-gray-200)',
                    background: 'white',
                    color: 'var(--color-gray-700)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '500',
                    cursor: 'pointer',
                    outline: 'none'
                }}
            >
                <option value="fr">🇫🇷</option>
                <option value="en">🇬🇧</option>
                <option value="nl">🇳🇱</option>
            </select>
        </div>
    );
}
