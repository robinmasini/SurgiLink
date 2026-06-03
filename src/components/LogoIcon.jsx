// Logo icon only (lightning bolt) for collapsed/mobile sidebar
export default function LogoIcon({ width = "40px", className = "", white = false }) {
    const color = white ? "#FFFFFF" : "var(--color-primary-500, #6D8C7C)";
    return (
        <div className={className} style={{ width, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <svg
                width="100%"
                height="100%"
                viewBox="200 0 326 562"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ display: 'block' }}
            >
                <path
                    opacity="0.956863"
                    d="M406.946 1.41211L412.116 2.74513V238.69H524.567L525.86 245.356L317.761 561.282L316.469 324.004H201.433L200.141 320.005L406.946 1.41211ZM381.096 102.722L257.012 292.011L401.776 294.677L344.905 326.67L347.49 462.639L471.573 273.349L324.224 270.683L381.096 241.357V102.722Z"
                    fill={color}
                    stroke={color}
                    strokeWidth="2"
                />
            </svg>
        </div>
    );
}

