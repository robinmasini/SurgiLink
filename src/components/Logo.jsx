import logoSurgilinkGreen from '../assets/logo_surgilink_premium_green.png';

export default function Logo({ width = "200px", className = "" }) {
    return (
        <div className={`logo-container-shine ${className}`} style={{ width, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0' }}>
            <img
                src={logoSurgilinkGreen}
                alt="SurgiLink"
                style={{ width: '100%', height: 'auto' }}
            />
        </div>
    );
}
