import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardList } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import QuestionsPreviewModal from './QuestionsPreviewModal';
import logoSlMa from '../assets/logo-sl-ma.png';

export default function Header({ title, subtitle, actions, hideTitleMobile = false, hideQuestionsPreviewMobile = false, mobileActions }) {
    const { t } = useTranslation();
    const [isQuestionsModalOpen, setIsQuestionsModalOpen] = useState(false);

    return (
        <header className="header-container" style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: 'var(--spacing-4)' }}>
            <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0, width: '100%' }}>
                {/* Desktop Left: Title */}
                <div className="header-left hide-mobile">
                    <h1>{title}</h1>
                    {subtitle && <p>{subtitle}</p>}
                </div>

                {/* Mobile Left: Combined Logo */}
                <div className="show-mobile" style={{ display: 'none', alignItems: 'center' }}>
                    <img src={logoSlMa} alt="SurgiLink / Medical Alliance" style={{ height: '52px', objectFit: 'contain' }} />
                </div>

                {/* Right: Actions */}
                <div className="header-right" style={{ display: 'flex', gap: 'var(--spacing-3)', alignItems: 'center' }}>
                    <button
                        onClick={() => setIsQuestionsModalOpen(true)}
                        className="hide-mobile"
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
                        <span>{t('Aperçu')}</span>
                    </button>
                    <LanguageSelector />
                    {actions}
                </div>
            </div>

            {/* Additional mobile actions above Aperçu */}
            {mobileActions && (
                <div className="show-mobile" style={{ width: '100%', marginTop: 'var(--spacing-3)' }}>
                    {mobileActions}
                </div>
            )}

            {/* Mobile Button - rendered below Translation and Add Patient actions */}
            {!hideQuestionsPreviewMobile && (
                <button
                    onClick={() => setIsQuestionsModalOpen(true)}
                    className="show-mobile"
                    style={{
                        display: 'none', // Overridden by CSS media query on mobile
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 'var(--spacing-2)',
                        padding: '10px 16px',
                        borderRadius: '12px',
                        border: '1px solid var(--color-primary-100)',
                        background: 'white',
                        color: 'var(--color-primary-600)',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: 'var(--shadow-sm)',
                        height: '42px',
                        width: '100%',
                        marginTop: 'var(--spacing-3)'
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
                    <span>{t('Aperçu')}</span>
                </button>
            )}

            <QuestionsPreviewModal isOpen={isQuestionsModalOpen} onClose={() => setIsQuestionsModalOpen(false)} />
        </header>
    );
}

