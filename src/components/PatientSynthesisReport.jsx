import React from 'react';
import { pathwayConfig } from '../config/pathway.config';
import { formatDateFR, formatDateTimeFR } from '../utils/dateUtils';
import logoSurgilink from '../assets/logo_surgilink_brown.png';

export default function PatientSynthesisReport({
    patient,
    clinicalResponses,
    responsesMeta = {},
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

    // Format a timestamp nicely
    const formatMeta = (screen, itemId) => {
        const m = responsesMeta?.[screen]?.[itemId];
        if (!m?.updated_at) return null;
        const dateStr = formatDateTimeFR(m.updated_at);
        // user_id null = patient via portal, otherwise = practitioner
        const author = m.user_id ? 'Praticien' : 'Patient (portail)';
        return { dateStr, author };
    };

    // Page styles
    const pageStyle = {
        width: '210mm',
        minHeight: '297mm',
        padding: '16mm 18mm',
        background: 'white',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        color: '#333',
        fontSize: '11px',
        lineHeight: '1.5',
        boxSizing: 'border-box'
    };

    const pageBreakStyle = {
        pageBreakAfter: 'always',
        breakAfter: 'page'
    };

    const h2Style = {
        fontSize: '13px',
        borderBottom: '2px solid #8D6E63',
        paddingBottom: '5px',
        marginTop: '16px',
        marginBottom: '10px',
        color: '#8D6E63',
        fontWeight: '700'
    };

    const h3Style = {
        fontSize: '11px',
        fontWeight: '700',
        marginBottom: '6px',
        marginTop: '10px',
        color: '#1A1A1A',
        textTransform: 'uppercase',
        letterSpacing: '0.4px'
    };

    const tdLabelStyle = {
        padding: '5px 0',
        width: '58%',
        color: '#555',
        verticalAlign: 'top'
    };

    const tdValueStyle = {
        padding: '5px 0',
        textAlign: 'right',
        fontWeight: '600',
        color: '#1A1A1A',
        verticalAlign: 'top'
    };

    const metaStyle = {
        fontSize: '9px',
        color: '#999',
        fontWeight: '400',
        fontStyle: 'italic',
        marginTop: '1px'
    };

    const ReportFooter = () => (
        <div style={{
            marginTop: 'auto',
            paddingTop: '16px',
            borderTop: '1px solid #EEE',
            textAlign: 'center',
            color: '#AAA',
            fontSize: '9px'
        }}>
            SurgiLink — Solution de suivi patient pré et post-opératoire · Document confidentiel
        </div>
    );

    // Shared header block
    const ReportHeader = ({ pageNumber, totalPages }) => (
        <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <img src={logoSurgilink} alt="SurgiLink" style={{ height: '60px' }} />
                <div style={{ textAlign: 'right', fontSize: '10px', color: '#888', fontWeight: '600' }}>
                    Page {pageNumber} / {totalPages}
                </div>
            </div>
            <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: '18px', fontWeight: '800', color: '#1A1A1A', margin: '4px 0 0 0', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    Synthèse du Dossier Patient
                </h1>
                <div style={{ color: '#888', marginTop: '2px', fontSize: '9px' }}>
                    Généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')} — Document confidentiel
                </div>
            </div>
        </div>
    );

    // Patient identity block
    const PatientBlock = () => (
        <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px',
            marginBottom: '14px', padding: '14px',
            background: '#F8F9FA', borderRadius: '10px', border: '1px solid #E9ECEF'
        }}>
            <div>
                <div style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', fontWeight: '700', marginBottom: '3px' }}>Identité du Patient</div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#1A1A1A' }}>{patient.name}</div>
                <div style={{ color: '#444' }}>Né(e) le : {patient.birth_date ? formatDateFR(patient.birth_date) : 'Non renseigné'}</div>
                <div style={{ color: '#444' }}>Tél : {patient.phone || 'Non renseigné'}</div>
            </div>
            <div>
                <div style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', fontWeight: '700', marginBottom: '3px' }}>Intervention</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#8D6E63' }}>{patient.operation}</div>
                <div style={{ color: '#444' }}>Date : {patient.date ? formatDateFR(patient.date) : 'Non définie'}</div>
                <div style={{ fontWeight: '600', marginTop: '4px' }}>
                    Statut : <span style={{ color: patient.status === 'critique' ? '#D32F2F' : patient.status === 'ready' ? '#2E7D32' : '#E65100' }}>
                        {getStatusLabel(patient.status)} ({patient.progress}%)
                    </span>
                </div>
            </div>
        </div>
    );

    return (
        <div id="patient-synthesis-report">

            {/* ═══════════════════ PAGE 1 ═══════════════════ */}
            <div className="pdf-page" style={pageStyle}>
                <ReportHeader pageNumber={1} totalPages={2} />
                <PatientBlock />

                {/* Clinical Responses - Part 1 (Pre-op & Early Post-op) */}
                <div>
                    <h2 style={h2Style}>Pré-opératoire & J+1</h2>
                    {['J7', 'J2', 'J1_PreOp', 'J1'].map(screenKey => {
                        const config = pathwayConfig[screenKey];
                        const responses = clinicalResponses?.[screenKey] || {};
                        if (Object.keys(responses).length === 0) return null;

                        const allItems = config.sections.flatMap(s => s.items);
                        const answeredItems = allItems.filter(item => {
                            const val = responses[item.id];
                            return val !== undefined && val !== null && val !== '';
                        });

                        if (answeredItems.length === 0) return null;

                        return (
                            <div key={screenKey} style={{ marginBottom: '8px' }}>
                                <h3 style={h3Style}>{config.title}</h3>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <tbody>
                                        {answeredItems.map(item => {
                                            const val = responses[item.id];
                                            let displayVal = val;
                                            if (typeof val === 'boolean') displayVal = val ? 'Oui' : 'Non';

                                            const meta = formatMeta(screenKey, item.id);

                                            return (
                                                <tr key={item.id} style={{ borderBottom: '1px solid #F0F0F0' }}>
                                                    <td style={tdLabelStyle}>{item.label}</td>
                                                    <td style={tdValueStyle}>
                                                        <div>{String(displayVal)}</div>
                                                        {meta && (
                                                            <div style={metaStyle}>
                                                                {meta.dateStr} · {meta.author}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })}
                </div>
                <ReportFooter />
            </div>

            {/* ═══════════════════ PAGE 2 ═══════════════════ */}
            <div className="pdf-page" style={pageStyle}>
                <ReportHeader pageNumber={2} totalPages={2} />

                {/* Clinical Responses - Part 2 (Satisfaction) */}
                {['J4_Satisfaction'].map(screenKey => {
                    const config = pathwayConfig[screenKey];
                    const responses = clinicalResponses?.[screenKey] || {};
                    if (Object.keys(responses).length === 0) return null;

                    const allItems = config.sections.flatMap(s => s.items);
                    const answeredItems = allItems.filter(item => {
                        const val = responses[item.id];
                        return val !== undefined && val !== null && val !== '';
                    });

                    if (answeredItems.length === 0) return null;

                    return (
                        <div key={screenKey} style={{ marginBottom: '16px' }}>
                            <h2 style={h2Style}>Enquêtes de Satisfaction</h2>
                            <h3 style={h3Style}>{config.title}</h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                    {answeredItems.map(item => {
                                        const val = responses[item.id];
                                        let displayVal = val;
                                        if (typeof val === 'boolean') displayVal = val ? 'Oui' : 'Non';
                                        const meta = formatMeta(screenKey, item.id);
                                        return (
                                            <tr key={item.id} style={{ borderBottom: '1px solid #F0F0F0' }}>
                                                <td style={tdLabelStyle}>{item.label}</td>
                                                <td style={tdValueStyle}>
                                                    <div>{String(displayVal)}</div>
                                                    {meta && (
                                                        <div style={metaStyle}>
                                                            {meta.dateStr} · {meta.author}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    );
                })}

                {/* Custom Questions */}
                {customQuestions.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                        <h2 style={h2Style}>Questions Personnalisées du Praticien</h2>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                                {customQuestions.map(q => {
                                    const hasResponse = !!q.response;
                                    return (
                                        <tr key={q.id} style={{ borderBottom: '1px solid #F0F0F0' }}>
                                            <td style={tdLabelStyle}>{q.question_text}</td>
                                            <td style={tdValueStyle}>
                                                <div style={{ color: hasResponse ? '#1A1A1A' : '#AAA', fontStyle: hasResponse ? 'normal' : 'italic' }}>
                                                    {q.response || 'En attente de réponse'}
                                                </div>
                                                {q.answered_at && (
                                                    <div style={metaStyle}>
                                                        {formatDateTimeFR(q.answered_at)} · Patient (portail)
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* SMS History */}
                {smsData.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                        <h2 style={h2Style}>Traçabilité des Communications (SMS)</h2>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid #DDD', background: '#F8F8F8' }}>
                                    <th style={{ padding: '5px 6px', fontWeight: '700' }}>Date / Heure</th>
                                    <th style={{ padding: '5px 6px', fontWeight: '700' }}>Type</th>
                                    <th style={{ padding: '5px 6px', fontWeight: '700' }}>Message</th>
                                    <th style={{ padding: '5px 6px', fontWeight: '700' }}>Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {smsData.map(sms => (
                                    <tr key={sms.id} style={{ borderBottom: '1px solid #F0F0F0' }}>
                                        <td style={{ padding: '5px 6px', whiteSpace: 'nowrap' }}>{formatDateTimeFR(sms.sent_at || sms.created_at)}</td>
                                        <td style={{ padding: '5px 6px' }}>{sms.screen || sms.template_key || 'Manuel'}</td>
                                        <td style={{ padding: '5px 6px', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {sms.message}
                                        </td>
                                        <td style={{ padding: '5px 6px' }}>
                                            {sms.status === 'delivered' ? '✓ Délivré' : sms.status === 'sent' ? '→ Envoyé' : sms.status}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Documents */}
                {documents.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                        <h2 style={h2Style}>Documents du Dossier</h2>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                            <tbody>
                                {documents.map(doc => (
                                    <tr key={doc.id} style={{ borderBottom: '1px solid #F0F0F0' }}>
                                        <td style={{ padding: '5px 0', fontWeight: '600' }}>{doc.name}</td>
                                        <td style={{ padding: '5px 0', textAlign: 'right', color: '#888' }}>Ajouté le {formatDateFR(doc.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <ReportFooter />
            </div>
        </div>
    );
}
