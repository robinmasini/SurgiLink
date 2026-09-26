import { useState, useRef, useEffect } from 'react';
import { 
    Bot, 
    Send, 
    Sparkles, 
    RefreshCw, 
    Volume2, 
    VolumeX, 
    Mic, 
    MicOff, 
    ShieldCheck, 
    AlertTriangle, 
    ChevronDown, 
    ChevronUp,
    PhoneCall,
    MapPin,
    Clock,
    Droplets,
    Utensils
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PatientAIChat({ patient = {}, token = '' }) {
    const { t, i18n } = useTranslation();
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [speakingMsgId, setSpeakingMsgId] = useState(null);
    const messagesEndRef = useRef(null);

    // Patient Context variables
    const firstName = patient.name ? patient.name.split(' ')[0] : 'Cher patient';
    const operation = patient.operation || 'intervention chirurgicale';
    const clinicName = patient.clinic_name || 'Clinique de Vitrolles';
    const isPhenicia = clinicName.includes('Phenicia') || clinicName.includes('Phénicia');
    const clinicAddress = isPhenicia 
        ? "29 Rue Louis Astruc, 13005 Marseille" 
        : "La Tuilière II, Rue Bel air, 13127 Vitrolles";
    const clinicPhone = isPhenicia ? "04 91 92 12 92" : "04 91 15 90 19";
    const cabinetPhone = patient.practitioner_phone || "04 91 15 90 19";
    const practitionerName = patient.surgeon_name || "Dr Christophe DESOUCHES";
    const surgeryDate = patient.date || '';
    const surgeryTime = patient.surgery_time || 'Non-communiquée';

    // Initial welcome message
    useEffect(() => {
        const welcomeText = `Bonjour **${firstName}** ! 👋\n\nJe suis l'**Assistant IA SurgiLink** de l'équipe du **${practitionerName}**.\n\nJe suis là pour répondre 24h/24 et 7j/7 à toutes vos questions concernant votre **${operation}**, les consignes d'hygiène, le jeûne, ou le fonctionnement du cabinet et de la **${clinicName}**.`;
        
        setMessages([
            {
                id: 'welcome-1',
                sender: 'bot',
                text: welcomeText,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
        ]);
    }, [patient.id, firstName, operation, practitionerName, clinicName]);

    // Auto-scroll chat to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (!isCollapsed) {
            scrollToBottom();
        }
    }, [messages, isLoading, isCollapsed]);

    // Speech Recognition (Voice Input)
    const toggleSpeechRecognition = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert("La reconnaissance vocale n'est pas supportée par votre navigateur.");
            return;
        }

        if (isListening) {
            setIsListening(false);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = i18n.language === 'en' ? 'en-US' : (i18n.language === 'nl' ? 'nl-NL' : 'fr-FR');
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        setIsListening(true);

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInputValue(prev => prev ? `${prev} ${transcript}` : transcript);
            setIsListening(false);
        };

        recognition.onerror = () => {
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    // Text-To-Speech (Read Aloud)
    const speakMessage = (id, text) => {
        if (!('speechSynthesis' in window)) return;

        if (speakingMsgId === id) {
            window.speechSynthesis.cancel();
            setSpeakingMsgId(null);
            return;
        }

        window.speechSynthesis.cancel();
        // Remove markdown formatting symbols for speech
        const plainText = text.replace(/[*_#`]/g, '');
        const utterance = new SpeechSynthesisUtterance(plainText);
        utterance.lang = i18n.language === 'en' ? 'en-US' : (i18n.language === 'nl' ? 'nl-NL' : 'fr-FR');
        
        utterance.onend = () => setSpeakingMsgId(null);
        utterance.onerror = () => setSpeakingMsgId(null);

        setSpeakingMsgId(id);
        window.speechSynthesis.speak(utterance);
    };

    // Intelligent Local Fallback Engine (Medical & Logistics Knowledge Base)
    const generateSmartLocalResponse = (query) => {
        const q = query.toLowerCase().trim();

        // 1. Fasting / Jeûne / Manger / Boire
        if (q.includes('jeûn') || q.includes('manger') || q.includes('boire') || q.includes('repas') || q.includes('eau') || q.includes('café') || q.includes('fumer') || q.includes('cigaret')) {
            return `🍽️ **Consignes de Jeûne pour votre ${operation} :**\n\n- **Aliments solides et tabac :** Arrêt strict au moins **6 heures** avant l'heure de votre convocation.\n- **Boissons claires :** Vous pouvez boire de l'eau plate, un thé sans lait ou un café noir sans sucre jusqu'à **2 heures** avant votre arrivée.\n- **Important :** Pas d'alcool ni de chewing-gum la veille au soir et le jour même.`;
        }

        // 2. Shower / Douche / Hygiène / Bétadine / Savon
        if (q.includes('douch') || q.includes('savon') || q.includes('bétadine') || q.includes('betadine') || q.includes('cheveu') || q.includes('laver') || q.includes('vernis') || q.includes('bijou')) {
            return `🚿 **Consignes d'Hygiène Pré-opératoire :**\n\n- **Douche obligatoire :** Réalisez une douche complète avec shampooing la veille au soir, puis une seconde douche le matin même de l'intervention avec du savon doux ou antiseptique (bétadine si prescrit).\n- **Séchage :** Utilisez une serviette propre et enfilez des vêtements propres.\n- **Interdictions :** Pas de maquillage, pas de vernis à ongles (mains et pieds), pas de bijoux ni piercings, pas de crème ni déodorant.`;
        }

        // 3. Location / Address / Parking / Accès clinique
        if (q.includes('ou') || q.includes('où') || q.includes('adress') || q.includes('lieu') || q.includes('cliniqu') || q.includes('park') || q.includes('accès') || q.includes('venir')) {
            return `📍 **Accès à votre Établissement de Soins :**\n\n- **Nom :** ${clinicName}\n- **Adresse :** ${clinicAddress}\n- **Téléphone clinique :** ${clinicPhone}\n\nUn parking est disponible sur place pour vous accueillir. Pensez à prévoir un accompagnant pour votre retour à domicile si vous êtes en ambulatoire !`;
        }

        // 4. Surgery Time / Arrival Time / Heure
        if (q.includes('heur') || q.includes('quand') || q.includes('arriv') || q.includes('horaire') || q.includes('convocat')) {
            let timeInfo = surgeryTime !== 'Non-communiquée' ? `L'heure enregistrée pour votre venue est **${surgeryTime}**.` : `L'heure précise de convocation vous sera communiquée par la clinique l'après-midi de la veille (J-1).`;
            if (surgeryDate) {
                timeInfo += `\n- **Date de l'intervention :** ${surgeryDate}`;
            }
            return `⏰ **Horaire et Convocation :**\n\n${timeInfo}\n\nSi vous n'avez pas reçu l'heure la veille après 16h, vous pouvez joindre le cabinet au **${cabinetPhone}**.`;
        }

        // 5. Pain / Médicaments / Antalgiques / Ordonnance
        if (q.includes('douleur') || q.includes('mal') || q.includes('médicament') || q.includes('medicament') || q.includes('ordonnanc') || q.includes('comprim') || q.includes('cachet')) {
            return `💊 **Gestion de la Douleur et Médicaments :**\n\n- **Antalgiques :** Prenez systématiquement les antalgiques prescrits sur votre ordonnance à horaires réguliers, n'attendez pas que la douleur s'installe.\n- **Aspirine & Anti-inflammatoires :** Ne prenez PAS d'aspirine ou d'anti-inflammatoires sans l'accord préalable du chirurgien ou de l'anesthésiste.\n- **Glaçage :** Si préconisé pour votre intervention, vous pouvez appliquer une poche de glace (enrobée d'un linge) pendant 15 minutes.`;
        }

        // 6. Red Flags / Emergency / Saignement / Fièvre / Malaise
        if (q.includes('urgenc') || q.includes('saign') || q.includes('sang') || q.includes('fièvr') || q.includes('fievr') || q.includes('températ') || q.includes('essoufl') || q.includes('poitrin') || q.includes('mollet')) {
            return `🚨 **Signaux d'Alerte et Urgences :**\n\n- ⚠️ **En cas de douleur thoracique aiguë, grande difficulté à respirer ou malaise :** Appelez immédiatement le **15 (SAMU)** ou le **112**.\n- ⚠️ **En cas de fièvre (>38.5°C), de saignement abondant actif ou de douleur vive au mollet :** Contactez d'urgence le cabinet du ${practitionerName} au **${cabinetPhone}** ou la clinique au **${clinicPhone}**.`;
        }

        // 7. Doctor / Cabinet / Practitioner
        if (q.includes('docteur') || q.includes('chirurgien') || q.includes('desouches') || q.includes('cabinet') || q.includes('rendez-vous') || q.includes('secréta')) {
            return `🩺 **Coordonnées du Cabinet Médical :**\n\n- **Praticien :** ${practitionerName}\n- **Spécialité :** Chirurgie Plastique, Reconstructrice & Esthétique\n- **Téléphone du cabinet :** ${cabinetPhone}\n\nLe secrétariat est à votre écoute pour toute question médicale ou prise de rendez-vous.`;
        }

        // 8. Documents / What to bring / Affaires
        if (q.includes('apport') || q.includes('dossier') || q.includes('papie') || q.includes('document') || q.includes('valis') || q.includes('affaire')) {
            return `📋 **Que devez-vous apporter le jour J ?**\n\n1. Pièce d'identité originale & Carte Vitale\n2. Votre dossier médical (bilan sanguin, examens, ordonnances)\n3. Les vêtements de contention ou soutien-gorge médical s'ils vous ont été prescrits\n4. Des vêtements amples et des chaussures confortables faciles à enfiler.`;
        }

        // Default Smart Response
        return `Merci pour votre question concernant votre **${operation}** ! 😊\n\nPour préparer au mieux votre parcours :\n- Respectez bien le **jeûne** (pas d'aliments 6h avant) et la **douche d'hygiène** la veille et le matin.\n- N'oubliez pas vos papiers et votre dossier médical.\n- Si vous avez une inquiétude spécifique ou une demande urgente, n'hésitez pas à contacter le secrétariat du **${practitionerName}** au **${cabinetPhone}** ou la **${clinicName}** au **${clinicPhone}**.\n\nPuis-je vous renseigner sur un autre point (jeûne, douche, accès, douleur) ?`;
    };

    // Send Message Handler
    const handleSend = async (textToSend = null) => {
        const text = (textToSend || inputValue).trim();
        if (!text || isLoading) return;

        const userMsg = {
            id: `user-${Date.now()}`,
            sender: 'user',
            text: text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);

        try {
            // Attempt 1: Serverless backend endpoint /api/patient-ai-chat
            const backendRes = await fetch('/api/patient-ai-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    patient: patient,
                    history: messages.slice(-6)
                })
            });

            if (backendRes.ok) {
                const data = await backendRes.json();
                if (data.success && data.answer) {
                    addBotMessage(data.answer);
                    setIsLoading(false);
                    return;
                }
            }

            // Attempt 2: Direct Client Gemini API call if key is available in environment
            const clientApiKey = localStorage.getItem('SL_GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY;
            
            if (clientApiKey) {
                const prompt = `Tu es l'assistant médical virtuel intelligent SurgiLink du ${practitionerName} (${clinicName}).
Patient: ${firstName}, Intervention: ${operation}, Date: ${surgeryDate}, Convocation: ${surgeryTime}.
Accès clinique: ${clinicAddress} (Tel: ${clinicPhone}). Tel cabinet: ${cabinetPhone}.

Consignes médicales : Jeûne strict 6h avant (aliments solides/tabac), liquides clairs jusqu'à 2h avant. Douche antiseptique la veille et le matin. Pas d'aspirine 10j avant. En cas d'urgence vitale (douleur thoracique/essoufflement), appeler 15/112.

Question du patient : ${text}`;

                const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${clientApiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { maxOutputTokens: 800, temperature: 0.3 }
                    })
                });

                if (geminiRes.ok) {
                    const gData = await geminiRes.json();
                    const aiAnswer = gData.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (aiAnswer) {
                        addBotMessage(aiAnswer);
                        setIsLoading(false);
                        return;
                    }
                }
            }

            // Attempt 3: Intelligent Local Medical Engine Fallback
            const localAnswer = generateSmartLocalResponse(text);
            setTimeout(() => {
                addBotMessage(localAnswer);
                setIsLoading(false);
            }, 500);

        } catch (err) {
            console.warn('AI Chat API warning, fallback used:', err);
            const fallbackAnswer = generateSmartLocalResponse(text);
            addBotMessage(fallbackAnswer);
            setIsLoading(false);
        }
    };

    const addBotMessage = (text) => {
        setMessages(prev => [
            ...prev,
            {
                id: `bot-${Date.now()}`,
                sender: 'bot',
                text: text,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
        ]);
    };

    const handleResetChat = () => {
        setMessages([
            {
                id: `welcome-${Date.now()}`,
                sender: 'bot',
                text: `Discussion réinitialisée ! Bonjour **${firstName}**, comment puis-je vous aider concernant votre **${operation}** ?`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
        ]);
    };

    // Format Markdown rendering helper
    const renderFormattedText = (content) => {
        const lines = content.split('\n');
        return lines.map((line, idx) => {
            // Bold formatting replacement
            let formattedLine = line;
            const parts = [];
            const regex = /\*\*(.*?)\*\*/g;
            let lastIndex = 0;
            let match;

            while ((match = regex.exec(line)) !== null) {
                if (match.index > lastIndex) {
                    parts.push(line.substring(lastIndex, match.index));
                }
                parts.push(<strong key={`bold-${idx}-${match.index}`} style={{ fontWeight: 700, color: '#1f2937' }}>{match[1]}</strong>);
                lastIndex = regex.lastIndex;
            }
            if (lastIndex < line.length) {
                parts.push(line.substring(lastIndex));
            }

            const elementContent = parts.length > 0 ? parts : formattedLine;

            if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                return (
                    <li key={`line-${idx}`} style={{ marginBottom: '6px', marginLeft: '16px' }}>
                        {elementContent.slice ? elementContent : String(elementContent).substring(2)}
                    </li>
                );
            }

            if (line.trim() === '') {
                return <div key={`empty-${idx}`} style={{ height: '8px' }} />;
            }

            return (
                <p key={`line-${idx}`} style={{ margin: '0 0 6px 0', lineHeight: '1.5' }}>
                    {elementContent}
                </p>
            );
        });
    };

    // Quick suggestion pills
    const suggestionPills = [
        { label: "Consignes de douche", icon: <Droplets size={13} color="#0EA5E9" />, query: "Quelles sont les consignes pour la douche la veille et le matin ?" },
        { label: "Règles de jeûne", icon: <Utensils size={13} color="#F59E0B" />, query: "À quelle heure dois-je être à jeun pour manger et boire ?" },
        { label: "Accès & parking", icon: <MapPin size={13} color="#10B981" />, query: "Où se trouve la clinique et comment s'y rendre ?" },
        { label: "Gérer la douleur", icon: <ShieldCheck size={13} color="#8B5CF6" />, query: "Que faire en cas de douleur après l'intervention ?" },
        { label: "Signaux d'alerte", icon: <AlertTriangle size={13} color="#EF4444" />, query: "Quels sont les signaux d'alerte ou symptômes urgents ?" }
    ];

    return (
        <div style={{
            width: '100%',
            marginBottom: '24px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(245, 243, 255, 0.95))',
            border: '1.5px solid rgba(139, 92, 246, 0.25)',
            boxShadow: '0 12px 32px rgba(139, 92, 246, 0.08)',
            overflow: 'hidden',
            transition: 'all 0.3s ease'
        }}>
            {/* Header */}
            <div 
                onClick={() => setIsCollapsed(!isCollapsed)}
                style={{
                    padding: '16px 20px',
                    background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    userSelect: 'none'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                    }}>
                        <Sparkles size={20} color="#ffffff" />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', letterSpacing: '-0.01em', color: 'white' }}>
                                Assistant IA SurgiLink
                            </h3>
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'rgba(16, 185, 129, 0.25)',
                                color: '#A7F3D0',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '10px',
                                fontWeight: '700',
                                textTransform: 'uppercase'
                            }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34D399', animation: 'pulse 1.5s infinite' }} />
                                En ligne 24/7
                            </span>
                        </div>
                        <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'rgba(255, 255, 255, 0.85)', fontWeight: '400' }}>
                            Posez vos questions sur votre séjour & intervention
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleResetChat(); }}
                        title="Réinitialiser la conversation"
                        style={{
                            background: 'rgba(255, 255, 255, 0.15)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <RefreshCw size={14} />
                    </button>

                    <div style={{
                        background: 'rgba(255, 255, 255, 0.15)',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                    }}>
                        {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                    </div>
                </div>
            </div>

            {!isCollapsed && (
                <>
                    {/* Suggestion Chips */}
                    <div style={{
                        padding: '12px 16px 8px 16px',
                        display: 'flex',
                        gap: '8px',
                        overflowX: 'auto',
                        borderBottom: '1px solid rgba(0,0,0,0.04)',
                        WebkitOverflowScrolling: 'touch',
                        scrollbarWidth: 'none'
                    }}>
                        {suggestionPills.map((pill, idx) => (
                            <button
                                key={`pill-${idx}`}
                                onClick={() => handleSend(pill.query)}
                                style={{
                                    whiteSpace: 'nowrap',
                                    padding: '6px 12px',
                                    borderRadius: '16px',
                                    background: '#F3F4F6',
                                    border: '1px solid #E5E7EB',
                                    color: '#4B5563',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s ease',
                                    flexShrink: 0
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = '#EDE9FE';
                                    e.currentTarget.style.color = '#6366F1';
                                    e.currentTarget.style.borderColor = '#C4B5FD';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = '#F3F4F6';
                                    e.currentTarget.style.color = '#4B5563';
                                    e.currentTarget.style.borderColor = '#E5E7EB';
                                }}
                            >
                                {pill.icon}
                                <span>{pill.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Chat Messages Area */}
                    <div style={{
                        padding: '16px',
                        maxHeight: '340px',
                        minHeight: '180px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px',
                        background: '#FAFAFA'
                    }}>
                        {messages.map((msg) => {
                            const isUser = msg.sender === 'user';
                            return (
                                <div 
                                    key={msg.id}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: isUser ? 'flex-end' : 'flex-start',
                                        maxWidth: '100%'
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        gap: '8px',
                                        alignItems: 'flex-start',
                                        flexDirection: isUser ? 'row-reverse' : 'row',
                                        maxWidth: '90%'
                                    }}>
                                        {!isUser && (
                                            <div style={{
                                                width: '28px',
                                                height: '28px',
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                flexShrink: 0,
                                                marginTop: '2px',
                                                boxShadow: '0 2px 6px rgba(99, 102, 241, 0.3)'
                                            }}>
                                                <Bot size={16} />
                                            </div>
                                        )}

                                        <div style={{
                                            padding: '12px 16px',
                                            borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                            background: isUser 
                                                ? 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)' 
                                                : '#FFFFFF',
                                            color: isUser ? '#FFFFFF' : '#374151',
                                            boxShadow: isUser 
                                                ? '0 4px 12px rgba(99, 102, 241, 0.25)' 
                                                : '0 2px 8px rgba(0, 0, 0, 0.04)',
                                            border: isUser ? 'none' : '1px solid #E5E7EB',
                                            fontSize: '13.5px',
                                            position: 'relative'
                                        }}>
                                            {isUser ? (
                                                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                                                    {msg.text}
                                                </div>
                                            ) : (
                                                <div>
                                                    {renderFormattedText(msg.text)}
                                                    
                                                    {/* Text To Speech Speaker Button */}
                                                    <button
                                                        onClick={() => speakMessage(msg.id, msg.text)}
                                                        title="Écouter la réponse"
                                                        style={{
                                                            marginTop: '6px',
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: speakingMsgId === msg.id ? '#6366F1' : '#9CA3AF',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            fontSize: '11px',
                                                            fontWeight: '600',
                                                            padding: 0
                                                        }}
                                                    >
                                                        {speakingMsgId === msg.id ? <VolumeX size={13} /> : <Volume2 size={13} />}
                                                        <span>{speakingMsgId === msg.id ? "Arrêter" : "Écouter"}</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <span style={{
                                        fontSize: '10px',
                                        color: '#9CA3AF',
                                        marginTop: '4px',
                                        padding: '0 4px'
                                    }}>
                                        {msg.timestamp}
                                    </span>
                                </div>
                            );
                        })}

                        {isLoading && (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <div style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white'
                                }}>
                                    <Bot size={16} />
                                </div>
                                <div style={{
                                    padding: '12px 18px',
                                    borderRadius: '20px 20px 20px 4px',
                                    background: '#FFFFFF',
                                    border: '1px solid #E5E7EB',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    color: '#6B7280',
                                    fontSize: '12px',
                                    fontWeight: '500'
                                }}>
                                    <span className="animate-pulse">L'Assistant rédige une réponse...</span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Bar */}
                    <div style={{
                        padding: '12px 16px',
                        background: '#FFFFFF',
                        borderTop: '1px solid #E5E7EB',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        {/* Voice Input Button */}
                        <button
                            onClick={toggleSpeechRecognition}
                            title={isListening ? "Écoute en cours..." : "Dicter votre question"}
                            style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                border: '1px solid #E5E7EB',
                                background: isListening ? '#FEE2E2' : '#F9FAFB',
                                color: isListening ? '#EF4444' : '#6B7280',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                flexShrink: 0
                            }}
                        >
                            {isListening ? <MicOff size={18} className="animate-pulse" /> : <Mic size={18} />}
                        </button>

                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSend();
                                }
                            }}
                            placeholder="Posez votre question ici..."
                            disabled={isLoading}
                            style={{
                                flex: 1,
                                padding: '10px 16px',
                                borderRadius: '20px',
                                border: '1px solid #D1D5DB',
                                background: '#F9FAFB',
                                fontSize: '13.5px',
                                color: '#1F2937',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#6366F1'}
                            onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                        />

                        <button
                            onClick={() => handleSend()}
                            disabled={!inputValue.trim() || isLoading}
                            style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                border: 'none',
                                background: inputValue.trim() && !isLoading 
                                    ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' 
                                    : '#E5E7EB',
                                color: inputValue.trim() && !isLoading ? '#FFFFFF' : '#9CA3AF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: inputValue.trim() && !isLoading ? 'pointer' : 'default',
                                boxShadow: inputValue.trim() && !isLoading ? '0 4px 10px rgba(99, 102, 241, 0.3)' : 'none',
                                transition: 'all 0.2s',
                                flexShrink: 0
                            }}
                        >
                            <Send size={16} />
                        </button>
                    </div>

                    {/* Subtext Footer */}
                    <div style={{
                        padding: '6px 16px 10px 16px',
                        background: '#FFFFFF',
                        fontSize: '10.5px',
                        color: '#9CA3AF',
                        textAlign: 'center',
                        borderTop: '1px stroke #F3F4F6'
                    }}>
                        💡 <em>L'assistant IA donne des informations à titre indicatif. En cas d'urgence, appelez le 15.</em>
                    </div>
                </>
            )}
        </div>
    );
}
