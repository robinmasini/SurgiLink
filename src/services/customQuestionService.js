import { supabase } from '../lib/supabase';

/**
 * Custom Question Service
 * Manages one-off clinical questions for patients
 */

/**
 * Create a new custom question for a patient
 */
export async function addCustomQuestion(patientId, questionText, screen = null) {
    try {
        const { data, error } = await supabase
            .from('custom_questions')
            .insert([{
                patient_id: patientId,
                question_text: questionText,
                screen: screen
            }])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error adding custom question:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all custom questions for a patient
 */
export async function getCustomQuestions(patientId) {
    try {
        const { data, error } = await supabase
            .from('custom_questions')
            .select('*')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching custom questions:', error);
        return [];
    }
}

/**
 * Save response to a custom question (used by patient portal)
 */
export async function answerCustomQuestion(questionId, response) {
    try {
        const { data, error } = await supabase
            .from('custom_questions')
            .update({
                response: response,
                answered_at: new Date().toISOString()
            })
            .eq('id', questionId)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error answering custom question:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete a custom question
 */
export async function deleteCustomQuestion(questionId) {
    try {
        const { error } = await supabase
            .from('custom_questions')
            .delete()
            .eq('id', questionId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error deleting custom question:', error);
        return { success: false, error: error.message };
    }
}
