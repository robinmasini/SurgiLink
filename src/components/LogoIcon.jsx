import logoSurgilinkGreen from '../assets/logo_surgilink_premium_green.png';

// Logo icon only (lightning bolt) for collapsed/mobile sidebar
export default function LogoIcon({ width = "40px", className = "", white = false }) {
    return (
        <div className={className} style={{ width, display: 'flex', justifyContent: 'center' }}>
            <img
                src={logoSurgilinkGreen}
                alt="SurgiLink Bolt Icon"
                style={{
                    width: '100%',
                    height: 'auto',
                    filter: white ? 'brightness(0) invert(1)' : 'none'
                }}
            />
        </div>
    );
}
