import Logo from './Logo';

export default function Header({ title, subtitle }) {
    return (
        <header className="header">
            <div className="header-left">
                <h1>{title}</h1>
                {subtitle && <p>{subtitle}</p>}
            </div>
            <div className="header-right">
                <Logo width="40px" />
            </div>
        </header>
    );
}
