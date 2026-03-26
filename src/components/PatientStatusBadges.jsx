import React from 'react';

/**
 * PatientStatusBadges Component
 * Renders feedback pastilles based on pathway responses
 */
export default function PatientStatusBadges({ responses = [], daysUntil = '', patientStatus = '' }) {
    if (!responses || !Array.isArray(responses)) return null;

    const badges = [];

    // Create a map for quick lookup
    const responseMap = {};
    responses.forEach(r => {
        const key = `${r.screen}:${r.item_id}`;
        responseMap[key] = r.response?.value;
    });

    const isJ7Complete = responses.some(r => r.screen === 'J7');
    const isJ2Complete = responses.some(r => r.screen === 'J2');
    const hasAnyResponse = responses.length > 0;

    // PRE-OP LOGIC (J-7 to J-0)
    const days = parseInt(daysUntil.replace('J', '')) || 0;
    const isPreOp = days < 0;
    const isPostOp = days > 0;

    if (!hasAnyResponse && isPreOp && days >= -10) {
        badges.push({ label: 'Portail non consulté', color: 'gray' });
    }

    if (isPreOp) {
        // J-7 checks
        if (!isJ7Complete && days >= -7) {
            badges.push({ label: 'Questionnaire J-7 non rempli', color: 'orange' });
        }

        if (responseMap['J7:blood_work'] === false) {
            badges.push({ label: 'Bilan sanguin manquant', color: 'danger' });
        }

        if (responseMap['J7:anesthesia_consultation'] === false) {
            badges.push({ label: 'Anesthésie non confirmée', color: 'orange' });
        }

        // J-2 checks
        if (!isJ2Complete && days >= -2) {
            badges.push({ label: 'Questionnaire J-2 non rempli', color: 'danger' });
        }

        if (isJ7Complete && isJ2Complete && patientStatus === 'ready') {
            badges.push({ label: 'Prêt pour l\'intervention ✓', color: 'success' });
        }
    }

    // POST-OP LOGIC (J+1 onwards)
    if (isPostOp) {
        const j1Pain = responseMap['J1:pain_level'];
        const j1Worry = responseMap['J1:worry_check'];
        const j1Site = responseMap['J1:site_check'];
        const j1General = responseMap['J1:general_state'];

        if (j1Pain > 3 || j1Worry === true) {
            badges.push({ label: 'Douleur signalée', color: 'danger' });
        }

        if (j1Site === true) {
            badges.push({ label: 'Gonflement important', color: 'orange' });
        }

        if (j1General === 'Inquiétant') {
            badges.push({ label: 'À contacter', color: 'orange' });
        }

        if (hasAnyResponse && !j1Pain && !j1Worry && !j1Site && patientStatus === 'ready') {
            badges.push({ label: 'Pas de complications ✓', color: 'success' });
        }
    }

    if (patientStatus === 'ready' && !isPreOp && !isPostOp) {
        badges.push({ label: 'Traité ✓', color: 'success' });
    }

    if (badges.length === 0) return null;

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-1)' }}>
            {badges.map((badge, idx) => (
                <span
                    key={idx}
                    className={`badge badge-${badge.color}`}
                    style={{
                        fontSize: '10px',
                        padding: '2px 8px',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {badge.label}
                </span>
            ))}
        </div>
    );
}
