// Logo icon only (lightning bolt) for collapsed/mobile sidebar
export default function LogoIcon({ width = "40px", className = "" }) {
    return (
        <svg
            width={width}
            height="auto"
            viewBox="200 0 130 570"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            style={{ height: 'auto', objectFit: 'contain' }}
        >
            <defs>
                <linearGradient id="iconBrownGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#C5A572', stopOpacity: 1 }} />
                    <stop offset="50%" style={{ stopColor: '#B3967A', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#8B7355', stopOpacity: 1 }} />
                </linearGradient>
            </defs>
            <path
                opacity="0.956863"
                d="M406.946 1.41211L412.116 2.74513V238.69H524.567L525.86 245.356L317.761 561.282L316.469 324.004H201.433L200.141 320.005L406.946 1.41211ZM381.096 102.722L257.012 292.011L401.776 294.677L344.905 326.67L347.49 462.639L471.573 273.349L324.224 270.683L381.096 241.357V102.722Z"
                fill="url(#iconBrownGradient)"
                stroke="url(#iconBrownGradient)"
                strokeWidth="2"
            />
        </svg>
    );
}
