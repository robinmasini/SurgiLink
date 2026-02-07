export default function Header({ title, subtitle }) {
    return (
        <header className="header">
            <div className="header-left">
                <h1>{title}</h1>
                {subtitle && <p>{subtitle}</p>}
            </div>
        </header>
    );
}
