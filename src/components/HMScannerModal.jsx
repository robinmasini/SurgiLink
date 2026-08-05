import { useState, useEffect } from 'react';
import { 
    X, 
    UploadCloud, 
    Loader2, 
    Sparkles, 
    Settings, 
    Check, 
    ArrowRight,
    User,
    Calendar,
    Phone,
    Mail,
    MapPin,
    AlertCircle,
    Info
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { scheduleTimeBasedReminders } from '../services/reminderService';
import { generatePatientToken } from '../services/tokenService';
import PhoneInput from './PhoneInput';
import hmIcon from '../assets/hm-icon.png';
import doctolibLogo from '../assets/doctolib-bleu.png';

export default function HMScannerModal({ isOpen, onClose, onSuccess }) {
    const [scannerCategory, setScannerCategory] = useState('HM'); // 'HM' or 'Doctolib'
    const [apiKey, setApiKey] = useState(localStorage.getItem('SL_GEMINI_API_KEY') || '');
    const [showSettings, setShowSettings] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [extractedData, setExtractedData] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form fields for editing/reviewing extracted data
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        birthDate: '',
        operation: '',
        surgeonName: 'Christophe DESOUCHES',
        stayType: 'Hospitalisation',
        date: '',
        surgeryTime: 'Non-communiquée',
        phone: '+33 ',
        email: '',
        clinicName: 'Clinique de Vitrolles',
        ipp: '',
        stayNumber: '',
        address: '',
        weight: '',
        height: '',
        referringDoctor: '',
        referringDoctorPhone: '',
        entryMode: '8 - Domicile',
        exitMode: '8 - Retour domicile',
        admissionDatetime: '',
        dischargeDatetime: '',
        roomNumber: ''
    });

    useEffect(() => {
        if (!isOpen) {
            // Reset state on close
            setSelectedFile(null);
            setPreviewUrl(null);
            setExtractedData(null);
            setIsScanning(false);
            setScanProgress(0);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSaveApiKey = (e) => {
        e.preventDefault();
        localStorage.setItem('SL_GEMINI_API_KEY', apiKey);
        setShowSettings(false);
        alert('Clé API Gemini enregistrée localement !');
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            processFile(file);
        }
    };

    const processFile = (file) => {
        if (!file.type.startsWith('image/')) {
            alert('Veuillez sélectionner un fichier image (PNG, JPG, JPEG).');
            return;
        }
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const triggerScan = async () => {
        if (!previewUrl) return;

        setIsScanning(true);
        setScanProgress(10);

        // Progress simulation for user excitement
        const interval = setInterval(() => {
            setScanProgress(prev => {
                if (prev >= 90) {
                    clearInterval(interval);
                    return 90;
                }
                return prev + 15;
            });
        }, 300);

        try {
            // Check if we have a real API key in localstorage or environment
            const activeApiKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY;

            if (activeApiKey) {
                // Real Gemini API Call
                const base64Content = previewUrl.split(',')[1];
                const mimeType = selectedFile.type;

                const prompt = scannerCategory === 'Doctolib'
                    ? `Tu es un extracteur de données médicales à partir de captures d'écran de l'interface Doctolib Pro (fiche patient ou RDV du planning).
Analyse l'image et extrait les informations suivantes sous forme de JSON structuré. Ne retourne AUCUN blabla, uniquement du JSON valide.
Les clés doivent être exactement :
{
  "name": "Nom complet (ex: Jean DUPONT)",
  "first_name": "Prénom (ex: Jean)",
  "last_name": "Nom de famille (ex: DUPONT)",
  "birth_date": "Date de naissance au format YYYY-MM-DD si présente (ex: 1985-04-12)",
  "phone": "Numéro de téléphone portable (ex: +33612345678)",
  "email": "Adresse email (ex: jean.dupont@gmail.com)",
  "operation": "Motif de consultation / intervention (ex: Consultation Chirurgie Plastique)",
  "surgeon_name": "Nom du chirurgien (ex: Christophe DESOUCHES)",
  "admission_datetime": "Date et heure du rendez-vous au format ISO ou YYYY-MM-DD HH:MM",
  "stay_type": "Consultation ou Ambulatoire",
  "clinic_name": "Nom du cabinet ou clinique",
  "address": "Adresse du patient si présente"
}`
                    : `Tu es un extracteur de données médicales à partir de captures d'écran du logiciel Hopital Manager.
Analyse l'image et extrait les informations suivantes sous forme de JSON structuré. Ne retourne AUCUN blabla, uniquement du JSON valide.
Les clés doivent être exactement :
{
  "name": "Nom complet (ex: RIPERT Amanda)",
  "first_name": "Prénom (ex: Amanda)",
  "last_name": "Nom de famille (ex: RIPERT)",
  "birth_date": "Date de naissance au format YYYY-MM-DD (ex: 1987-01-06)",
  "phone": "Numéro de téléphone portable format international ou local (ex: +33619651961)",
  "email": "Adresse email (ex: amanda.ripert@hotmail.fr)",
  "operation": "Motif d'hospitalisation / Intervention (ex: CHANGEMENT PROTHESES MAMMAIRES)",
  "surgeon_name": "Nom du chirurgien (ex: Christophe DESOUCHES)",
  "admission_datetime": "Date et heure d'entrée au format ISO ou YYYY-MM-DD HH:MM (ex: 2026-05-22 14:00)",
  "discharge_datetime": "Date et heure de sortie au format ISO ou YYYY-MM-DD HH:MM (ex: 2026-05-23 11:49)",
  "stay_type": "Ambulatoire ou Hospitalisation (Détermine: Hospitalisation s'il y a des nuits, Ambulatoire sinon)",
  "clinic_name": "Nom de la clinique (ex: Clinique de Vitrolles)",
  "ipp": "Numéro IPP (ex: 000033271)",
  "stay_number": "Numéro de séjour (ex: 0526005271)",
  "address": "Adresse complète (ex: 1302 avenue de malespine, 84120 PERTUIS, France)",
  "weight": "Poids (ex: 49 kg)",
  "height": "Taille (ex: 160 cm)",
  "referring_doctor": "Nom du médecin traitant (ex: DAUMAS MARIE LAURE)",
  "referring_doctor_phone": "Téléphone du médecin traitant (ex: 0490095111)",
  "room_number": "Numéro de chambre / lit (ex: 122)"
}`;

                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeApiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    { text: prompt },
                                    {
                                        inlineData: {
                                            mimeType: mimeType,
                                            data: base64Content
                                        }
                                    }
                                ]
                            }
                        ],
                        generationConfig: {
                            responseMimeType: "application/json"
                        }
                    })
                });

                if (!response.ok) {
                    throw new Error(`Erreur Gemini API (${response.status})`);
                }

                const result = await response.json();
                const jsonText = result.candidates[0].content.parts[0].text;
                const parsed = JSON.parse(jsonText);
                applyExtractedData(parsed);
            } else {
                // High-fidelity Simulation Mock for testing
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const mockParsed = scannerCategory === 'Doctolib' ? {
                    first_name: "Jean",
                    last_name: "DUPONT",
                    birth_date: "1985-04-12",
                    operation: "Consultation Chirurgie Plastique",
                    surgeon_name: "Christophe DESOUCHES",
                    stay_type: "Consultation",
                    date: new Date().toISOString().split('T')[0],
                    phone: "+33 6 12 34 56 78",
                    email: "jean.dupont@gmail.com",
                    clinic_name: "Cabinet Dr Desouches",
                    ipp: "DOC-89421",
                    stay_number: "RDV-2026-0810",
                    address: "24 rue de la République, 13001 Marseille, France",
                    admission_datetime: `${new Date().toISOString().split('T')[0]}T14:30:00`
                } : {
                    first_name: "Amanda",
                    last_name: "RIPERT",
                    birth_date: "1987-01-06",
                    operation: "CHANGEMENT PROTHESES MAMMAIRES",
                    surgeon_name: "Christophe DESOUCHES",
                    stay_type: "Hospitalisation",
                    date: "2026-05-22",
                    phone: "+33 6 19 65 19 61",
                    email: "amanda.ripert@hotmail.fr",
                    clinic_name: "Clinique de Vitrolles",
                    ipp: "000033271",
                    stay_number: "0526005271",
                    address: "1302 avenue de malespine, 84120 PERTUIS, France",
                    weight: "49 kg",
                    height: "160 cm",
                    referring_doctor: "DAUMAS MARIE LAURE",
                    referring_doctor_phone: "0490095111",
                    entry_mode: "8 - Domicile",
                    exit_mode: "8 - Retour domicile",
                    admission_datetime: "2026-05-22T14:00:00",
                    discharge_datetime: "2026-05-23T11:49:00",
                    room_number: "122"
                };

                applyExtractedData(mockParsed);
            }
        } catch (err) {
            console.error('OCR Error:', err);
            alert(`Erreur de scan : ${err.message}. Passage en mode simulation.`);
            
            // Fail-safe mock fallback
            applyExtractedData(scannerCategory === 'Doctolib' ? {
                first_name: "Jean",
                last_name: "DUPONT",
                birth_date: "1985-04-12",
                operation: "Consultation Chirurgie Plastique",
                surgeon_name: "Christophe DESOUCHES",
                stay_type: "Consultation",
                date: new Date().toISOString().split('T')[0],
                phone: "+33 6 12 34 56 78",
                email: "jean.dupont@gmail.com",
                clinic_name: "Cabinet Dr Desouches",
                ipp: "DOC-89421",
                stay_number: "RDV-2026-0810",
                address: "24 rue de la République, 13001 Marseille, France",
                admission_datetime: `${new Date().toISOString().split('T')[0]}T14:30:00`
            } : {
                first_name: "Amanda",
                last_name: "RIPERT",
                birth_date: "1987-01-06",
                operation: "CHANGEMENT PROTHESES MAMMAIRES",
                surgeon_name: "Christophe DESOUCHES",
                stay_type: "Hospitalisation",
                date: "2026-05-22",
                phone: "+33 6 19 65 19 61",
                email: "amanda.ripert@hotmail.fr",
                clinic_name: "Clinique de Vitrolles",
                ipp: "000033271",
                stay_number: "0526005271",
                address: "1302 avenue de malespine, 84120 PERTUIS, France",
                weight: "49 kg",
                height: "160 cm",
                referring_doctor: "DAUMAS MARIE LAURE",
                referring_doctor_phone: "0490095111",
                entry_mode: "8 - Domicile",
                exit_mode: "8 - Retour domicile",
                admission_datetime: "2026-05-22T14:00:00",
                discharge_datetime: "2026-05-23T11:49:00",
                room_number: "122"
            });
        } finally {
            clearInterval(interval);
            setScanProgress(100);
            setTimeout(() => {
                setIsScanning(false);
            }, 300);
        }
    };

    const applyExtractedData = (data) => {
        setFormData({
            firstName: data.first_name || '',
            lastName: data.last_name || '',
            birthDate: data.birth_date || '',
            operation: data.operation || '',
            surgeonName: data.surgeon_name ? (data.surgeon_name.includes('DESOUCHES') ? 'Christophe DESOUCHES' : data.surgeon_name) : 'Christophe DESOUCHES',
            stayType: 'Hospitalisation',
            date: data.date || (data.admission_datetime ? data.admission_datetime.split('T')[0] : ''),
            surgeryTime: data.admission_datetime ? new Date(data.admission_datetime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'Non-communiquée',
            phone: data.phone || '+33 ',
            email: data.email || '',
            clinicName: data.clinic_name || 'Clinique de Vitrolles',
            ipp: data.ipp || '',
            stayNumber: data.stay_number || '',
            address: data.address || '',
            weight: data.weight || '',
            height: data.height || '',
            referringDoctor: data.referring_doctor || '',
            referringDoctorPhone: data.referring_doctor_phone || '',
            entryMode: data.entry_mode || '8 - Domicile',
            exitMode: data.exit_mode || '8 - Retour domicile',
            admissionDatetime: data.admission_datetime ? new Date(data.admission_datetime).toISOString().slice(0, 16) : '',
            dischargeDatetime: data.discharge_datetime ? new Date(data.discharge_datetime).toISOString().slice(0, 16) : '',
            roomNumber: data.room_number || ''
        });
        setExtractedData(data);
    };

    const handleSavePatient = async () => {
        if (!formData.firstName || !formData.lastName || !formData.operation) {
            alert('Le nom, le prénom et l\'intervention sont obligatoires.');
            return;
        }

        if (formData.date && !formData.stayType) {
            alert('Veuillez renseigner le type de séjour si la date d\'intervention est définie.');
            return;
        }

        setIsSaving(true);
        try {
            const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
            
            // Insert patient into Supabase
            const { data, error } = await supabase
                .from('patients')
                .insert([
                    {
                        name: fullName,
                        operation: formData.operation,
                        date: formData.date || new Date().toISOString().split('T')[0],
                        birth_date: formData.birthDate || null,
                        phone: formData.phone,
                        email: formData.email,
                        surgeon_name: formData.surgeonName,
                        surgery_time: formData.surgeryTime,
                        stay_type: formData.stayType,
                        clinic_name: formData.clinicName,
                        status: 'pending',
                        progress: 0,
                        days_until: 'J-0',
                        
                        // New fields
                        ipp: formData.ipp,
                        stay_number: formData.stayNumber,
                        address: formData.address,
                        weight: formData.weight,
                        height: formData.height,
                        referring_doctor: formData.referringDoctor,
                        referring_doctor_phone: formData.referringDoctorPhone,
                        entry_mode: formData.entryMode,
                        exit_mode: formData.exitMode,
                        admission_datetime: formData.admissionDatetime ? new Date(formData.admissionDatetime).toISOString() : null,
                        discharge_datetime: formData.dischargeDatetime ? new Date(formData.dischargeDatetime).toISOString() : null,
                        room_number: formData.roomNumber
                    }
                ])
                .select();

            if (error) {
                console.error('Error inserting scanned patient:', error);
                alert(`Erreur lors de la création : ${error.message}`);
            } else {
                const newPatient = data[0];

                // 1. Generate Token Immediately
                const tokenRes = await generatePatientToken(newPatient.id);
                const token = tokenRes.success ? tokenRes.token : null;

                // 2. Schedule automated reminders (J-18, J-7, J-1)
                if (newPatient.date) {
                    const surgeryDate = new Date(newPatient.date);
                    await scheduleTimeBasedReminders(newPatient.id, surgeryDate);
                    alert(`Patient ${fullName} créé avec succès par importation !`);
                    if (onSuccess) onSuccess({ ...newPatient, token });
                    onClose();
                }
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            alert('Une erreur inattendue est survenue.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div 
                className="liquid-glass-modal" 
                style={{ 
                    width: '100%', 
                    maxWidth: extractedData ? '850px' : '550px',
                    maxHeight: '90vh',
                    transition: 'max-width 0.3s ease-out'
                }} 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ padding: 'var(--spacing-5)', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                        <div style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {scannerCategory === 'HM' ? (
                                <img src={hmIcon} alt="HM Icon" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                            ) : (
                                <img src={doctolibLogo} alt="Doctolib" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                            )}
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>
                                {scannerCategory === 'HM' ? 'Scanner Patient Hopital Manager' : 'Scanner Patient Doctolib'}
                            </h3>
                            <span style={{ fontSize: '11px', color: 'var(--color-gray-400)' }}>
                                {scannerCategory === 'HM' 
                                    ? 'Intégration intelligente DPI par screenshot' 
                                    : 'Importation intelligente par screenshot du planning Doctolib'}
                            </span>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button 
                            onClick={() => setShowSettings(!showSettings)} 
                            style={{ background: 'none', border: 'none', color: 'var(--color-gray-500)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            title="Paramètres API"
                        >
                            <Settings size={18} />
                        </button>
                        <button onClick={onClose} className="btn-secondary" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-gray-400)', padding: 0 }}>
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Category Switcher Tabs */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '12px 20px',
                    background: '#F8FAFC',
                    borderBottom: '1px solid #E2E8F0'
                }}>
                    <button
                        type="button"
                        onClick={() => {
                            setScannerCategory('HM');
                            setPreviewUrl(null);
                            setSelectedFile(null);
                            setExtractedData(null);
                        }}
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            padding: '10px 16px',
                            borderRadius: '12px',
                            border: scannerCategory === 'HM' ? '2px solid #0F70B7' : '1px solid #E2E8F0',
                            background: scannerCategory === 'HM' ? '#EFF6FF' : 'white',
                            color: scannerCategory === 'HM' ? '#0F70B7' : '#64748B',
                            fontWeight: '700',
                            fontSize: '13px',
                            cursor: 'pointer',
                            boxShadow: scannerCategory === 'HM' ? '0 2px 6px rgba(15, 112, 183, 0.12)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        <img src={hmIcon} alt="Hopital Manager" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                        <span>Hopital Manager (DPI)</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setScannerCategory('Doctolib');
                            setPreviewUrl(null);
                            setSelectedFile(null);
                            setExtractedData(null);
                        }}
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            padding: '10px 16px',
                            borderRadius: '12px',
                            border: scannerCategory === 'Doctolib' ? '2px solid #0098E4' : '1px solid #E2E8F0',
                            background: scannerCategory === 'Doctolib' ? '#F0F9FF' : 'white',
                            color: scannerCategory === 'Doctolib' ? '#0077B6' : '#64748B',
                            fontWeight: '700',
                            fontSize: '13px',
                            cursor: 'pointer',
                            boxShadow: scannerCategory === 'Doctolib' ? '0 2px 6px rgba(0, 152, 228, 0.12)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        <img src={doctolibLogo} alt="Doctolib" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                        <span>Doctolib</span>
                    </button>
                </div>

                {/* Settings Panel */}
                {showSettings && (
                    <div style={{ padding: 'var(--spacing-4)', background: 'var(--color-gray-50)', borderBottom: '1px solid var(--color-gray-100)' }}>
                        <form onSubmit={handleSaveApiKey} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-gray-700)' }}>
                                Clé API Gemini (Optionnelle - Utilisée pour le scan en conditions réelles)
                            </label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="password"
                                    placeholder="AlzaSy..."
                                    className="input"
                                    value={apiKey}
                                    onChange={e => setApiKey(e.target.value)}
                                    style={{ flex: 1, height: '38px', fontSize: '13px' }}
                                />
                                <button type="submit" className="btn btn-primary" style={{ height: '38px', padding: '0 16px', background: scannerCategory === 'Doctolib' ? '#0098E4' : '#0F70B7', fontSize: '13px' }}>
                                    Enregistrer
                                </button>
                            </div>
                            <p style={{ fontSize: '11px', color: 'var(--color-gray-400)', margin: 0 }}>
                                Sans clé API, le scanner exécutera une simulation intelligente sur les captures de démonstration ({scannerCategory === 'HM' ? 'ex: Amanda Ripert' : 'ex: Jean Dupont'}).
                            </p>
                        </form>
                    </div>
                )}

                {/* Content Layout */}
                <div style={{ display: 'flex', flexDirection: 'row', overflow: 'hidden', flex: 1, maxHeight: 'calc(90vh - 120px)' }}>
                    
                    {/* Left Column: Dropzone & Image preview */}
                    <div style={{ 
                        flex: extractedData ? '1' : '1 0 100%', 
                        padding: 'var(--spacing-5)', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 'var(--spacing-4)',
                        borderRight: extractedData ? '1px solid var(--color-gray-100)' : 'none',
                        maxWidth: extractedData ? '360px' : '100%',
                        transition: 'all 0.3s ease-out'
                    }}>
                        {!previewUrl ? (
                            // Dropzone
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                style={{
                                    border: isDragging 
                                        ? (scannerCategory === 'Doctolib' ? '2px dashed #0098E4' : '2px dashed #0F70B7') 
                                        : '2px dashed var(--color-gray-200)',
                                    background: isDragging 
                                        ? (scannerCategory === 'Doctolib' ? 'rgba(0, 152, 228, 0.05)' : 'rgba(15, 112, 183, 0.05)') 
                                        : 'var(--color-gray-50)',
                                    borderRadius: 'var(--radius-xl)',
                                    padding: 'var(--spacing-8) var(--spacing-4)',
                                    textAlign: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 'var(--spacing-3)',
                                    cursor: 'pointer',
                                    flex: 1,
                                    minHeight: '220px',
                                    transition: 'all 0.2s ease-in-out'
                                }}
                                onClick={() => document.getElementById('screenshot-uploader').click()}
                            >
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    background: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: 'var(--shadow-sm)',
                                    color: scannerCategory === 'Doctolib' ? '#0098E4' : '#0F70B7'
                                }}>
                                    {scannerCategory === 'Doctolib' ? (
                                        <img src={doctolibLogo} alt="Doctolib" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                                    ) : (
                                        <UploadCloud size={28} />
                                    )}
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontWeight: '700', fontSize: '14px', color: 'var(--color-gray-800)' }}>
                                        {scannerCategory === 'Doctolib' ? 'Sélectionnez une capture Doctolib' : 'Sélectionnez une capture Hopital Manager'}
                                    </p>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--color-gray-400)' }}>
                                        {scannerCategory === 'Doctolib' ? 'Glissez-déposez le screenshot de la fiche ou du RDV Doctolib' : 'Glissez-déposez l\'image du DPI Hopital Manager ou parcourez vos fichiers'}
                                    </p>
                                </div>
                                <span style={{ 
                                    background: 'rgba(0, 0, 0, 0.05)', 
                                    padding: '4px 12px', 
                                    borderRadius: 'var(--radius-md)', 
                                    fontSize: '11px', 
                                    fontWeight: '600', 
                                    color: 'var(--color-gray-600)',
                                    marginTop: '8px'
                                }}>
                                    PNG, JPG ou JPEG
                                </span>
                                <input
                                    type="file"
                                    id="screenshot-uploader"
                                    style={{ display: 'none' }}
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>
                        ) : (
                            // Image Preview
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)', flex: 1, overflow: 'hidden' }}>
                                <div style={{ 
                                    position: 'relative', 
                                    flex: 1, 
                                    borderRadius: 'var(--radius-xl)', 
                                    overflow: 'hidden', 
                                    border: '1px solid var(--color-gray-200)',
                                    background: '#000',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minHeight: '220px'
                                }}>
                                    <img 
                                        src={previewUrl} 
                                        alt="Screenshot preview" 
                                        style={{ maxWidth: '100%', maxHeight: '350px', objectFit: 'contain', opacity: isScanning ? 0.7 : 1 }} 
                                    />
                                    
                                    {/* Scanning Line Animation */}
                                    {isScanning && (
                                        <div style={{
                                            position: 'absolute',
                                            left: 0,
                                            right: 0,
                                            height: '3px',
                                            background: scannerCategory === 'Doctolib' ? 'linear-gradient(to bottom, transparent, #0098E4, transparent)' : 'linear-gradient(to bottom, transparent, #10B981, transparent)',
                                            boxShadow: scannerCategory === 'Doctolib' ? '0 0 12px #0098E4, 0 0 4px #0098E4' : '0 0 12px #10B981, 0 0 4px #10B981',
                                            animation: 'scan-motion 2s linear infinite',
                                            zIndex: 5
                                        }} />
                                    )}

                                    {/* Scanning Loading State Overlay */}
                                    {isScanning && (
                                        <div style={{
                                            position: 'absolute',
                                            inset: 0,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: 'rgba(0, 0, 0, 0.4)',
                                            color: 'white',
                                            gap: '8px',
                                            zIndex: 4
                                        }}>
                                            <Loader2 size={36} className="spinner" style={{ animation: 'spin 1.5s linear infinite' }} />
                                            <span style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '1px', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                                                ANALYSE EN COURS ({scannerCategory.toUpperCase()})...
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button 
                                        className="btn btn-secondary" 
                                        style={{ flex: 1 }} 
                                        onClick={() => {
                                            setPreviewUrl(null);
                                            setSelectedFile(null);
                                            setExtractedData(null);
                                        }}
                                        disabled={isScanning}
                                    >
                                        Changer d'image
                                    </button>
                                    <button 
                                        className="btn btn-primary btn-scanner-animate" 
                                        style={{ 
                                            flex: 1, 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            gap: '8px',
                                            background: scannerCategory === 'Doctolib' ? '#0098E4' : '#0F70B7'
                                        }} 
                                        onClick={triggerScan}
                                        disabled={isScanning}
                                    >
                                        {scannerCategory === 'Doctolib' ? (
                                            <img src={doctolibLogo} alt="Doctolib" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                                        ) : (
                                            <img src={hmIcon} alt="HM Icon" style={{ width: '16px', height: '16px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                                        )}
                                        <span>Analyser</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Demo Mode Notice */}
                        {!apiKey && !import.meta.env.VITE_GEMINI_API_KEY && (
                            <div style={{ 
                                padding: '12px', 
                                background: scannerCategory === 'Doctolib' ? 'rgba(0, 152, 228, 0.05)' : 'rgba(235, 163, 0, 0.05)', 
                                border: scannerCategory === 'Doctolib' ? '1px solid rgba(0, 152, 228, 0.2)' : '1px solid rgba(235, 163, 0, 0.2)', 
                                borderRadius: 'var(--radius-lg)', 
                                display: 'flex', 
                                gap: '8px',
                                alignItems: 'flex-start'
                            }}>
                                {scannerCategory === 'Doctolib' ? (
                                    <img src={doctolibLogo} alt="Doctolib" style={{ width: '18px', height: '18px', objectFit: 'contain', flexShrink: 0, marginTop: '2px' }} />
                                ) : (
                                    <Info size={16} style={{ color: '#EBA300', flexShrink: 0, marginTop: '2px' }} />
                                )}
                                <span style={{ fontSize: '11px', color: scannerCategory === 'Doctolib' ? '#0077B6' : '#996B00', lineHeight: '1.4' }}>
                                    {scannerCategory === 'Doctolib' ? (
                                        <><strong>Mode Démo Doctolib Actif :</strong> L'analyse chargera automatiquement les données du rendez-vous de <strong>Jean DUPONT</strong> pour tester l'intégration.</>
                                    ) : (
                                        <><strong>Mode Démo Hopital Manager Actif :</strong> L'analyse chargera automatiquement les données d'<strong>Amanda RIPERT</strong> pour tester l'intégration.</>
                                    )}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Review extracted data (Scrollable form) */}
                    {extractedData && (
                        <div style={{ 
                            flex: 1.5, 
                            padding: 'var(--spacing-5)', 
                            overflowY: 'auto', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: 'var(--spacing-5)'
                        }}>
                            <div>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '700', color: 'var(--color-gray-800)' }}>
                                    Vérification des Données Extraites
                                </h4>
                                <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-gray-400)' }}>
                                    Vérifiez les données lues et complétez les informations avant de créer le dossier patient.
                                </p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                                
                                {/* Section 1: Informations Personnelles */}
                                <div>
                                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--color-primary-600)', textTransform: 'uppercase', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>
                                        1. Informations Personnelles
                                    </span>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div>
                                            <label className="form-label-scan">Prénom</label>
                                            <input 
                                                className="input" 
                                                value={formData.firstName} 
                                                onChange={e => setFormData({ ...formData, firstName: e.target.value })} 
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label-scan">Nom</label>
                                            <input 
                                                className="input" 
                                                value={formData.lastName} 
                                                onChange={e => setFormData({ ...formData, lastName: e.target.value })} 
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                                        <div>
                                            <label className="form-label-scan">Date de naissance</label>
                                            <input 
                                                type="date"
                                                className="input" 
                                                value={formData.birthDate} 
                                                onChange={e => setFormData({ ...formData, birthDate: e.target.value })} 
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label-scan">IPP (Identifiant Patient)</label>
                                            <input 
                                                className="input" 
                                                value={formData.ipp} 
                                                placeholder="ex: 000033271"
                                                onChange={e => setFormData({ ...formData, ipp: e.target.value })} 
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                                        <div>
                                            <label className="form-label-scan">Poids</label>
                                            <input 
                                                className="input" 
                                                value={formData.weight} 
                                                placeholder="ex: 49 kg"
                                                onChange={e => setFormData({ ...formData, weight: e.target.value })} 
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label-scan">Taille</label>
                                            <input 
                                                className="input" 
                                                value={formData.height} 
                                                placeholder="ex: 160 cm"
                                                onChange={e => setFormData({ ...formData, height: e.target.value })} 
                                            />
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '10px' }}>
                                        <label className="form-label-scan">Adresse principale</label>
                                        <input 
                                            className="input" 
                                            value={formData.address} 
                                            placeholder="Adresse complète"
                                            onChange={e => setFormData({ ...formData, address: e.target.value })} 
                                        />
                                    </div>
                                </div>

                                {/* Section 2: Coordonnées de contact */}
                                <div style={{ borderTop: '1px solid var(--color-gray-100)', paddingTop: 'var(--spacing-4)' }}>
                                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--color-primary-600)', textTransform: 'uppercase', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>
                                        2. Contact du Patient
                                    </span>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div>
                                            <label className="form-label-scan">Téléphone</label>
                                            <PhoneInput
                                                value={formData.phone}
                                                onChange={val => setFormData({ ...formData, phone: val })}
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label-scan">Email</label>
                                            <input 
                                                type="email"
                                                className="input" 
                                                value={formData.email} 
                                                placeholder="patient@email.com"
                                                onChange={e => setFormData({ ...formData, email: e.target.value })} 
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Informations Cliniques & Séjour */}
                                <div style={{ borderTop: '1px solid var(--color-gray-100)', paddingTop: 'var(--spacing-4)' }}>
                                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--color-primary-600)', textTransform: 'uppercase', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>
                                        3. Hospitalisation & Intervention
                                    </span>
                                    <div>
                                        <label className="form-label-scan">Intervention (Motif d'hospitalisation)</label>
                                        <input 
                                            className="input" 
                                            value={formData.operation} 
                                            onChange={e => setFormData({ ...formData, operation: e.target.value })} 
                                        />
                                    </div>
                                    <div style={{ marginTop: '10px' }}>
                                        <label className="form-label-scan">Clinique</label>
                                        <select 
                                            className="input"
                                            value={formData.clinicName}
                                            onChange={e => setFormData({ ...formData, clinicName: e.target.value })}
                                        >
                                            <option value="" disabled>Sélectionnez un établissement</option>
                                            <option value="Medical Alliance Aix en Provence">Medical Alliance Aix en Provence</option>
                                            <option value="Medical Alliance Marseille">Medical Alliance Marseille</option>
                                            <option value="Clinique de Vitrolles">Clinique de Vitrolles</option>
                                            <option value="Clinique Phenicia Marseille">Clinique Phénicia Marseille</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                                        <div>
                                            <label className="form-label-scan">Chirurgien</label>
                                            <input 
                                                className="input" 
                                                value={formData.surgeonName} 
                                                onChange={e => setFormData({ ...formData, surgeonName: e.target.value })} 
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label-scan">Type de séjour</label>
                                            <select 
                                                className="input"
                                                value={formData.stayType}
                                                onChange={e => setFormData({ ...formData, stayType: e.target.value })}
                                            >
                                                <option value="Consultation">Consultation</option>
                                                <option value="Ambulatoire">Ambulatoire</option>
                                                <option value="Hospitalisation">Hospitalisation</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                                        <div>
                                            <label className="form-label-scan">N° Séjour</label>
                                            <input 
                                                className="input" 
                                                value={formData.stayNumber} 
                                                placeholder="ex: 0526005271"
                                                onChange={e => setFormData({ ...formData, stayNumber: e.target.value })} 
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label-scan">Chambre / Lit</label>
                                            <input 
                                                className="input" 
                                                value={formData.roomNumber} 
                                                placeholder="ex: 122"
                                                onChange={e => setFormData({ ...formData, roomNumber: e.target.value })} 
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                                        <div>
                                            <label className="form-label-scan">Date d'intervention</label>
                                            <input 
                                                type="date"
                                                className="input" 
                                                value={formData.date} 
                                                onChange={e => setFormData({ ...formData, date: e.target.value })} 
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label-scan">Heure d'entrée</label>
                                            <input 
                                                className="input" 
                                                value={formData.surgeryTime} 
                                                placeholder="ex: 14:00"
                                                onChange={e => setFormData({ ...formData, surgeryTime: e.target.value })} 
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                                        <div>
                                            <label className="form-label-scan">Date/Heure d'admission</label>
                                            <input 
                                                type="datetime-local"
                                                className="input" 
                                                value={formData.admissionDatetime} 
                                                onChange={e => setFormData({ ...formData, admissionDatetime: e.target.value })} 
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label-scan">Date/Heure de sortie</label>
                                            <input 
                                                type="datetime-local"
                                                className="input" 
                                                value={formData.dischargeDatetime} 
                                                onChange={e => setFormData({ ...formData, dischargeDatetime: e.target.value })} 
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                                        <div>
                                            <label className="form-label-scan">Mode d'entrée</label>
                                            <input 
                                                className="input" 
                                                value={formData.entryMode} 
                                                placeholder="ex: 8 - Domicile"
                                                onChange={e => setFormData({ ...formData, entryMode: e.target.value })} 
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label-scan">Mode de sortie</label>
                                            <input 
                                                className="input" 
                                                value={formData.exitMode} 
                                                placeholder="ex: 8 - Retour domicile"
                                                onChange={e => setFormData({ ...formData, exitMode: e.target.value })} 
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 4: Médecin Traitant */}
                                <div style={{ borderTop: '1px solid var(--color-gray-100)', paddingTop: 'var(--spacing-4)' }}>
                                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--color-primary-600)', textTransform: 'uppercase', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>
                                        4. Médecin Traitant
                                    </span>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div>
                                            <label className="form-label-scan">Nom Médecin Traitant</label>
                                            <input 
                                                className="input" 
                                                value={formData.referringDoctor} 
                                                placeholder="ex: DAUMAS MARIE LAURE"
                                                onChange={e => setFormData({ ...formData, referringDoctor: e.target.value })} 
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label-scan">Téléphone Médecin</label>
                                            <input 
                                                className="input" 
                                                value={formData.referringDoctorPhone} 
                                                placeholder="ex: 0490095111"
                                                onChange={e => setFormData({ ...formData, referringDoctorPhone: e.target.value })} 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Save Actions */}
                            <div style={{ 
                                marginTop: 'var(--spacing-4)', 
                                display: 'flex', 
                                gap: '12px',
                                borderTop: '1px solid var(--color-gray-100)',
                                paddingTop: 'var(--spacing-4)',
                                position: 'sticky',
                                bottom: 0,
                                background: 'white',
                                zIndex: 10
                            }}>
                                <button 
                                    className="btn btn-secondary" 
                                    style={{ flex: 1 }}
                                    onClick={() => setExtractedData(null)}
                                    disabled={isSaving}
                                >
                                    Recommencer
                                </button>
                                <button 
                                    className="btn btn-primary" 
                                    style={{ flex: 1, background: '#0F70B7', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                    onClick={handleSavePatient}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 size={16} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                                            Création en cours...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={16} />
                                            Créer la fiche SurgiLink
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Custom Scan Motion Animation in stylesheet style injected at runtime */}
            <style>{`
                @keyframes scan-motion {
                    0% { top: 0%; }
                    50% { top: 100%; }
                    100% { top: 0%; }
                }
                .form-label-scan {
                    display: block; 
                    font-size: 11px; 
                    font-weight: 600; 
                    color: var(--color-gray-500); 
                    margin-bottom: 4px;
                    text-transform: uppercase;
                }
            `}</style>
        </div>
    );
}
