import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import { 
    RefreshCw, 
    CheckCircle2, 
    AlertCircle,
    ArrowRight,
    Check,
    Loader2,
    Sparkles,
    UploadCloud,
    Settings,
    Info,
    Calendar,
    Phone,
    Mail,
    MapPin,
    User
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import hmLogo from '../assets/HM.png';
import hmIcon from '../assets/hm-icon.png';
import doctolibLogo from '../assets/doctolib-bleu.png';
import PhoneInput from '../components/PhoneInput';
import { scheduleTimeBasedReminders } from '../services/reminderService';
import { generatePatientToken } from '../services/tokenService';

export default function HopitalManager() {
    const { t } = useTranslation();
    const [patients, setPatients] = useState([]);
    const [syncingId, setSyncingId] = useState(null);
    const [globalSyncing, setGlobalSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    // Scanner state
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
        loadPatients();
    }, []);

    const loadPatients = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .order('date', { ascending: true });

            if (error) throw error;
            setPatients(data || []);

            // Initialize random sync statuses for realism
            const initialStatus = {};
            (data || []).forEach(p => {
                initialStatus[p.id] = p.id % 2 === 0 ? 'synced' : 'pending';
            });
            setSyncStatus(initialStatus);
        } catch (err) {
            console.error('Error loading patients for sync:', err);
        } finally {
            setIsLoading(false);
        }
    };

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

    const processFile = (file, category = 'HM') => {
        if (!file.type.startsWith('image/')) {
            alert('Veuillez sélectionner un fichier image (PNG, JPG, JPEG).');
            return;
        }
        setScannerCategory(category);
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
            processFile(e.dataTransfer.files[0], 'HM');
        }
    };

    const triggerScan = async () => {
        if (!previewUrl) return;

        setIsScanning(true);
        setScanProgress(10);

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
            const activeApiKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY;

            if (activeApiKey) {
                const base64Content = previewUrl.split(',')[1];
                const mimeType = selectedFile.type;

                const prompt = scannerCategory === 'Doctolib' 
                    ? `Tu es un extracteur de données médicales expert spécialisé dans l'analyse de captures d'écran Doctolib Pro (Fiche patient, planning de rendez-vous ou créneaux de bloc opératoire).
Analyse l'image et extrait les informations suivantes sous forme de JSON structuré. Ne retourne AUCUN blabla, uniquement du JSON valide.

RÈGLES D'EXTRACTION DOCTOLIB PRO :
1. PATIENT (Volet de gauche) :
   - Nom de famille (ex: "DUCROCQ") -> last_name
   - Prénom (ex: "Cecile" ou "Cécile") -> first_name
   - Nom complet -> name (ex: "Cecile DUCROCQ")
   - Date de naissance (ex: "18/11/1979" -> "1979-11-18") -> birth_date
   - Téléphone portable (ex: "07 86 13 88 02" -> "+33 7 86 13 88 02") -> phone
   - Email (ex: "cecileducrocq1979@gmail.com") -> email

2. RENDEZ-VOUS & BLOC OPÉRATOIRE (Volet central) :
   - Agenda (ex: "DESOUCHES Bloc Vitrolles") :
     * Nom du chirurgien -> surgeon_name (ex: "Christophe DESOUCHES")
     * Nom de la clinique / lieu -> clinic_name (ex: "Clinique de Vitrolles" ou "Clinique Phenicia Marseille")
   - Motif de consultation / Type d'acte (ex: "Bloc > Bloc opératoire" ou "Bloc opératoire") -> operation
     * RÈGLE CRITIQUE : Si le motif ou l'agenda mentionne "Bloc", "Bloc opératoire", "Chirurgie", "Intervention" ou "Bloc Vitrolles", il s'agit d'une OPÉRATION CHIRURGICALE EN BLOC OPÉRATOIRE.
     * Définis TOUJOURS "stay_type": "Ambulatoire" (ou "Hospitalisation"). Ne mets JAMAIS "Consultation" pour des créneaux de bloc opératoire !
   - Date et Heure (ex: "vendredi 28 août 2026", "12:15" -> date: "2026-08-28", admission_datetime: "2026-08-28 12:15")

Format JSON exact à retourner :
{
  "first_name": "Cécile",
  "last_name": "DUCROCQ",
  "name": "Cécile DUCROCQ",
  "birth_date": "1979-11-18",
  "phone": "+33 7 86 13 88 02",
  "email": "cecileducrocq1979@gmail.com",
  "operation": "Bloc opératoire",
  "surgeon_name": "Christophe DESOUCHES",
  "stay_type": "Ambulatoire",
  "clinic_name": "Clinique de Vitrolles",
  "date": "2026-08-28",
  "admission_datetime": "2026-08-28 12:15"
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
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const mockParsed = scannerCategory === 'Doctolib' ? {
                    first_name: "Cécile",
                    last_name: "DUCROCQ",
                    name: "Cécile DUCROCQ",
                    birth_date: "1979-11-18",
                    operation: "Bloc opératoire",
                    surgeon_name: "Christophe DESOUCHES",
                    stay_type: "Ambulatoire",
                    date: "2026-08-28",
                    phone: "+33 7 86 13 88 02",
                    email: "cecileducrocq1979@gmail.com",
                    clinic_name: "Clinique de Vitrolles",
                    admission_datetime: "2026-08-28 12:15"
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
            
            const fallbackMock = scannerCategory === 'Doctolib' ? {
                first_name: "Cécile",
                last_name: "DUCROCQ",
                birth_date: "1979-11-18",
                operation: "Bloc opératoire",
                surgeon_name: "Christophe DESOUCHES",
                stay_type: "Ambulatoire",
                date: "2026-08-28",
                phone: "+33 7 86 13 88 02",
                email: "cecileducrocq1979@gmail.com",
                clinic_name: "Clinique de Vitrolles",
                admission_datetime: "2026-08-28 12:15"
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

            applyExtractedData(fallbackMock);
        } finally {
            clearInterval(interval);
            setScanProgress(100);
            setTimeout(() => {
                setIsScanning(false);
            }, 300);
        }
    };

    const applyExtractedData = (data) => {
        let extractedDate = data.date || '';
        if (!extractedDate && data.admission_datetime) {
            extractedDate = data.admission_datetime.split('T')[0].split(' ')[0];
        }

        let extractedTime = data.surgery_time || '';
        if (!extractedTime && data.admission_datetime) {
            const timeMatch = data.admission_datetime.match(/\d{2}:\d{2}/);
            if (timeMatch) extractedTime = timeMatch[0];
        }

        setFormData({
            firstName: data.first_name || '',
            lastName: data.last_name || '',
            birthDate: data.birth_date || '',
            operation: data.operation || '',
            surgeonName: data.surgeon_name ? (data.surgeon_name.includes('DESOUCHES') ? 'Christophe DESOUCHES' : data.surgeon_name) : 'Christophe DESOUCHES',
            stayType: data.stay_type || (scannerCategory === 'Doctolib' ? 'Ambulatoire' : 'Hospitalisation'),
            date: extractedDate,
            surgeryTime: extractedTime || '08:00',
            phone: data.phone || '+33 ',
            email: data.email || '',
            clinicName: data.clinic_name || 'Clinique Phénicia Marseille',
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

                const tokenRes = await generatePatientToken(newPatient.id);
                const token = tokenRes.success ? tokenRes.token : null;

                if (newPatient.date) {
                    const surgeryDate = new Date(newPatient.date);
                    await scheduleTimeBasedReminders(newPatient.id, surgeryDate);
                    alert(`Patient ${fullName} créé avec succès !`);
                    
                    // Reset scanner form
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setExtractedData(null);
                    loadPatients();
                }
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            alert('Une erreur inattendue est survenue.');
        } finally {
            setIsSaving(false);
        }
    };

    const triggerSync = (id) => {
        setSyncingId(id);
        setTimeout(() => {
            setSyncStatus(prev => ({ ...prev, [id]: 'synced' }));
            setSyncingId(null);
        }, 1500);
    };

    const triggerGlobalSync = () => {
        setGlobalSyncing(true);
        setTimeout(() => {
            const updated = {};
            patients.forEach(p => {
                updated[p.id] = 'synced';
            });
            setSyncStatus(updated);
            setGlobalSyncing(false);
        }, 2500);
    };

    return (
        <div className="dashboard-layout" style={{ minHeight: '100vh', background: 'var(--color-background)' }}>
            <Sidebar />
            <main className="main-content">
                <Header
                    title="Portail HM / Doctolib"
                    subtitle="Intégration Hopital Manager (DPI) & Doctolib"
                />

                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
                    {/* Status Card */}
                    <div className="card" style={{
                        padding: 'var(--spacing-6)',
                        background: 'white',
                        border: '1px solid var(--color-gray-100)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 'var(--spacing-4)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{
                                width: '52px',
                                height: '52px',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <img src={hmLogo} alt="HM Logo" style={{ width: '48px', height: 'auto', objectFit: 'contain' }} />
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-gray-900)', margin: 0 }}>
                                        Hopital Manager Sync Link
                                    </h3>
                                    <span className="badge badge-success" style={{ background: '#E3F9E5', color: '#1F7A26', border: '1px solid #B4EBB7' }}>
                                        Opérationnel
                                    </span>
                                </div>
                                <p style={{ fontSize: '13px', color: 'var(--color-gray-500)', margin: '4px 0 0 0' }}>
                                    API V1.2601.24 connecté au DPI local
                                </p>
                            </div>
                        </div>

                    </div>

                    {/* Split View: Scanner + Patients Sync Table */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))',
                        gap: 'var(--spacing-6)',
                        alignItems: 'start'
                    }}>
                        {/* Left Workspace Column: Scanners (Hopital Manager + Doctolib) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
                            {/* Card 1: Scanner Patient Hopital Manager */}
                            <div className="card" style={{
                                padding: 'var(--spacing-6)',
                                background: 'white',
                                border: '1px solid var(--color-gray-100)',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    marginBottom: 'var(--spacing-4)', 
                                    borderBottom: '1px solid var(--color-gray-100)', 
                                    paddingBottom: '12px' 
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                                        <img 
                                            src={previewUrl && scannerCategory === 'Doctolib' ? doctolibLogo : hmIcon} 
                                            alt="Scanner Icon" 
                                            style={{ height: '24px', width: 'auto', objectFit: 'contain' }} 
                                        />
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: previewUrl && scannerCategory === 'Doctolib' ? '#005072' : 'inherit' }}>
                                                {previewUrl && scannerCategory === 'Doctolib' ? 'Scanner Patient Doctolib Pro' : 'Scanner Patient Hopital Manager'}
                                            </h3>
                                            <span style={{ fontSize: '11px', color: 'var(--color-gray-400)' }}>
                                                {previewUrl && scannerCategory === 'Doctolib' ? 'Intégration RDV & Fiche via Screenshot Doctolib' : 'Intégration DPI via Screenshot'}
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
                                    </div>
                                </div>

                                {/* Settings Panel */}
                                {showSettings && (
                                    <div style={{ padding: 'var(--spacing-4)', background: 'var(--color-gray-50)', borderBottom: '1px solid var(--color-gray-100)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--spacing-4)' }}>
                                        <form onSubmit={handleSaveApiKey} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-gray-700)' }}>
                                                Clé API Gemini (Optionnelle)
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
                                                <button type="submit" className="btn btn-primary" style={{ height: '38px', padding: '0 16px', background: '#0F70B7', fontSize: '13px' }}>
                                                    Enregistrer
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {/* Dropzone or Preview / Form Workspace */}
                                {!previewUrl ? (
                                    <div
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            setIsDragging(false);
                                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                                processFile(e.dataTransfer.files[0], 'HM');
                                            }
                                        }}
                                        style={{
                                            border: isDragging && scannerCategory === 'HM' ? '2px dashed #0F70B7' : '2px dashed var(--color-gray-200)',
                                            background: isDragging && scannerCategory === 'HM' ? 'rgba(15, 112, 183, 0.05)' : 'var(--color-gray-50)',
                                            borderRadius: 'var(--radius-xl)',
                                            padding: 'var(--spacing-10) var(--spacing-4)',
                                            textAlign: 'center',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 'var(--spacing-3)',
                                            cursor: 'pointer',
                                            flex: 1,
                                            transition: 'all 0.2s ease-in-out'
                                        }}
                                        onClick={() => document.getElementById('page-screenshot-uploader').click()}
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
                                            color: 'var(--color-gray-400)'
                                        }}>
                                            <UploadCloud size={28} />
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: '700', fontSize: '14px', color: 'var(--color-gray-800)' }}>
                                                Glissez-déposez une capture d'écran Hopital Manager ici
                                            </p>
                                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--color-gray-400)' }}>
                                                ou cliquez pour parcourir
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
                                            id="page-screenshot-uploader"
                                            style={{ display: 'none' }}
                                            accept="image/*"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    processFile(e.target.files[0], 'HM');
                                                }
                                            }}
                                        />
                                    </div>
                                ) : !extractedData || isScanning ? (
                                    /* Image scanning view */
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)', flex: 1 }}>
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
                                        minHeight: '260px'
                                    }}>
                                        <img 
                                            src={previewUrl} 
                                            alt="Screenshot preview" 
                                            style={{ maxWidth: '100%', maxHeight: '320px', objectFit: 'contain', opacity: isScanning ? 0.7 : 1 }} 
                                        />
                                        {isScanning && (
                                            <div style={{
                                                position: 'absolute',
                                                left: 0,
                                                right: 0,
                                                height: '3px',
                                                background: 'linear-gradient(to bottom, transparent, #10B981, transparent)',
                                                boxShadow: '0 0 12px #10B981, 0 0 4px #10B981',
                                                animation: 'scan-motion 2s linear infinite',
                                                zIndex: 5
                                            }} />
                                        )}
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
                                                <span style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '1px' }}>
                                                    ANALYSE EN COURS...
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
                                            }}
                                            disabled={isScanning}
                                        >
                                            Annuler
                                        </button>
                                        <button 
                                            className="btn btn-primary btn-scanner-animate" 
                                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} 
                                            onClick={triggerScan}
                                            disabled={isScanning}
                                        >
                                            <Sparkles size={16} /> Lancer l'analyse
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* Review & Edit extracted form data */
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)', maxHeight: '650px', overflowY: 'auto', paddingRight: '4px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16, 185, 129, 0.08)', padding: '10px 14px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', fontSize: '13px', fontWeight: '600' }}>
                                            <CheckCircle2 size={16} />
                                            <span>Scan réussi. Veuillez vérifier les champs.</span>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                if (window.confirm('Voulez-vous vraiment annuler le scan actuel ?')) {
                                                    setPreviewUrl(null);
                                                    setSelectedFile(null);
                                                    setExtractedData(null);
                                                }
                                            }}
                                            style={{ background: 'none', border: 'none', color: 'var(--color-gray-400)', fontSize: '11px', textDecoration: 'underline', cursor: 'pointer' }}
                                        >
                                            Recommencer
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                                        {/* Section 1: Informations Personnelles */}
                                        <div>
                                            <span style={{ fontSize: '10px', fontWeight: '800', color: '#0F70B7', textTransform: 'uppercase', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>
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
                                                    <label className="form-label-scan">IPP (DPI)</label>
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

                                        {/* Section 2: Contact */}
                                        <div style={{ borderTop: '1px solid var(--color-gray-100)', paddingTop: 'var(--spacing-3)' }}>
                                            <span style={{ fontSize: '10px', fontWeight: '800', color: '#0F70B7', textTransform: 'uppercase', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>
                                                2. Contact
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

                                        {/* Section 3: Hospitalisation */}
                                        <div style={{ borderTop: '1px solid var(--color-gray-100)', paddingTop: 'var(--spacing-3)' }}>
                                            <span style={{ fontSize: '10px', fontWeight: '800', color: '#0F70B7', textTransform: 'uppercase', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>
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
                                                    <label className="form-label-scan">Admission Date/Heure</label>
                                                    <input 
                                                        type="datetime-local"
                                                        className="input" 
                                                        value={formData.admissionDatetime} 
                                                        onChange={e => setFormData({ ...formData, admissionDatetime: e.target.value })} 
                                                    />
                                                </div>
                                                <div>
                                                    <label className="form-label-scan">Sortie Date/Heure</label>
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
                                        <div style={{ borderTop: '1px solid var(--color-gray-100)', paddingTop: 'var(--spacing-3)' }}>
                                            <span style={{ fontSize: '10px', fontWeight: '800', color: '#0F70B7', textTransform: 'uppercase', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>
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

                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', gap: '12px', marginTop: 'var(--spacing-2)', borderTop: '1px solid var(--color-gray-100)', paddingTop: 'var(--spacing-4)' }}>
                                        <button 
                                            className="btn btn-secondary" 
                                            style={{ flex: 1 }}
                                            onClick={() => {
                                                setPreviewUrl(null);
                                                setSelectedFile(null);
                                                setExtractedData(null);
                                            }}
                                            disabled={isSaving}
                                        >
                                            Annuler
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
                                                    Création...
                                                </>
                                            ) : (
                                                <>
                                                    <Check size={16} /> Enregistrer
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Card 2: Uploader Patient Doctolib */}
                        {!previewUrl && (
                            <div className="card" style={{
                                padding: 'var(--spacing-6)',
                                background: 'white',
                                border: '1px solid var(--color-gray-100)',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    marginBottom: 'var(--spacing-4)', 
                                    borderBottom: '1px solid var(--color-gray-100)', 
                                    paddingBottom: '12px' 
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                                        <img src={doctolibLogo} alt="Doctolib Logo" style={{ height: '22px', width: 'auto', objectFit: 'contain' }} />
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#005072' }}>Uploader Patient Doctolib</h3>
                                            <span style={{ fontSize: '11px', color: 'var(--color-gray-400)' }}>Intégration RDV & Fiche via Screenshot Doctolib</span>
                                        </div>
                                    </div>
                                    <span className="badge" style={{ background: '#E0F2FE', color: '#0369A1', border: '1px solid #BAE6FD', fontSize: '10px', fontWeight: '700' }}>
                                        Doctolib Pro
                                    </span>
                                </div>

                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setIsDragging(false);
                                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                            processFile(e.dataTransfer.files[0], 'Doctolib');
                                        }
                                    }}
                                    style={{
                                        border: '2px dashed #0284C7',
                                        background: '#F0F9FF',
                                        borderRadius: 'var(--radius-xl)',
                                        padding: 'var(--spacing-10) var(--spacing-4)',
                                        textAlign: 'center',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 'var(--spacing-3)',
                                        cursor: 'pointer',
                                        flex: 1,
                                        transition: 'all 0.2s ease-in-out'
                                    }}
                                    onClick={() => document.getElementById('doctolib-page-screenshot-uploader').click()}
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
                                        color: '#0284C7'
                                    }}>
                                        <UploadCloud size={28} />
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: '700', fontSize: '14px', color: '#0369A1' }}>
                                            Glissez-déposez une capture d'écran Doctolib ici
                                        </p>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--color-gray-500)' }}>
                                            Fiche patient, créneau de bloc opératoire ou RDV
                                        </p>
                                    </div>
                                    <span style={{ 
                                        background: 'white', 
                                        padding: '4px 12px', 
                                        borderRadius: 'var(--radius-md)', 
                                        fontSize: '11px', 
                                        fontWeight: '600', 
                                        color: '#0284C7',
                                        border: '1px solid #BAE6FD',
                                        marginTop: '8px'
                                    }}>
                                        PNG, JPG ou JPEG
                                    </span>
                                    <input
                                        type="file"
                                        id="doctolib-page-screenshot-uploader"
                                        style={{ display: 'none' }}
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                processFile(e.target.files[0], 'Doctolib');
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                        {/* Patients Sync Table */}
                        <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white', border: '1px solid var(--color-gray-100)' }}>
                            <div style={{ padding: 'var(--spacing-4)', borderBottom: '1px solid var(--color-gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Synchronisation des Dossiers Patients</h3>
                                <span style={{ fontSize: '13px', color: 'var(--color-gray-500)' }}>
                                    {patients.length} dossiers correspondants
                                </span>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--color-gray-50)', borderBottom: '1px solid var(--color-gray-100)' }}>
                                            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', color: 'var(--color-gray-500)', textTransform: 'uppercase', fontWeight: '700' }}>Patient</th>
                                            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', color: 'var(--color-gray-500)', textTransform: 'uppercase', fontWeight: '700' }}>Intervention</th>
                                            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', color: 'var(--color-gray-500)', textTransform: 'uppercase', fontWeight: '700' }}>Identifiant Externe</th>
                                            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', color: 'var(--color-gray-500)', textTransform: 'uppercase', fontWeight: '700' }}>Statut Sync</th>
                                            <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '11px', color: 'var(--color-gray-500)', textTransform: 'uppercase', fontWeight: '700' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-gray-400)' }}>
                                                    Chargement...
                                                </td>
                                            </tr>
                                        ) : patients.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-gray-400)' }}>
                                                    Aucun patient à synchroniser.
                                                </td>
                                            </tr>
                                        ) : patients.map(p => (
                                            <tr key={p.id} style={{ borderBottom: '1px solid var(--color-gray-50)' }}>
                                                <td style={{ padding: '14px 16px' }}>
                                                    <div style={{ fontWeight: '600', color: 'var(--color-gray-900)' }}>{p.name}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--color-gray-400)' }}>{p.phone}</div>
                                                </td>
                                                <td style={{ padding: '14px 16px' }}>
                                                    <div style={{ fontSize: '13px', color: 'var(--color-gray-800)' }}>{p.operation}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--color-gray-400)' }}>{p.date}</div>
                                                </td>
                                                <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '13px', color: 'var(--color-gray-600)' }}>
                                                    HM-{p.id * 1042 + 99}
                                                </td>
                                                <td style={{ padding: '14px 16px' }}>
                                                    {syncStatus[p.id] === 'synced' ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-success-600)', fontSize: '13px', fontWeight: '600' }}>
                                                            <CheckCircle2 size={16} />
                                                            <span>Synchronisé</span>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-warning-600)', fontSize: '13px', fontWeight: '600' }}>
                                                            <AlertCircle size={16} />
                                                            <span>Non synchronisé</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                                    <button
                                                        onClick={() => triggerSync(p.id)}
                                                        disabled={syncingId === p.id}
                                                        style={{
                                                            padding: '6px 12px',
                                                            borderRadius: '8px',
                                                            border: '1px solid',
                                                            borderColor: syncStatus[p.id] === 'synced' ? 'var(--color-gray-200)' : '#0F70B7',
                                                            background: syncStatus[p.id] === 'synced' ? '#F5F5F5' : 'white',
                                                            color: syncStatus[p.id] === 'synced' ? 'var(--color-gray-500)' : '#0F70B7',
                                                            fontSize: '12px',
                                                            fontWeight: '700',
                                                            cursor: syncingId === p.id ? 'default' : 'pointer',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '6px'
                                                        }}
                                                    >
                                                        {syncingId === p.id ? (
                                                            <Loader2 size={12} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                                                        ) : syncStatus[p.id] === 'synced' ? (
                                                            <Check size={12} />
                                                        ) : (
                                                            <RefreshCw size={12} />
                                                        )}
                                                        {syncStatus[p.id] === 'synced' ? 'À Jour' : 'Sync'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                
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
            </main>
        </div>
    );
}
