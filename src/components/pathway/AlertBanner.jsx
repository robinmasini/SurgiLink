import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';

/**
 * AlertBanner - Display risk alerts and notifications
 */
export default function AlertBanner({ type = 'info', title, message, actions, dismissible = false, onDismiss }) {
    const getIcon = () => {
        switch (type) {
            case 'danger':
            case 'hard':
                return <AlertTriangle size={20} />;
            case 'warning':
            case 'soft':
                return <AlertCircle size={20} />;
            case 'success':
                return <CheckCircle size={20} />;
            case 'info':
            default:
                return <Info size={20} />;
        }
    };

    const getClassName = () => {
        switch (type) {
            case 'danger':
            case 'hard':
                return 'alert-banner alert-banner-danger';
            case 'warning':
            case 'soft':
                return 'alert-banner alert-banner-warning';
            case 'success':
                return 'alert-banner alert-banner-success';
            case 'info':
            default:
                return 'alert-banner alert-banner-primary';
        }
    };

    return (
        <div className={getClassName()} style={{ position: 'relative' }}>
            {getIcon()}
            <div style={{ flex: 1 }}>
                {title && <div style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: title && message ? 'var(--spacing-1)' : 0 }}>{title}</div>}
                {message && <div style={{ opacity: 0.9, fontSize: title ? 'var(--font-size-sm)' : 'var(--font-size-base)' }}>{message}</div>}
                {actions && (
                    <div style={{ display: 'flex', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-3)' }}>
                        {actions.map((action, index) => (
                            <button
                                key={index}
                                onClick={action.onClick}
                                className="btn btn-sm"
                                style={{
                                    ...action.style
                                }}
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            {dismissible && onDismiss && (
                <button
                    onClick={onDismiss}
                    style={{
                        position: 'absolute',
                        top: 'var(--spacing-2)',
                        right: 'var(--spacing-2)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 'var(--spacing-1)',
                        opacity: 0.7
                    }}
                >
                    ✕
                </button>
            )}
        </div>
    );
}
