-- Migration: Fix RLS Policies for Patient & Child Table Deletion
-- Allows authenticated users to delete patients and all associated child records

-- 1. Patients Table DELETE Policy
DROP POLICY IF EXISTS "Users can delete their patients" ON public.patients;
DROP POLICY IF EXISTS "Allow authenticated users to delete patients" ON public.patients;

CREATE POLICY "Allow authenticated users to delete patients"
ON public.patients
FOR DELETE
TO authenticated
USING (true);

-- 2. Child Tables DELETE Policies
DROP POLICY IF EXISTS "Allow authenticated users to delete pathway_responses" ON public.pathway_responses;
CREATE POLICY "Allow authenticated users to delete pathway_responses"
ON public.pathway_responses FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete intake_form_responses" ON public.intake_form_responses;
CREATE POLICY "Allow authenticated users to delete intake_form_responses"
ON public.intake_form_responses FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete patient_review_tokens" ON public.patient_review_tokens;
CREATE POLICY "Allow authenticated users to delete patient_review_tokens"
ON public.patient_review_tokens FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete medical_history" ON public.medical_history;
CREATE POLICY "Allow authenticated users to delete medical_history"
ON public.medical_history FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete sms_logs" ON public.sms_logs;
CREATE POLICY "Allow authenticated users to delete sms_logs"
ON public.sms_logs FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete reminder_queue" ON public.reminder_queue;
CREATE POLICY "Allow authenticated users to delete reminder_queue"
ON public.reminder_queue FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete custom_questions" ON public.custom_questions;
CREATE POLICY "Allow authenticated users to delete custom_questions"
ON public.custom_questions FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete patient_documents" ON public.patient_documents;
CREATE POLICY "Allow authenticated users to delete patient_documents"
ON public.patient_documents FOR DELETE TO authenticated USING (true);
