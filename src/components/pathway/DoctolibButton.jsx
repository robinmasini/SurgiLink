import { ExternalLink } from 'lucide-react';
import doctolibLogo from '../../assets/doctolib-logo.jpg';

export default function DoctolibButton() {
    return (
        <a
            href="https://www.doctolib.fr/chirurgien-plastique/marseille/christophe-desouches"
            target="_blank"
            rel="noopener noreferrer"
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                background: '#0596DE',
                color: 'white',
                padding: '16px 24px',
                borderRadius: '16px',
                textDecoration: 'none',
                fontWeight: '700',
                fontSize: '16px',
                marginTop: '32px',
                marginBottom: '16px',
                boxShadow: '0 4px 12px rgba(5, 150, 222, 0.3)',
                transition: 'all 0.2s ease',
                border: 'none',
                width: '100%'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(5, 150, 222, 0.4)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(5, 150, 222, 0.3)';
            }}
        >
            <img
                src={doctolibLogo}
                alt="Doctolib"
                style={{
                    height: '24px',
                    borderRadius: '4px',
                }}
            />
            <span>Prendre rendez-vous sur Doctolib</span>
            <ExternalLink size={18} />
        </a>
    );
}
