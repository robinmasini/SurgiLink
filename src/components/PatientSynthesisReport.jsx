import React from 'react';
import { pathwayConfig } from '../config/pathway.config';
import { formatDateFR, formatDateTimeFR } from '../utils/dateUtils';

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
        borderBottom: '2px solid #7C3AED',
        paddingBottom: '5px',
        marginTop: '16px',
        marginBottom: '10px',
        color: '#7C3AED',
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

    const SurgiLinkLogo = ({ height = 40 }) => (
        <svg width={(height * 727) / 745} height={height} viewBox="0 0 727 745" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                opacity="0.956863"
                d="M406.946 1.41211L412.116 2.74513V238.69H524.567L525.86 245.356L317.761 561.282L316.469 324.004H201.433L200.141 320.005L406.946 1.41211ZM381.096 102.722L257.012 292.011L401.776 294.677L344.905 326.67L347.49 462.639L471.573 273.349L324.224 270.683L381.096 241.357V102.722Z"
                fill="#7C3AED"
                stroke="#7C3AED"
                strokeWidth="2"
            />
            <path
                d="M4.75223 700.477H10.5376C11.2607 711.221 19.5255 718.246 31.716 718.246C43.3899 718.246 51.2414 712.667 51.2414 703.37C51.2414 692.832 41.1171 690.559 29.7531 688.596C18.1824 686.634 6.40518 683.534 6.40518 669.794C6.40518 657.5 16.0129 649.752 30.6829 649.752C45.4561 649.752 54.8573 657.914 55.8904 670.311H50.2083C48.9686 660.909 41.5304 654.814 30.6829 654.814C19.3188 654.814 11.9839 660.083 11.9839 669.484C11.9839 679.815 21.5917 681.675 32.6458 683.534C44.6296 685.6 56.8201 689.113 56.8201 702.853C56.8201 715.044 46.7991 723.308 31.6127 723.308C15.3931 723.308 5.4754 714.114 4.75223 700.477ZM96.616 692.832L96.616 650.372H102.195L102.195 693.142C102.195 709.775 108.6 718.143 122.96 718.143C137.527 718.143 143.932 709.775 143.932 693.142L143.932 650.372H149.51L149.51 692.832C149.51 712.977 140.832 723.308 122.96 723.308C105.191 723.308 96.616 712.977 96.616 692.832ZM191.962 722.688L191.962 650.372H218.72C232.46 650.372 241.448 658.637 241.448 671.447C241.448 682.088 234.733 689.836 224.092 691.489L241.654 722.688H235.352L218.306 692.522H197.541L197.541 722.688H191.962ZM218.41 655.537H197.541L197.541 687.357H218.306C228.947 687.357 235.766 681.055 235.766 671.447C235.766 661.736 229.051 655.537 218.41 655.537ZM311.311 723.308C291.993 723.308 278.666 708.328 278.666 686.53C278.666 664.835 291.683 649.752 312.138 649.752C327.324 649.752 338.585 658.12 341.581 672.583H335.589C332.593 661.219 324.122 654.918 311.931 654.918C295.195 654.918 284.451 668.038 284.451 686.53C284.451 705.126 295.195 718.143 311.415 718.143C327.428 718.143 337.242 707.399 337.242 693.245V690.146L313.481 690.146V684.981L342.614 684.981L342.614 722.688H337.759L337.449 706.676C334.349 715.354 325.775 723.308 311.311 723.308ZM385.466 722.688L385.466 650.372H391.044L391.044 722.688H385.466Z"
                fill="#7C3AED"
                stroke="#7C3AED"
                strokeWidth="0.5"
            />
            <path
                d="M475.961 722.688H431.744L431.744 650.372H447.241L447.241 709.362H475.961L475.961 722.688ZM509.832 722.688L509.832 650.372H525.328L525.328 722.688H509.832ZM578.388 722.688H563.201L563.201 650.372H577.252L607.934 695.931L607.934 650.372L623.224 650.372L623.224 722.688H609.071L578.388 677.129V722.688ZM661.164 722.688L661.164 650.372H676.66L676.66 683.121L705.587 650.372H724.389L697.632 680.538L726.145 722.688H707.55L686.681 691.902L676.66 703.266V722.688H661.164Z"
                fill="#7C3AED"
                stroke="#7C3AED"
                strokeWidth="0.5"
            />
        </svg>
    );

    // Shared header block
    const ReportHeader = ({ pageNumber, totalPages }) => (
        <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <SurgiLinkLogo height={50} />
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
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#7C3AED' }}>{patient.operation}</div>
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
