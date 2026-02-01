import { Bell } from 'lucide-react';

export default function Header({ title, subtitle }) {
    return (
        <header className="header">
            <div className="header-left">
                <h1>{title}</h1>
                {subtitle && <p>{subtitle}</p>}
            </div>
            <div className="header-right">
                <button className="header-notification">
                    <Bell size={20} />
                </button>
                <div className="header-profile">
                    <div className="header-avatar">CD</div>
                </div>
            </div>
        </header>
    );
}
