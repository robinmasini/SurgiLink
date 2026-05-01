import logoSurgilinkGreen from '../assets/logo_surgilink_premium_green.png';

export default function LogoPremium({ width = "160px", className = "", white = false }) {
    return (
        <div className={`logo-container-shine ${className}`} style={{ width, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0' }}>
            <img
                src={logoSurgilinkGreen}
                alt="SurgiLink"
                style={{ width: '100%', height: 'auto', filter: white ? 'brightness(0) invert(1)' : 'none' }}
            />
        </div>
    );
}
