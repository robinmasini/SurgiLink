import { supabase } from '../lib/supabase';

/**
 * Document Service
 * Manages patient document uploads, storage, and persistence
 */

const BUCKET_NAME = 'patient-documents';

/**
 * Upload a document to storage and record in database
 * @param {number} patientId - Patient ID
 * @param {File} file - File object from input
 * @returns {Promise<Object>} - { success, data, error }
 */
export async function uploadDocument(patientId, file) {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${patientId}/${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = fileName;

        // 1. Upload file to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 2. Save metadata to database
        const { data, error: dbError } = await supabase
            .from('patient_documents')
            .insert({
                patient_id: patientId,
                name: file.name,
                storage_path: filePath,
                size: (file.size / 1024).toFixed(1) + ' KB',
                type: file.type,
                user_id: (await supabase.auth.getUser()).data.user?.id
            })
            .select()
            .single();

        if (dbError) throw dbError;

        return { success: true, data };
    } catch (error) {
        console.error('CRITICAL: Error uploading document to storage:', error);
        return {
            success: false,
            error: error.message || 'Erreur inconnue lors du transfert vers le stockage en ligne'
        };
    }
}

/**
 * Get all documents for a patient
 * @param {number} patientId - Patient ID
 * @returns {Promise<Array>} - List of documents
 */
export async function getDocuments(patientId) {
    try {
        const { data, error } = await supabase
            .from('patient_documents')
            .select('*')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching documents:', error);
        return [];
    }
}

/**
 * Delete a document from storage and database
 * @param {string} documentId - Database ID
 * @param {string} storagePath - Storage path
 * @returns {Promise<Object>} - { success, error }
 */
export async function deleteDocument(documentId, storagePath) {
    try {
        // 1. Delete from Storage
        const { error: storageError } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([storagePath]);

        if (storageError) throw storageError;

        // 2. Delete from Database
        const { error: dbError } = await supabase
            .from('patient_documents')
            .delete()
            .eq('id', documentId);

        if (dbError) throw dbError;

        return { success: true };
    } catch (error) {
        console.error('Error deleting document:', error);
        return { success: false, error: error.message };
    }
}
/**
 * Download a document from storage using a signed URL
 * @param {string} storagePath - Storage path
 * @param {string} fileName - File name for download
 * @returns {Promise<Object>} - { success, error }
 */
export async function downloadDocument(storagePath, fileName) {
    try {
        // Get a signed URL that's valid for 60 seconds
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .createSignedUrl(storagePath, 60);

        if (error) throw error;

        // On mobile, just open in new tab (download attribute is not well supported)
        // On desktop, try to force download
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
            // Open in new tab on mobile
            window.open(data.signedUrl, '_blank');
        } else {
            // Try to download on desktop
            const link = document.createElement('a');
            link.href = data.signedUrl;
            link.download = fileName;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        return { success: true };
    } catch (error) {
        console.error('Error downloading document:', error);
        return { success: false, error: error.message };
    }
}
