import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardList } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import QuestionsPreviewModal from './QuestionsPreviewModal';

export default function Header({ title, subtitle, actions, hideTitleMobile = false }) {
    const { t } = useTranslation();
    const [isQuestionsModalOpen, setIsQuestionsModalOpen] = useState(false);

    return (
        <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className={`header-left ${hideTitleMobile ? 'hide-mobile' : ''}`}>
                <h1>{title}</h1>
                {subtitle && <p>{subtitle}</p>}
            </div>
            <div className="header-right" style={{ display: 'flex', gap: 'var(--spacing-4)', alignItems: 'center' }}>
                <button
                    onClick={() => setIsQuestionsModalOpen(true)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-2)',
                        padding: '8px 14px',
                        borderRadius: '12px',
                        border: '1px solid var(--color-primary-100)',
                        background: 'white',
                        color: 'var(--color-primary-600)',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: 'var(--shadow-sm)',
                        height: '38px'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.border = '1px solid var(--color-primary-200)';
                        e.currentTarget.style.background = 'var(--color-primary-50)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.border = '1px solid var(--color-primary-100)';
                        e.currentTarget.style.background = 'white';
                    }}
                >
                    <ClipboardList size={16} />
                    <span className="hide-mobile">{t('Aperçu des questions')}</span>
                </button>
                <LanguageSelector />
                {actions}
            </div>
            <QuestionsPreviewModal isOpen={isQuestionsModalOpen} onClose={() => setIsQuestionsModalOpen(false)} />
        </header>
    );
}

