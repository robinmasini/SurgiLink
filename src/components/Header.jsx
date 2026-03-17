export default function Header({ title, subtitle, actions, hideTitleMobile = false }) {
    return (
        <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className={`header-left ${hideTitleMobile ? 'hide-mobile' : ''}`}>
                <h1>{title}</h1>
                {subtitle && <p>{subtitle}</p>}
            </div>
            {actions && (
                <div className="header-right">
                    {actions}
                </div>
            )}
        </header>
    );
}
