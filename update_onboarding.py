import re

file_path = '/Users/robinmasini/Desktop/SurgiLink/src/pages/OnboardingFlow.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add wppDesktop import
content = content.replace(
    "import wppPhone from '../assets/wpp-phone.png';",
    "import wppPhone from '../assets/wpp-phone.png';\nimport wppDesktop from '../assets/wpp-desktop.png';"
)

# 2. Add isMobile state
content = content.replace(
    "const [error, setError] = useState(null);",
    "const [error, setError] = useState(null);\n    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);\n\n    useEffect(() => {\n        const handleResize = () => setIsMobile(window.innerWidth < 768);\n        window.addEventListener('resize', handleResize);\n        return () => window.removeEventListener('resize', handleResize);\n    }, []);"
)

# 3. Update loading and error backgrounds
content = content.replace(
    "style={{ background: `url(${wppPhone}) center/cover fixed` }}",
    "style={{ background: `url(${isMobile ? wppPhone : wppDesktop}) center/cover fixed` }}"
)

# 4. Update main background
content = content.replace(
    "backgroundImage: `url(${wppPhone})`,",
    "backgroundImage: `url(${isMobile ? wppPhone : wppDesktop})`,"
).replace(
    "zIndex: -1,\n                    scale: 1.2",
    "zIndex: -1"
)

# 5. Remove overlay
overlay_block = """            <div className="onboarding-overlay" style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(10, 15, 30, 0.4)',
                backdropFilter: 'blur(5px)',
                zIndex: 0
            }} />"""
content = content.replace(overlay_block, "")

# 6. Step 1 texts
content = content.replace(
    """                            <h1 className="onboarding-title" style={{ 
                                fontSize: '2.2rem', 
                                fontWeight: '700', 
                                marginBottom: '12px', 
                                lineHeight: '1.1' 
                            }}>""",
    """                            <h1 className="onboarding-title" style={{ 
                                fontSize: '2.2rem', 
                                fontWeight: '700', 
                                marginBottom: '12px', 
                                lineHeight: '1.1',
                                color: '#1f2937'
                            }}>"""
).replace(
    """                            <p className="onboarding-subtitle" style={{ 
                                fontSize: '1.2rem', 
                                fontWeight: '500'
                            }}>""",
    """                            <p className="onboarding-subtitle" style={{ 
                                fontSize: '1.2rem', 
                                fontWeight: '500',
                                color: '#6b7280'
                            }}>"""
)

# 7. Step 2 text colors
content = content.replace(
    """<div className="onboarding-info-container" style={{ color: 'white', flex: 1 }}>""",
    """<div className="onboarding-info-container" style={{ color: '#4b5563', flex: 1 }}>"""
).replace(
    """<h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: 'var(--spacing-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>""",
    """<h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: 'var(--spacing-4)', display: 'flex', alignItems: 'center', gap: '8px', color: '#1f2937' }}>"""
)

# 8. Step 2 Badge
content = content.replace(
    """                            <div className="info-badge" style={{ 
                                background: 'rgba(255, 255, 255, 0.1)', 
                                padding: '10px 20px', 
                                borderRadius: '15px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '12px',
                                marginBottom: 'var(--spacing-4)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                backdropFilter: 'blur(10px)'
                            }}>
                                <img src={smsImg} alt="SMS" style={{ height: '32px', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.2))' }} />
                                <span style={{ fontWeight: '600' }}>Suivi SMS : Questionnaires</span>
                            </div>""",
    """                            <div className="info-badge" style={{ 
                                background: '#f9fafb', 
                                padding: '10px 20px', 
                                borderRadius: '15px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '12px',
                                marginBottom: 'var(--spacing-4)',
                                border: '1px solid #e5e7eb',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                            }}>
                                <img src={smsImg} alt="SMS" style={{ height: '32px' }} />
                                <span style={{ fontWeight: '600', color: '#374151' }}>Suivi SMS : Questionnaires</span>
                            </div>"""
)

# 9. Step 2 Timeline
content = content.replace(
    """                                <div className="timeline-line" style={{ 
                                    position: 'absolute', 
                                    top: '30px', 
                                    left: '0', 
                                    right: '0', 
                                    height: '2px', 
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    zIndex: 0
                                }} />""",
    """                                <div className="timeline-line" style={{ 
                                    position: 'absolute', 
                                    top: '30px', 
                                    left: '0', 
                                    right: '0', 
                                    height: '2px', 
                                    background: '#e5e7eb',
                                    zIndex: 0
                                }} />"""
).replace(
    """                                        <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ 
                                                width: '24px', 
                                                height: '24px', 
                                                borderRadius: '50%', 
                                                background: 'rgba(255, 255, 255, 0.2)',
                                                border: '1px solid rgba(255, 255, 255, 0.4)'
                                            }} />
                                            <span style={{ fontSize: '0.75rem', fontWeight: '600', opacity: 0.8 }}>{day}</span>
                                        </div>""",
    """                                        <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ 
                                                width: '24px', 
                                                height: '24px', 
                                                borderRadius: '50%', 
                                                background: '#ffffff',
                                                border: '2px solid #e5e7eb'
                                            }} />
                                            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>{day}</span>
                                        </div>"""
)

# 10. Remove white text overrides
content = content.replace(
    """                .onboarding-title, .onboarding-info-container h2 { 
                    color: #FFFFFF !important; 
                    font-family: var(--font-family) !important; 
                    text-shadow: 0 2px 10px rgba(0,0,0,0.2) !important;
                }
                .onboarding-subtitle, .onboarding-info-container p, .onboarding-info-container span { 
                    color: #FFFFFF !important; 
                    opacity: 1 !important; 
                    font-family: var(--font-family) !important;
                    text-shadow: 0 1px 5px rgba(0,0,0,0.2) !important;
                }""",
    """                .onboarding-title, .onboarding-info-container h2, .onboarding-subtitle, .onboarding-info-container p, .onboarding-info-container span { 
                    font-family: var(--font-family) !important; 
                }"""
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Update complete.")
