import React from 'react';
import { pathwayConfig } from '../config/pathway.config';
import { formatDateFR, formatDateTimeFR } from '../utils/dateUtils';
import logoSurgilink from '../assets/logo_surgilink_brown.png';

export default function PatientSynthesisReport({
    patient,
    clinicalResponses,
    smsData = [],
    medicalHistory = [],
    documents = [],
    customQuestions = []
}) {
    if (!patient) return null;

    const screens = ['J7', 'J2', 'J1_PreOp', 'J1', 'J4_Satisfaction'];

    const getStatusLabel = (status) => {
        const labels = {
            'ready': 'Prêt',
            'incomplete': 'Protocole incomplet',
            'alerte': 'Alerte',
            'critique': 'Critique',
            'postop': 'Suivi post-op',
            'pending': 'En cours'
        };
        return labels[status] || status;
    };

    return (
        <div id="patient-synthesis-report" style={{
            width: '210mm', // A4 Width
            padding: '20mm',
            background: 'white',
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            color: '#333',
            fontSize: '12px',
            lineHeight: '1.5'
        }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <img src={logoSurgilink} alt="SurgiLink" style={{ height: '120px', marginBottom: '10px' }} />
                <h1 style={{
                    fontSize: '24px',
                    fontWeight: '800',
                    color: '#1A1A1A',
                    margin: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}>
                    Synthèse du Dossier Patient
                </h1>
                <div style={{ color: '#666', marginTop: '5px' }}>
                    Document généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
                </div>
            </div>

            {/* Patient Header Section */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '30px',
                padding: '20px',
                background: '#F8F9FA',
                borderRadius: '12px',
                border: '1px solid #E9ECEF'
            }}>
                <div>
                    <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>Identité du Patient</div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#1A1A1A' }}>{patient.name}</div>
                    <div style={{ color: '#444' }}>Né(e) le : {patient.birth_date ? formatDateFR(patient.birth_date) : 'Non renseigné'}</div>
                    <div style={{ color: '#444' }}>Tél : {patient.phone || 'Non renseigné'}</div>
                </div>
                <div>
                    <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>Détails de l'Intervention</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#8D6E63' }}>{patient.operation}</div>
                    <div style={{ color: '#444' }}>Date : {patient.date ? formatDateFR(patient.date) : 'Non définie'}</div>
                    <div style={{ fontWeight: '600', marginTop: '5px' }}>
                        Statut : <span style={{ color: patient.status === 'critique' ? '#D32F2F' : patient.status === 'ready' ? '#2E7D32' : '#E65100' }}>
                            {getStatusLabel(patient.status)} ({patient.progress}%)
                        </span>
                    </div>
                </div>
            </div>

            {/* Clinical Responses */}
            <div style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '16px', borderBottom: '2px solid #8D6E63', paddingBottom: '8px', marginBottom: '15px', color: '#8D6E63' }}>
                    Données Cliniques (Protocoles)
                </h2>
                {screens.map(screenKey => {
                    const config = pathwayConfig[screenKey];
                    const responses = clinicalResponses?.[screenKey] || {};
                    if (Object.keys(responses).length === 0) return null;

                    return (
                        <div key={screenKey} style={{ marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '10px', color: '#1A1A1A' }}>{config.title}</h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                    {config.sections.flatMap(section => section.items).map(item => {
                                        const val = responses[item.id];
                                        if (val === undefined || val === null) return null;

                                        let displayVal = val;
                                        if (typeof val === 'boolean') displayVal = val ? 'Oui' : 'Non';

                                        return (
                                            <tr key={item.id} style={{ borderBottom: '1px solid #EEE' }}>
                                                <td style={{ padding: '8px 0', width: '60%', color: '#555' }}>{item.label}</td>
                                                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '600' }}>{displayVal}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    );
                })}
            </div>

            {/* Custom Questions */}
            {customQuestions.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '16px', borderBottom: '2px solid #8D6E63', paddingBottom: '8px', marginBottom: '15px', color: '#8D6E63' }}>
                        Questions Personnalisées du Praticien
                    </h2>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                            {customQuestions.map(q => (
                                <tr key={q.id} style={{ borderBottom: '1px solid #EEE' }}>
                                    <td style={{ padding: '8px 0', width: '60%', color: '#555' }}>{q.question_text}</td>
                                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '600', color: q.response ? '#1A1A1A' : '#AAA', fontStyle: q.response ? 'normal' : 'italic' }}>
                                        {q.response || 'En attente de réponse'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* SMS History */}
            {smsData.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '16px', borderBottom: '2px solid #8D6E63', paddingBottom: '8px', marginBottom: '15px', color: '#8D6E63' }}>
                        Traçabilité des Communications (SMS)
                    </h2>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid #EEE' }}>
                                <th style={{ padding: '8px' }}>Date/Heure</th>
                                <th style={{ padding: '8px' }}>Type / Screen</th>
                                <th style={{ padding: '8px' }}>Message</th>
                                <th style={{ padding: '8px' }}>Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {smsData.map(sms => (
                                <tr key={sms.id} style={{ borderBottom: '1px solid #EEE' }}>
                                    <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>{formatDateTimeFR(sms.sent_at || sms.created_at)}</td>
                                    <td style={{ padding: '8px' }}>{sms.screen || sms.template_key || 'Manuel'}</td>
                                    <td style={{ padding: '8px' }}>
                                        <div style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {sms.message}
                                        </div>
                                    </td>
                                    <td style={{ padding: '8px' }}>{sms.status === 'delivered' ? 'Délivré' : sms.status === 'sent' ? 'Envoyé' : sms.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Documents */}
            {documents.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '16px', borderBottom: '2px solid #8D6E63', paddingBottom: '8px', marginBottom: '15px', color: '#8D6E63' }}>
                        Documents du Dossier
                    </h2>
                    <ul style={{ paddingLeft: '20px' }}>
                        {documents.map(doc => (
                            <li key={doc.id} style={{ marginBottom: '5px' }}>
                                <strong>{doc.name}</strong> (Uploadé le {formatDateFR(doc.created_at)})
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Footer */}
            <div style={{
                marginTop: '50px',
                paddingTop: '20px',
                borderTop: '1px solid #EEE',
                textAlign: 'center',
                color: '#999',
                fontSize: '10px'
            }}>
                SurgiLink - Solution de suivi patient pré et post-opératoire.<br />
                Document confidentiel à usage médical uniquement.
            </div>
        </div>
    );
}
