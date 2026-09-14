import { supabase } from '../lib/supabase';

// Retrieve deleted demo patient IDs / names from localStorage
export const getDeletedDemoPatients = () => {
    let list = ['demo-p1', 'demo-p2', 'demo-p3', 'marie dupont', 'jean martin', 'sophie leroy'];
    try {
        const stored = localStorage.getItem('surgilink_deleted_demo_patients');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                list = Array.from(new Set([...list, ...parsed]));
            }
        }
    } catch (e) {
        console.warn('Error reading surgilink_deleted_demo_patients:', e);
    }
    return list;
};

export const deletePatient = async (patientId, patientName = null) => {
    try {
        console.log(`[deletePatient] Deleting patient ID: ${patientId}, Name: ${patientName}`);

        // 1. Store deleted patient ID and normalized name in localStorage
        const deletedDemo = getDeletedDemoPatients();
        if (patientId) deletedDemo.push(String(patientId));
        if (patientName) deletedDemo.push(patientName.trim().toLowerCase());

        // Always pair demo IDs with demo names
        if (patientId === 'demo-p1' || (patientName && patientName.toLowerCase().includes('dupont'))) {
            deletedDemo.push('demo-p1', 'marie dupont');
        }
        if (patientId === 'demo-p2' || (patientName && patientName.toLowerCase().includes('martin'))) {
            deletedDemo.push('demo-p2', 'jean martin');
        }
        if (patientId === 'demo-p3' || (patientName && patientName.toLowerCase().includes('leroy'))) {
            deletedDemo.push('demo-p3', 'sophie leroy');
        }

        const uniqueDeleted = Array.from(new Set(deletedDemo));
        localStorage.setItem('surgilink_deleted_demo_patients', JSON.stringify(uniqueDeleted));

        // 2. If it's a database patient record (not demo-p*), execute cascaded deletion across all child tables
        const isDemo = String(patientId).startsWith('demo-');
        if (!isDemo && patientId) {
            console.log(`[deletePatient] Cleaning up child table dependencies for patient ${patientId}...`);
            
            await Promise.allSettled([
                supabase.from('pathway_responses').delete().eq('patient_id', patientId),
                supabase.from('intake_form_responses').delete().eq('patient_id', patientId),
                supabase.from('patient_review_tokens').delete().eq('patient_id', patientId),
                supabase.from('medical_history').delete().eq('patient_id', patientId),
                supabase.from('sms_logs').delete().eq('patient_id', patientId),
                supabase.from('reminder_queue').delete().eq('patient_id', patientId),
                supabase.from('custom_questions').delete().eq('patient_id', patientId),
                supabase.from('patient_documents').delete().eq('patient_id', patientId),
                supabase.from('patient_tokens').delete().eq('patient_id', patientId)
            ]);

            const { error } = await supabase.from('patients').delete().eq('id', patientId);
            if (error) {
                console.warn('[deletePatient] Database warning when deleting patient row:', error);
                // Note: Soft deletion in localStorage has already succeeded, so the patient will be removed from view.
            }
        }

        // Notify subscribers of patient deletion
        window.dispatchEvent(new CustomEvent('surgilink_patient_deleted', { detail: { patientId, patientName } }));
        return true;
    } catch (err) {
        console.error('[deletePatient] Failed to delete patient:', err);
        // Even if an unexpected runtime error happens, dispatch the local delete event so UI refreshes
        window.dispatchEvent(new CustomEvent('surgilink_patient_deleted', { detail: { patientId, patientName } }));
        return true;
    }
};
