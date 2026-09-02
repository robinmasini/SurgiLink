import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    ShieldCheck,
    AlertCircle,
    Camera,
    Image as ImageIcon,
    UploadCloud,
    Trash2,
    Eye,
    CheckCircle,
    X,
    RefreshCw,
    FileText,
    Check,
    Download
} from 'lucide-react';
import { processImageToBase64, updatePatientCNI, deletePatientCNI } from '../services/cniService';

export default function CNIUploaderCard({ patientId, intakeData, onCNIUpdated, title = "Pièce d'identité", subtitle = "Transmise via la fiche de renseignements ou chargée au cabinet" }) {
    const [isSaving, setIsSaving] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [dragOverRecto, setDragOverRecto] = useState(false);
    const [dragOverVerso, setDragOverVerso] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const rectoInputRef = useRef(null);
    const versoInputRef = useRef(null);

    const initialInPerson = intakeData?.cni_in_person || intakeData?.id_card_recto === 'IN_PERSON';
    const initialRecto = intakeData?.id_card_recto && intakeData?.id_card_recto !== 'IN_PERSON' ? intakeData.id_card_recto : null;
    const initialVerso = intakeData?.id_card_verso || null;

    const [localInPerson, setLocalInPerson] = useState(initialInPerson);
    const [localRecto, setLocalRecto] = useState(initialRecto);
    const [localVerso, setLocalVerso] = useState(initialVerso);

    React.useEffect(() => {
        const isInP = intakeData?.cni_in_person || intakeData?.id_card_recto === 'IN_PERSON';
        const rImg = intakeData?.id_card_recto && intakeData?.id_card_recto !== 'IN_PERSON' ? intakeData.id_card_recto : null;
        const vImg = intakeData?.id_card_verso || null;
        setLocalInPerson(isInP);
        setLocalRecto(rImg);
        setLocalVerso(vImg);
    }, [intakeData]);

    const hasCNI = localInPerson || !!localRecto;

    // Handle File Upload
    const handleFileSelect = async (filesInput, defaultSide = 'recto') => {
        if (!filesInput) return;
        const fileList = Array.from(filesInput);
        if (fileList.length === 0) return;

        setIsSaving(true);
        try {
            let newRecto = localRecto;
            let newVerso = localVerso;

            if (fileList.length >= 2) {
                newRecto = await processImageToBase64(fileList[0]);
                newVerso = await processImageToBase64(fileList[1]);
            } else if (fileList.length === 1) {
                const base64 = await processImageToBase64(fileList[0]);
                if (defaultSide === 'recto') {
                    newRecto = base64;
                } else {
                    newVerso = base64;
                }
            }

            setLocalInPerson(false);
            setLocalRecto(newRecto);
            setLocalVerso(newVerso);

            const res = await updatePatientCNI(patientId, {
                id_card_recto: newRecto,
                id_card_verso: newVerso,
                cni_in_person: false
            });

            if (res.success) {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
                if (onCNIUpdated) onCNIUpdated(res.data);
            } else {
                alert(`Erreur lors du téléchargement : ${res.error}`);
            }
        } catch (err) {
            console.error('Error processing CNI file:', err);
            alert(err.message || 'Erreur lors du traitement de la pièce d\'identité.');
        } finally {
            setIsSaving(false);
        }
    };

    // Handle Explicit Save Button Click
    const handleSaveAll = async () => {
        setIsSaving(true);
        try {
            const res = await updatePatientCNI(patientId, {
                id_card_recto: localInPerson ? 'IN_PERSON' : localRecto,
                id_card_verso: localInPerson ? null : localVerso,
                cni_in_person: localInPerson
            });

            if (res.success) {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
                if (onCNIUpdated) onCNIUpdated(res.data);
            } else {
                alert(`Erreur lors de l'enregistrement : ${res.error}`);
            }
        } catch (err) {
            console.error('Error saving CNI:', err);
            alert('Erreur lors de l\'enregistrement de la CNI.');
        } finally {
            setIsSaving(false);
        }
    };

    // Handle Toggle In Person
    const handleSetInPerson = async () => {
        setIsSaving(true);
        try {
            setLocalInPerson(true);
            setLocalRecto(null);
            setLocalVerso(null);

            const res = await updatePatientCNI(patientId, {
                id_card_recto: 'IN_PERSON',
                id_card_verso: null,
                cni_in_person: true
            });

            if (res.success) {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
                if (onCNIUpdated) onCNIUpdated(res.data);
            } else {
                alert(`Erreur : ${res.error}`);
            }
        } catch (err) {
            console.error('Error setting in person CNI:', err);
            alert('Erreur lors de la mise à jour.');
        } finally {
            setIsSaving(false);
        }
    };

    // Handle Remove CNI Side
    const handleRemoveSide = async (side) => {
        if (!confirm(`Voulez-vous vraiment supprimer le ${side} de la pièce d'identité ?`)) return;
        setIsSaving(true);
        try {
            const newRecto = side === 'recto' ? null : localRecto;
            const newVerso = side === 'verso' ? null : localVerso;

            setLocalRecto(newRecto);
            setLocalVerso(newVerso);

            const res = await updatePatientCNI(patientId, {
                id_card_recto: newRecto,
                id_card_verso: newVerso,
                cni_in_person: false
            });

            if (res.success) {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
                if (onCNIUpdated) onCNIUpdated(res.data);
            } else {
                alert(`Erreur : ${res.error}`);
            }
        } catch (err) {
            console.error('Error removing CNI side:', err);
            alert('Erreur lors de la suppression.');
        } finally {
            setIsSaving(false);
        }
    };

    // Handle Full Delete CNI
    const handleDeleteAll = async () => {
        if (!confirm('Êtes-vous sûr de vouloir tout effacer pour la pièce d\'identité de ce patient ?')) return;
        setIsSaving(true);
        try {
            setLocalInPerson(false);
            setLocalRecto(null);
            setLocalVerso(null);

            const res = await deletePatientCNI(patientId);
            if (res.success) {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
                if (onCNIUpdated) onCNIUpdated(res.data);
            } else {
                alert(`Erreur : ${res.error}`);
            }
        } catch (err) {
            console.error('Error deleting CNI:', err);
        } finally {
            setIsSaving(false);
        }
    };

    // Handle Image Download
    const handleDownloadImage = (dataUrl) => {
        if (!dataUrl) return;
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `CNI_Patient_${patientId || 'piece_identite'}_${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="card glass-effect patient-card" style={{ position: 'relative' }}>
            {/* Hidden Inputs */}
            <input
                type="file"
                ref={rectoInputRef}
                accept="image/*,application/pdf"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        handleFileSelect(e.target.files, 'recto');
                        e.target.value = '';
                    }
                }}
            />
            <input
                type="file"
                ref={versoInputRef}
                accept="image/*,application/pdf"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        handleFileSelect(e.target.files, 'verso');
                        e.target.value = '';
                    }
                }}
            />

            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--spacing-5)',
                borderBottom: '1px solid rgba(0,0,0,0.05)',
                paddingBottom: 'var(--spacing-4)',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="card-icon card-icon-primary" style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={18} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: '700' }}>{title}</h3>
                        <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--color-gray-500)' }}>{subtitle}</p>
                    </div>
                </div>

                {/* Status Pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {localInPerson ? (
                        <span style={{
                            padding: '6px 14px',
                            borderRadius: '20px',
                            background: '#ECFDF5',
                            border: '1px solid #A7F3D0',
                            color: '#047857',
                            fontSize: '12px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            <ShieldCheck size={14} /> Main Propre
                        </span>
                    ) : localRecto && localVerso ? (
                        <span style={{
                            padding: '6px 14px',
                            borderRadius: '20px',
                            background: '#ECFDF5',
                            border: '1px solid #A7F3D0',
                            color: '#047857',
                            fontSize: '12px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            <CheckCircle size={14} /> Complète (Recto & Verso)
                        </span>
                    ) : localRecto ? (
                        <span style={{
                            padding: '6px 14px',
                            borderRadius: '20px',
                            background: '#EFF6FF',
                            border: '1px solid #BFDBFE',
                            color: '#1D4ED8',
                            fontSize: '12px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            <Check size={14} /> Recto Seul
                        </span>
                    ) : (
                        <span style={{
                            padding: '6px 14px',
                            borderRadius: '20px',
                            background: '#FEF2F2',
                            border: '1px solid #FECACA',
                            color: '#B91C1C',
                            fontSize: '12px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            <AlertCircle size={14} /> Non fournie
                        </span>
                    )}

                    {isSaving && <RefreshCw size={16} className="animate-spin" style={{ color: 'var(--color-primary-600)' }} />}
                </div>
            </div>

            {/* Main Content Area: Always display RECTO and VERSO boxes (photo 2 interface) */}
            <div>
                {saveSuccess && (
                    <div style={{
                        padding: '10px 14px',
                        background: '#ECFDF5',
                        border: '1px solid #6EE7B7',
                        borderRadius: '10px',
                        marginBottom: 'var(--spacing-4)',
                        color: '#047857',
                        fontSize: '13px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <CheckCircle size={18} color="#10B981" />
                        <span>Modifications enregistrées avec succès !</span>
                    </div>
                )}

                {localInPerson && (
                    <div style={{
                        padding: '10px 14px',
                        background: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        borderRadius: '10px',
                        marginBottom: 'var(--spacing-4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#047857',
                        fontSize: '13px',
                        fontWeight: '600'
                    }}>
                        <ShieldCheck size={18} color="#10B981" />
                        <span>Le patient a indiqué fournir sa CNI en main propre. Vous pouvez charger les photos (Recto / Verso) ci-dessous :</span>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
                        {/* RECTO BOX */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--color-gray-500)', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Recto</span>
                                {localRecto && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveSide('recto')}
                                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 0 }}
                                        title="Supprimer Recto"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>

                            {localRecto ? (
                                <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5E7EB', height: '140px', background: '#F9FAFB' }}>
                                    <img
                                        src={localRecto}
                                        alt="CNI Recto"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                                        onClick={() => setSelectedImage(localRecto)}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                                        padding: '8px 12px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedImage(localRecto)}
                                            style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: '700', color: '#111827', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        >
                                            <Eye size={12} /> Agrandir
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => rectoInputRef.current?.click()}
                                            style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: '700', color: '#111827', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        >
                                            Changer
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setDragOverRecto(true); }}
                                    onDragLeave={() => setDragOverRecto(false)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setDragOverRecto(false);
                                        if (e.dataTransfer.files?.length > 0) handleFileSelect(e.dataTransfer.files, 'recto');
                                    }}
                                    onClick={() => rectoInputRef.current?.click()}
                                    style={{
                                        height: '140px',
                                        border: `2px dashed ${dragOverRecto ? 'var(--color-primary-500)' : '#D1D5DB'}`,
                                        background: dragOverRecto ? 'var(--color-primary-50)' : '#F9FAFB',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '12px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        textAlign: 'center'
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', color: 'var(--color-primary-500)' }}>
                                        <Camera size={22} />
                                        <ImageIcon size={22} />
                                    </div>
                                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-primary-600)' }}>
                                        Ajouter Recto
                                    </span>
                                    <span style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
                                        Glisser ou cliquer
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* VERSO BOX */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--color-gray-500)', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Verso</span>
                                {localVerso && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveSide('verso')}
                                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 0 }}
                                        title="Supprimer Verso"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>

                            {localVerso ? (
                                <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5E7EB', height: '140px', background: '#F9FAFB' }}>
                                    <img
                                        src={localVerso}
                                        alt="CNI Verso"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                                        onClick={() => setSelectedImage(localVerso)}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                                        padding: '8px 12px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedImage(localVerso)}
                                            style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: '700', color: '#111827', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        >
                                            <Eye size={12} /> Agrandir
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => versoInputRef.current?.click()}
                                            style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: '700', color: '#111827', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        >
                                            Changer
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setDragOverVerso(true); }}
                                    onDragLeave={() => setDragOverVerso(false)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setDragOverVerso(false);
                                        if (e.dataTransfer.files?.length > 0) handleFileSelect(e.dataTransfer.files, 'verso');
                                    }}
                                    onClick={() => versoInputRef.current?.click()}
                                    style={{
                                        height: '140px',
                                        border: `2px dashed ${dragOverVerso ? 'var(--color-primary-500)' : '#D1D5DB'}`,
                                        background: dragOverVerso ? 'var(--color-primary-50)' : '#F9FAFB',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '12px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        textAlign: 'center'
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', color: 'var(--color-primary-500)' }}>
                                        <Camera size={22} />
                                        <ImageIcon size={22} />
                                    </div>
                                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-primary-600)' }}>
                                        Ajouter Verso
                                    </span>
                                    <span style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
                                        Glisser ou cliquer
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Toolbar Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--spacing-4)', flexWrap: 'wrap', gap: '10px', borderTop: '1px solid #F3F4F6', paddingTop: 'var(--spacing-3)' }}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                onClick={handleSaveAll}
                                disabled={isSaving}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: 'var(--color-primary-600)',
                                    color: 'white',
                                    fontSize: '13px',
                                    fontWeight: '700',
                                    cursor: isSaving ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
                                }}
                            >
                                {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                Enregistrer la CNI
                            </button>

                            <button
                                type="button"
                                onClick={handleSetInPerson}
                                style={{
                                    padding: '8px 14px',
                                    borderRadius: '10px',
                                    border: '1px solid #D1D5DB',
                                    background: 'white',
                                    color: '#374151',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                🤝 Marquer "Main propre"
                            </button>
                        </div>

                        {hasCNI && (
                            <button
                                type="button"
                                onClick={handleDeleteAll}
                                style={{
                                    padding: '8px 14px',
                                    borderRadius: '10px',
                                    border: '1px solid #FCA5A5',
                                    background: '#FEF2F2',
                                    color: '#B91C1C',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Trash2 size={14} /> Supprimer
                            </button>
                        )}
                    </div>
                </div>

            {/* Image Modal Lightbox - Rendered via React Portal directly into body to stay on top of everything */}
            {selectedImage && createPortal(
                <div
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.88)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 9999999,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px'
                    }}
                    onClick={() => setSelectedImage(null)}
                >
                    <div
                        style={{
                            position: 'relative',
                            maxWidth: '92vw',
                            maxHeight: '85vh',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '14px'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <img
                            src={selectedImage}
                            alt="Pièce d'identité agrandie"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '78vh',
                                objectFit: 'contain',
                                borderRadius: '14px',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                                border: '1px solid rgba(255, 255, 255, 0.2)'
                            }}
                        />

                        {/* Floating Action Bar */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            background: 'rgba(17, 24, 39, 0.95)',
                            padding: '8px 16px',
                            borderRadius: '30px',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                        }}>
                            <button
                                type="button"
                                onClick={() => handleDownloadImage(selectedImage)}
                                style={{
                                    background: 'var(--color-primary-600)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '20px',
                                    padding: '8px 18px',
                                    fontSize: '13px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'transform 0.15s ease'
                                }}
                            >
                                <Download size={16} /> Télécharger la photo
                            </button>

                            <button
                                type="button"
                                onClick={() => setSelectedImage(null)}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.15)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '20px',
                                    padding: '8px 16px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <X size={16} /> Fermer
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
