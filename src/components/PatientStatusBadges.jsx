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
let cachedStatusRules = null;
let statusRulesPromise = null;

export default function PatientStatusBadges({ responses = [], daysUntil = '', patientStatus = '', intakeData = null, hasCni = undefined, lastConsultedAt = null, hasDate = undefined }) {
    const [rules, setRules] = useState(() => cachedStatusRules || {
        j7_incomplete_days: 7,
        j1_incomplete_days: 1,
        no_portal_access_hours: 24
    });

    useEffect(() => {
        if (cachedStatusRules) {
            setRules(cachedStatusRules);
            return;
        }

        const loadRules = async () => {
            try {
                if (!statusRulesPromise) {
                    statusRulesPromise = supabase
                        .from('app_settings')
                        .select('value')
                        .eq('key', 'status_rules')
                        .maybeSingle();
                }
                const { data } = await statusRulesPromise;

                if (data?.value) {
                    const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
                    const finalRules = {
                        j7_incomplete_days: 7,
                        no_portal_access_hours: 24,
                        ...parsed,
                        j1_incomplete_days: parsed?.j1_incomplete_days || parsed?.j2_incomplete_days || 1
                    };
                    cachedStatusRules = finalRules;
                    setRules(finalRules);
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
    } else {
        badges.push({ label: 'CNI renseignée', color: 'success' });
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
        if (!r || !r.screen) return;
        const key = `${r.screen}:${r.item_id}`;
        const lowerKey = `${r.screen.toLowerCase()}:${r.item_id}`;
        responseMap[key] = r.response?.value;
        responseMap[lowerKey] = r.response?.value;
    });

    const isJ7Complete = responses.some(r => r.screen && r.screen.toLowerCase() === 'j7');
    const isJ1PreOpComplete = responses.some(r => r.screen && (r.screen.toLowerCase() === 'j1_preop' || r.screen.toLowerCase() === 'j1preop'));
    const isBienvenueComplete = responses.some(r => r.screen && r.screen.toLowerCase() === 'bienvenue');
    const hasAnyResponse = responses.length > 0;
    const wasConsulted = !!lastConsultedAt || hasAnyResponse;

    // PRE-OP LOGIC (J-7 to J-0)
    // Only run time-based overdue checks if a valid surgery date is defined!
    const isDateSet = hasDate !== undefined ? Boolean(hasDate) : (daysUntil !== '' && daysUntil !== undefined && daysUntil !== null);

    let isPreOp = false;
    let isPostOp = false;

    if (isDateSet) {
        const days = parseInt((daysUntil || '').replace('J', '')) || 0;
        isPreOp = days <= 0;
        isPostOp = days > 0;

        if (!wasConsulted && isPreOp && days >= -10) {
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

    if (patientStatus === 'ready' && isDateSet && !isPreOp && !isPostOp) {
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
