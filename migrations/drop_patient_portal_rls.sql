-- Migration de nettoyage : Suppression des anciennes politiques RLS
-- Exécutez ceci AVANT d'exécuter add_patient_portal_rls.sql si vous avez des erreurs "policy already exists"

-- Supprimer les anciennes politiques sur patient_review_tokens
DROP POLICY IF EXISTS "Allow authenticated users to create tokens" ON patient_review_tokens;
DROP POLICY IF EXISTS "Allow authenticated users to read tokens" ON patient_review_tokens;
DROP POLICY IF EXISTS "Allow token validation" ON patient_review_tokens;
DROP POLICY IF EXISTS "Allow token access tracking" ON patient_review_tokens;

-- Supprimer les anciennes politiques sur patients
DROP POLICY IF EXISTS "Allow authenticated users to read patients" ON patients;
DROP POLICY IF EXISTS "Allow patient portal access via token" ON patients;

-- Supprimer les anciennes politiques sur medical_history
DROP POLICY IF EXISTS "Allow authenticated users to read medical history" ON medical_history;
DROP POLICY IF EXISTS "Allow patient portal to read own medical history" ON medical_history;

-- Supprimer les anciennes politiques sur pathway_responses
DROP POLICY IF EXISTS "Allow authenticated users to manage responses" ON pathway_responses;
DROP POLICY IF EXISTS "Allow patient portal to read own responses" ON pathway_responses;
DROP POLICY IF EXISTS "Allow patient portal to insert own responses" ON pathway_responses;
DROP POLICY IF EXISTS "Allow patient portal to update own responses" ON pathway_responses;

-- Supprimer la fonction helper
DROP FUNCTION IF EXISTS has_valid_patient_token(bigint);

-- Note: RLS reste activé sur les tables
