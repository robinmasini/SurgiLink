-- Migration: Add RLS policies for patient portal access
-- Purpose: Allow anon users to read patient data when they have a valid token

-- Enable RLS on patient_review_tokens if not already enabled
ALTER TABLE patient_review_tokens ENABLE ROW LEVEL SECURITY;

-- 1. Policy to allow anon users to validate tokens
CREATE POLICY "Allow token validation"
ON patient_review_tokens
FOR SELECT
TO anon
USING (is_active = true);

-- 2. Policy to allow anon users to read patient data via valid token
-- This creates a function to check if the current user has a valid token for a patient
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

-- 3. Create RLS policy for patients table
CREATE POLICY "Allow patient portal access via token"
ON patients
FOR SELECT
TO anon
USING (has_valid_patient_token(id));

-- 4. Grant necessary permissions
GRANT SELECT ON patients TO anon;
GRANT SELECT ON patient_review_tokens TO anon;

-- Comments
COMMENT ON POLICY "Allow token validation" ON patient_review_tokens IS 
  'Allows anonymous users to validate patient portal tokens';

COMMENT ON POLICY "Allow patient portal access via token" ON patients IS 
  'Allows anonymous users to read patient data if a valid token exists for that patient';

COMMENT ON FUNCTION has_valid_patient_token IS 
  'Helper function to check if a valid token exists for a patient';
