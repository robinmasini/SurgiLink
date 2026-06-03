import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import QuestionRenderer from './QuestionRenderer';
import { ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { getCustomQuestions, answerCustomQuestion } from '../../services/customQuestionService';

export default function QuestionnaireFlow({
    config,
    responses,
    onChange,
    onComplete,
    saving,
    screen,
    patientId // added patientId prop
}) {
    const { t } = useTranslation();
    const [customQuestions, setCustomQuestions] = useState([]);
    const [loadingCustom, setLoadingCustom] = useState(false);

    useEffect(() => {
        if (patientId && screen) {
            loadCustomQuestions();
        }
    }, [patientId, screen]);

    const loadCustomQuestions = async () => {
        setLoadingCustom(true);
        const allCustom = await getCustomQuestions(patientId);
        // Filter strictly for this specific screen/milestone
        const relevant = allCustom.filter(q => q.screen === screen);
        setCustomQuestions(relevant);
        setLoadingCustom(false);
    };

    // Flatten all items from sections OR questions + custom questions
    const staticItems = config.sections ?
        config.sections.flatMap(section =>
            section.items.map(item => ({
                ...item,
                sectionTitle: section.title,
                sectionIcon: section.icon
            }))
        ) : (config.questions || []).map(item => ({
            ...item,
            sectionTitle: config.title,
            sectionIcon: config.icon
        }));

    const dynamicItems = customQuestions.map(q => ({
        id: `custom_${q.id}`,
        type: 'textarea', // Custom questions are usually textual
        label: q.question_text,
        required: true,
        sectionTitle: t("Question complémentaire"),
        sectionIcon: "💡",
        isCustom: true,
        originalId: q.id
    }));

    const allItems = [...staticItems, ...dynamicItems];

    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState('in'); // 'in' or 'out'
    const [initialRefreshed, setInitialRefreshed] = useState(false);

    // Initial load: find first unanswered question once responses are available
    useEffect(() => {
        if (!initialRefreshed && Object.keys(responses).length > 0) {
            const firstUnanswered = allItems.findIndex(item => {
                const response = responses[item.id]?.main ?? responses[item.id];
                return response === undefined || response === null || response === '';
            });
            if (firstUnanswered !== -1) {
                setCurrentIndex(firstUnanswered);
            }
            setInitialRefreshed(true);
        }
    }, [responses, initialRefreshed, allItems]);

    const currentItem = allItems[currentIndex];
    
    // Safety check for blank page issues
    if (!currentItem && allItems.length > 0) {
        // If index gets out of bounds, reset to last or first
        if (currentIndex < 0) setCurrentIndex(0);
        else if (currentIndex >= allItems.length) setCurrentIndex(allItems.length - 1);
    }

    const progress = allItems.length > 0 ? ((currentIndex + 1) / allItems.length) * 100 : 0;

    const isFirst = currentIndex === 0;
    const isLast = currentIndex === allItems.length - 1;

    // Auto-advance logic for yes/no if desired, but user didn't explicitly ask for auto-advance, 
    // just one-by-one with attention. I'll add a "Next" button for clarity, but auto-submit on last.

    const handleNext = () => {
        if (direction === 'out' || saving) return; // Prevent multiple clicks during transition
        
        if (isLast) {
            onComplete();
        } else {
            setDirection('out');
            setTimeout(() => {
                setCurrentIndex(prev => Math.min(prev + 1, allItems.length - 1));
                setDirection('in');
            }, 300);
        }
    };

    const handleBack = () => {
        if (direction === 'out' || isFirst) return;
        
        setDirection('out');
        setTimeout(() => {
            setCurrentIndex(prev => Math.max(prev - 1, 0));
            setDirection('in');
        }, 300);
    };

    // When answer changes, we might want a slight delay before auto-advancing if it's a simple choice
    const onQuestionAnswer = async (itemId, value) => {
        if (currentItem.isCustom) {
            // Save to custom_questions table
            await answerCustomQuestion(currentItem.originalId, value);
            // Update local responses state via parent
            await onChange(itemId, value);
        } else {
            await onChange(itemId, value);
        }

        // Ludic: If it's a yes_no or select, we can auto-advance after 500ms
        if (currentItem.type === 'yes_no' || currentItem.type === 'select' || currentItem.type === 'tri_state') {
            setTimeout(() => {
                // Re-verify currentItem inside timeout to be safe
                if (currentIndex < allItems.length - 1) {
                    handleNext();
                } else if (currentIndex === allItems.length - 1) {
                    // It's the last one, auto-submit
                    onComplete();
                }
            }, 600);
        }
    };

    return (
        <div className="questionnaire-flow">
            {/* Progress Header */}
            <div style={{ marginBottom: 'var(--spacing-8)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--spacing-3)' }}>
                    <div>
                        <span className="q-badge">{t('Question')} {currentIndex + 1} {t('sur')} {allItems.length}</span>
                        <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--color-gray-500)', fontWeight: 600 }}>
                            {currentItem ? t(currentItem.sectionTitle) : ''}
                        </h4>
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-primary-600)' }}>
                        {Math.round(progress)}%
                    </div>
                </div>
                <div className="q-progress-container">
                    <div className="q-progress-bar" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            {/* Question Container */}
            <div className={`question-flow-container ${direction === 'in' ? 'slide-in' : 'slide-out'}`}>
                {currentItem && (
                    <QuestionRenderer
                        key={currentItem.id}
                        item={currentItem}
                        value={responses[currentItem.id]?.main ?? responses[currentItem.id]}
                        onChange={onQuestionAnswer}
                        screen={screen}
                    />
                )}
            </div>

            {/* Navigation Controls */}
            <div style={{
                display: 'flex',
                gap: 'var(--spacing-4)',
                marginTop: 'var(--spacing-8)',
                paddingTop: 'var(--spacing-6)',
                borderTop: '1px solid var(--color-gray-100)'
            }}>
                {!isFirst && (
                    <button
                        className="btn btn-secondary"
                        onClick={handleBack}
                        style={{ flex: 1, borderRadius: 'var(--radius-xl)', height: '56px' }}
                    >
                        <ChevronLeft size={20} style={{ marginRight: '8px' }} />
                        {t('Précédent')}
                    </button>
                )}

                <button
                    className={`btn btn-primary ${isLast ? 'btn-success' : ''}`}
                    onClick={handleNext}
                    disabled={saving || !currentItem || (responses[currentItem.id] === undefined && currentItem.required !== false)}
                    style={{
                        flex: 2,
                        borderRadius: 'var(--radius-xl)',
                        height: '56px',
                        background: isLast ? 'var(--color-success-600)' : 'var(--color-primary-600)',
                        boxShadow: isLast ? '0 10px 15px -3px rgba(16, 185, 129, 0.3)' : '0 10px 15px -3px rgba(150, 122, 93, 0.3)'
                    }}
                >
                    {isLast ? (
                        <>
                            <CheckCircle2 size={20} style={{ marginRight: '8px' }} />
                            {saving ? t('Enregistrement...') : t('Terminer le questionnaire')}
                        </>
                    ) : (
                        <>
                            {t('Suivant')}
                            <ChevronRight size={20} style={{ marginLeft: '8px' }} />
                        </>
                    )}
                </button>
            </div>

            {/* Ludic hint */}
            <div style={{ textAlign: 'center', marginTop: 'var(--spacing-6)', color: 'var(--color-gray-400)', fontSize: '13px' }}>
                {t('Vos réponses sont enregistrées automatiquement.')}
            </div>
        </div>
    );
}
