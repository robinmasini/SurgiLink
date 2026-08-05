import React, { useState, useEffect } from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    Info,
    Activity,
    AlertCircle,
    UserX
} from 'lucide-react';
import { supabase } from '../lib/supabase';

/**
 * PatientStatusBadges Component
 * Renders feedback pastilles based on pathway responses
 */
export default function PatientStatusBadges({ responses = [], daysUntil = '', patientStatus = '', intakeData = null, hasCni = undefined }) {
    const [rules, setRules] = useState({
        j7_incomplete_days: 7,
        j1_incomplete_days: 1,
        no_portal_access_hours: 24
    });

    useEffect(() => {
        const loadRules = async () => {
            try {
                const { data } = await supabase
                    .from('app_settings')
                    .select('value')
                    .eq('key', 'status_rules')
                    .maybeSingle();

                if (data?.value) {
                    const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
                    setRules(prevRules => ({
                        ...prevRules,
                        ...parsed,
                        j1_incomplete_days: parsed.j1_incomplete_days || parsed.j2_incomplete_days || 1
                    }));
                }
            } catch (e) {
                console.warn('Error loading rules in PatientStatusBadges:', e);
            }
        };
        loadRules();
    }, []);

    const badges = [];

    // Check CNI Status
    const isCniProvided = hasCni !== undefined 
        ? hasCni 
        : (intakeData ? Boolean(intakeData.id_card_recto || intakeData.cni_in_person) : false);

    if (!isCniProvided) {
        badges.push({ label: 'CNI à renseigner', color: 'danger' });
    }

    if (!responses || !Array.isArray(responses)) {
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

    // Create a map for quick lookup
    const responseMap = {};
    responses.forEach(r => {
        const key = `${r.screen}:${r.item_id}`;
        responseMap[key] = r.response?.value;
    });

    const isJ7Complete = responses.some(r => r.screen === 'J7');
    const isJ1PreOpComplete = responses.some(r => r.screen === 'J1_PreOp');
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
        if (!isJ7Complete && days >= -rules.j7_incomplete_days) {
            badges.push({ label: `Questionnaire J-${rules.j7_incomplete_days} non rempli`, color: 'orange' });
        }

        if (responseMap['Bienvenue:blood_work'] === false) {
            badges.push({ label: 'Bilan sanguin manquant', color: 'danger' });
        }

        if (responseMap['J7:anesthesia_consultation'] === false) {
            badges.push({ label: 'Anesthésie non confirmée', color: 'orange' });
        }

        // J-1 checks
        if (!isJ1PreOpComplete && days >= -rules.j1_incomplete_days) {
            badges.push({ label: `Questionnaire J-${rules.j1_incomplete_days} non rempli`, color: 'danger' });
        }

        const isUpToDate = (
            (Math.abs(days) > rules.j7_incomplete_days) ||
            (Math.abs(days) <= rules.j7_incomplete_days && isJ7Complete)
        ) && (
                (Math.abs(days) > rules.j1_incomplete_days) ||
                (Math.abs(days) <= rules.j1_incomplete_days && isJ1PreOpComplete)
            );

        if (isUpToDate && hasAnyResponse) {
            badges.push({ label: 'À jour ✓', color: 'success' });
        }

        if (isJ7Complete && isJ1PreOpComplete && patientStatus === 'ready') {
            badges.push({ label: 'Prêt pour l\'intervention ✓', color: 'success' });
        }
    }

    // POST-OP LOGIC (J+1 onwards)
    if (isPostOp) {
        const j1Nausea = responseMap['J1:nausea_check'];

        if (j1Nausea === false) {
            badges.push({ label: 'Nausées signalées', color: 'orange' });
        }

        if (hasAnyResponse && j1Nausea === true && patientStatus === 'ready') {
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
