// Logo icon only (lightning bolt) for collapsed/mobile sidebar
export default function LogoIcon({ width = "40px", className = "" }) {
    return (
        <svg
            width={width}
            height="auto"
            viewBox="180 0 370 580"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            style={{ height: 'auto', objectFit: 'contain', display: 'block' }}
        >
            <defs>
                <linearGradient id="iconAccentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#7C3AED', stopOpacity: 1 }} />
                    <stop offset="50%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#6366F1', stopOpacity: 1 }} />
                </linearGradient>
            </defs>
            <path
                opacity="0.956863"
                d="M406.946 1.41211L412.116 2.74513V238.69H524.567L525.86 245.356L317.761 561.282L316.469 324.004H201.433L200.141 320.005L406.946 1.41211ZM381.096 102.722L257.012 292.011L401.776 294.677L344.905 326.67L347.49 462.639L471.573 273.349L324.224 270.683L381.096 241.357V102.722Z"
                fill="url(#iconAccentGradient)"
                stroke="url(#iconAccentGradient)"
                strokeWidth="2"
            />
        </svg>
    );
}
