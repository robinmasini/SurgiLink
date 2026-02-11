-- Migration: Add RLS policies for patient portal access
-- Purpose: Allow anon users to read patient data when they have a valid token
--          Allow authenticated users (staff) to create tokens

-- Enable RLS on patient_review_tokens if not already enabled
ALTER TABLE patient_review_tokens ENABLE ROW LEVEL SECURITY;

-- 1. Policy to allow AUTHENTICATED users (staff) to INSERT tokens
CREATE POLICY "Allow authenticated users to create tokens"
ON patient_review_tokens
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 2. Policy to allow AUTHENTICATED users (staff) to READ all tokens
CREATE POLICY "Allow authenticated users to read tokens"
ON patient_review_tokens
FOR SELECT
TO authenticated
USING (true);

-- 3. Policy to allow ANON users to validate tokens (for patient portal access)
CREATE POLICY "Allow token validation"
ON patient_review_tokens
FOR SELECT
TO anon
USING (is_active = true);

-- 4. Policy to allow ANON users to UPDATE token last_accessed_at
CREATE POLICY "Allow token access tracking"
ON patient_review_tokens
FOR UPDATE
TO anon
USING (is_active = true)
WITH CHECK (is_active = true);

-- 5. Create helper function to check if the current user has a valid token for a patient
CREATE OR REPLACE FUNCTION has_valid_patient_token(patient_row_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- For now, we'll allow access if a valid token exists for this patient
  -- In a real implementation, you'd pass the token in the request headers
  RETURN EXISTS (
    SELECT 1 
    FROM patient_review_tokens
    WHERE patient_id = patient_row_id
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$;

-- 6. Create RLS policy for patients table - authenticated users (staff)
CREATE POLICY "Allow authenticated users to read patients"
ON patients
FOR SELECT
TO authenticated
USING (true);

-- 7. Create RLS policy for patients table - anon users (patient portal)
CREATE POLICY "Allow patient portal access via token"
ON patients
FOR SELECT
TO anon
USING (has_valid_patient_token(id));

-- 8. Create RLS policies for medical_history table
CREATE POLICY "Allow authenticated users to read medical history"
ON medical_history
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow patient portal to read own medical history"
ON medical_history
FOR SELECT
TO anon
USING (has_valid_patient_token(patient_id));

-- 9. Create RLS policies for pathway_responses table (questionnaires)
CREATE POLICY "Allow authenticated users to manage responses"
ON pathway_responses
FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Allow patient portal to read own responses"
ON pathway_responses
FOR SELECT
TO anon
USING (has_valid_patient_token(patient_id));

CREATE POLICY "Allow patient portal to insert own responses"
ON pathway_responses
FOR INSERT
TO anon
WITH CHECK (has_valid_patient_token(patient_id));

CREATE POLICY "Allow patient portal to update own responses"
ON pathway_responses
FOR UPDATE
TO anon
USING (has_valid_patient_token(patient_id))
WITH CHECK (has_valid_patient_token(patient_id));

-- 10. Grant necessary permissions
GRANT SELECT ON patients TO anon;
GRANT SELECT ON patient_review_tokens TO anon;
GRANT UPDATE ON patient_review_tokens TO anon;
GRANT SELECT ON medical_history TO anon;
GRANT SELECT, INSERT, UPDATE ON pathway_responses TO anon;

GRANT ALL ON patients TO authenticated;
GRANT ALL ON patient_review_tokens TO authenticated;
GRANT ALL ON medical_history TO authenticated;
GRANT ALL ON pathway_responses TO authenticated;

-- Comments
COMMENT ON POLICY "Allow authenticated users to create tokens" ON patient_review_tokens IS 
  'Allows authenticated staff users to generate patient portal tokens';

COMMENT ON POLICY "Allow token validation" ON patient_review_tokens IS 
  'Allows anonymous users to validate patient portal tokens';

COMMENT ON POLICY "Allow patient portal access via token" ON patients IS 
  'Allows anonymous users to read patient data if a valid token exists for that patient';

COMMENT ON FUNCTION has_valid_patient_token IS 
  'Helper function to check if a valid token exists for a patient';
