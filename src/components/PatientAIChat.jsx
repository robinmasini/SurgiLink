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
    Car,
    MapPin,
    Clock,
    Droplets,
    Utensils,
    Syringe
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
    const operation = patient.operation || 'intervention';
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

    // Procedure type detection
    const opLower = operation.toLowerCase();
    const isBotox = opLower.includes('botox') || opLower.includes('injection') || opLower.includes('acide hyaluronique') || opLower.includes('peeling') || opLower.includes('consultation');

    // Initial welcome message
    useEffect(() => {
        const welcomeText = `Bonjour **${firstName}** ! 👋\n\nJe suis l'**Assistant IA SurgiLink** du **${practitionerName}**.\n\nJe suis à votre disposition 24h/24 et 7j/7 pour répondre à toutes vos questions concernant votre **${operation}**, le transport, le déroulement du soin ou l'accès à la **${clinicName}**.`;
        
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

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

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
        const plainText = text.replace(/[*_#`]/g, '');
        const utterance = new SpeechSynthesisUtterance(plainText);
        utterance.lang = i18n.language === 'en' ? 'en-US' : (i18n.language === 'nl' ? 'nl-NL' : 'fr-FR');
        
        utterance.onend = () => setSpeakingMsgId(null);
        utterance.onerror = () => setSpeakingMsgId(null);

        setSpeakingMsgId(id);
        window.speechSynthesis.speak(utterance);
    };

    // HYPER-INTELLIGENT Procedure-Aware Local NLP Engine
    const generateSmartLocalResponse = (query) => {
        const q = query.toLowerCase().trim();

        // 1. TRANSPORT & ACCOMPANIMENT & DRIVING ("je peux pas me faire emmener", "comment venir", "seul", "rentrer", "voiture", "taxi")
        if (q.includes('emmener') || q.includes('remener') || q.includes('ramener') || q.includes('conduire') || q.includes('voiture') || q.includes('seul') || q.includes('seule') || q.includes('accompagn') || q.includes('chauffeur') || q.includes('taxi') || q.includes('vsl') || q.includes('ambulance') || q.includes('uber') || q.includes('vtc') || q.includes('bus') || q.includes('transport') || q.includes('vehicule') || q.includes('véhicule') || q.includes('rentrer')) {
            if (isBotox) {
                return `🚗 **Solutions de Transport pour vos injections de ${operation} :**\n\nPour des injections de Botox ou un soin de médecine esthétique en cabinet, **aucun accompagnant n'est obligatoire**.\n\n- Vous pouvez venir et repartir **par vos propres moyens** : en voiture personnelle, en transports en commun, à pied ou en VTC.\n- **Conduite :** Vous êtes tout à fait autorisé(e) à conduire votre véhicule immédiatement après la séance.`;
            } else {
                return `🚗 **Solutions de Transport pour votre ${operation} :**\n\nPour une chirurgie ambulatoire sous anesthésie, **la présence d'un accompagnant majeur est obligatoire** pour votre sortie de la clinique et votre sécurité à domicile.\n\n**Si vous n'avez pas de proche disponible pour vous emmener ou vous raccompagner :**\n\n1. 🚕 **Taxi conventionné ou VSL (Transport Sanitaire Léger) :** Le ${practitionerName} peut vous établir une prescription médicale de transport si votre état de santé le justifie.\n2. 🏥 **Hospitalisation de nuit :** Si aucun accompagnant n'est possible à votre retour, contactez rapidement le secrétariat au **${cabinetPhone}** afin d'organiser une nuit de repos surveillée à la clinique.\n3. ⚠️ **Rappel important :** Il est strictement interdit de conduire votre véhicule le jour d'une anesthésie.`;
            }
        }

        // 2. BOTOX & INJECTIONS SPECIFIC
        if (q.includes('botox') || q.includes('injection') || q.includes('ride') || q.includes('acide') || q.includes('hyaluronique') || q.includes('massag') || q.includes('allong')) {
            return `💉 **Consignes Spécifiques pour vos Injections de Botox :**\n\n- **Avant la séance :** Aucun jeûne nécessaire. Évitez de prendre de l'aspirine ou des anti-inflammatoires 48h avant.\n- **Après l'injection :**\n  1. **Ne pas frotter ni masser** les zones injectées pendant 4 heures.\n  2. **Ne pas vous allonger** ni pencher la tête en bas pendant 4 heures.\n  3. **Éviter le sport intense, le sauna et le hammam** pendant 24 heures.\n- **Résultats :** L'effet s'installe progressivement sous 3 à 5 jours.`;
        }

        // 3. TABAC / CIGARETTE / VAPOTAGE
        if (q.includes('fumer') || q.includes('tabac') || q.includes('cigaret') || q.includes('vapot') || q.includes('nicotin')) {
            return `🚭 **Recommandations concernant le Tabac pour votre ${operation} :**\n\n- **Conseil médical :** Il est **vivement recommandé d'arrêter ou de réduire le tabac** avant votre intervention pour optimiser la qualité de la cicatrisation et réduire les risques anesthésiques et infectieux.\n- **Consignes de consultation :** Veuillez vous référer aux consignes exactes données lors de votre consultation d'anesthésie et avec le ${practitionerName}.\n- N'hésitez pas à contacter le secrétariat médical au **${cabinetPhone}** pour toute précision.`;
        }

        // 4. FASTING / JEÛNE / MANGER / BOIRE
        if (q.includes('jeûn') || q.includes('manger') || q.includes('boire') || q.includes('repas') || q.includes('eau') || q.includes('café')) {
            if (isBotox) {
                return `🍽️ **Consignes Alimentaires pour vos injections de ${operation} :**\n\n**Aucun jeûne n'est nécessaire !** Vous pouvez manger et boire normalement avant et après votre séance de Botox.`;
            } else {
                return `🍽️ **Consignes de Jeûne pour votre ${operation} :**\n\n- **Aliments solides :** Arrêt strict au moins **6 heures** avant votre heure de convocation.\n- **Boissons claires :** Vous pouvez boire de l'eau plate ou du thé/café noir sans lait ni sucre jusqu'à **2 heures** avant.\n- Pas de chewing-gum ni de bonbon.`;
            }
        }

        // 4. SHOWER / HYGIÈNE / BÉTADINE
        if (q.includes('douch') || q.includes('savon') || q.includes('bétadine') || q.includes('betadine') || q.includes('cheveu') || q.includes('laver') || q.includes('vernis') || q.includes('bijou')) {
            if (isBotox) {
                return `🚿 **Consignes d'Hygiène pour votre séance de ${operation} :**\n\nUne douche quotidienne classique suffit. Aucun savon antiseptique spécial n'est requis. Évitez simplement d'appliquer du maquillage épais sur les zones à injecter le jour même.`;
            } else {
                return `🚿 **Consignes de Douche Pré-opératoire :**\n\n- Douche complète avec shampoing la veille au soir, puis seconde douche le matin même avec du savon antiseptique (ou savon doux).\n- Séchage serviette propre, vêtements propres.\n- Pas de maquillage, vernis à ongles, bijoux ni crèmes.`;
            }
        }

        // 5. PAIN / MEDICATION / DOLIPRANE / ASPIRINE
        if (q.includes('douleur') || q.includes('mal') || q.includes('médicament') || q.includes('medicament') || q.includes('ordonnanc') || q.includes('doliprane') || q.includes('paracétamol') || q.includes('aspirin')) {
            return `💊 **Gestion de la Douleur & Médicaments :**\n\n- **Antalgiques :** Prenez la prescription médicale fournie par le ${practitionerName} à horaires réguliers sans attendre que la douleur s'installe.\n- **Aspirine :** Évitez l'aspirine et les anti-inflammatoires (sauf accord médical) car ils favorisent les saignements et hématomes.`;
        }

        // 6. RED FLAGS & URGENCES
        if (q.includes('urgenc') || q.includes('saign') || q.includes('sang') || q.includes('fièvr') || q.includes('fievr') || q.includes('températ') || q.includes('essoufl') || q.includes('poitrin') || q.includes('mollet')) {
            return `🚨 **Signaux d'Alerte et Urgences :**\n\n- ⚠️ **En cas de malaise, douleur thoracique ou essoufflement important :** Appelez immédiatement le **15 (SAMU)** ou le **112**.\n- ⚠️ **En cas de fièvre (>38,5°C), saignement abondant actif ou douleur vive d'un mollet :** Contactez d'urgence le secrétariat au **${cabinetPhone}** ou la clinique au **${clinicPhone}**.`;
        }

        // 7. QUESTIONNAIRE / DÉROULEMENT DU SUIVI
        if (q.includes('questionnaire') || q.includes('déroul') || q.includes('deroul') || q.includes('étape') || q.includes('etape') || q.includes('formulaire')) {
            return `📋 **Déroulement des Questionnaires et de votre Suivi SurgiLink :**\n\n1. **Questionnaires pré et post-opératoires :** Vous recevez automatiquement des questionnaires courts par SMS / E-mail aux étapes clés de votre séjour (J-7, J-1, J+1, J+7, etc.).\n2. **Prise en charge :** Vos réponses permettent à l'équipe du ${practitionerName} de contrôler votre rétablissement et de réagir immédiatement en cas de besoin.\n3. **Assistance :** Vous pouvez remplir vos formulaires depuis le portail ou me poser directement vos questions ici.`;
        }

        // 8. CLINIC LOCATION & ADDRESS
        if (/\b(où|ou se|adresse|lieu|accès|situé|parking)\b/i.test(q) || q.includes('cliniqu')) {
            return `📍 **Localisation de votre Établissement :**\n\n- **Nom :** ${clinicName}\n- **Adresse :** ${clinicAddress}\n- **Téléphone clinique :** ${clinicPhone}\n\nUn parking est à votre disposition sur place.`;
        }

        // 9. APPOINTMENT TIME / SURGERY DATE
        if (q.includes('heur') || q.includes('quand') || q.includes('arriv') || q.includes('horaire') || q.includes('convocat') || q.includes('date')) {
            let timeInfo = surgeryTime !== 'Non-communiquée' ? `L'heure prévue pour votre arrivée est **${surgeryTime}**.` : `L'heure de convocation exacte vous est transmise la veille (J-1) dans l'après-midi.`;
            if (surgeryDate) timeInfo += `\n- **Date :** ${surgeryDate}`;
            return `⏰ **Date et Horaires :**\n\n${timeInfo}\n\nSi vous avez besoin de modifier un créneau, contactez le cabinet au **${cabinetPhone}**.`;
        }

        // 10. DOCUMENTS TO BRING
        if (q.includes('apport') || q.includes('dossier') || q.includes('papie') || q.includes('document') || q.includes('valis') || q.includes('affaire')) {
            return `📋 **Documents à prévoir :**\n\n1. Pièce d'identité originale & Carte Vitale\n2. Dossier médical (ordonnance, examens, bilan sanguin)\n3. Vêtements amples et confortables faciles à enfiler.`;
        }

        // 10. INTELLIGENT GENERAL FALLBACK (Customized directly for user query)
        return `Concernant votre demande sur votre **${operation}** : 😊\n\nPour toute question d'organisation, de transport ou de consigne médicale spécifique, l'équipe du **${practitionerName}** est à votre écoute au **${cabinetPhone}**.\n\nVous pouvez également consulter les sections **Consignes de douche**, **Accès & parking** ou **Transport** ci-dessus.`;
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
            // Call secure server backend endpoint /api/patient-ai-chat
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

            // Fallback: Intelligent Local Medical Engine (Offline mode)
            const localAnswer = generateSmartLocalResponse(text);
            setTimeout(() => {
                addBotMessage(localAnswer);
                setIsLoading(false);
            }, 400);

        } catch (err) {
            console.warn('AI Chat API warning, local fallback used:', err);
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

    // Quick suggestion pills - adapted by procedure type
    const suggestionPills = [
        { label: "M'emmener / Transport", icon: <Car size={13} color="#6366F1" />, query: "Je ne peux pas me faire emmener, comment faire ?" },
        { label: isBotox ? "Consignes Botox" : "Consignes de douche", icon: isBotox ? <Syringe size={13} color="#EC4899" /> : <Droplets size={13} color="#0EA5E9" />, query: isBotox ? "Quelles sont les consignes après mes injections de Botox ?" : "Quelles sont les consignes pour la douche la veille et le matin ?" },
        { label: "Règles de jeûne", icon: <Utensils size={13} color="#F59E0B" />, query: "Dois-je être à jeun pour mon intervention ?" },
        { label: "Accès & parking", icon: <MapPin size={13} color="#10B981" />, query: "Où se trouve la clinique et comment s'y rendre ?" },
        { label: "Gérer la douleur", icon: <ShieldCheck size={13} color="#8B5CF6" />, query: "Que faire en cas de douleur après l'intervention ?" }
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
                            Posez vos questions sur votre séjour, transport & soin
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
