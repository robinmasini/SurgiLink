-- Migration: Create patient_review_tokens table
-- Purpose: Store unique tokens for patient portal access

CREATE TABLE IF NOT EXISTS patient_review_tokens (
  id BIGSERIAL PRIMARY KEY,
  patient_id BIGINT REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  last_accessed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_patient_tokens_token ON patient_review_tokens(token);
CREATE INDEX IF NOT EXISTS idx_patient_tokens_patient_id ON patient_review_tokens(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_tokens_active ON patient_review_tokens(is_active) WHERE is_active = TRUE;

-- Comments for documentation
COMMENT ON TABLE patient_review_tokens IS 'Secure tokens for patient portal access without authentication';
COMMENT ON COLUMN patient_review_tokens.token IS 'Unique cryptographic token (32+ characters)';
COMMENT ON COLUMN patient_review_tokens.expires_at IS 'Optional expiration date for the token';
COMMENT ON COLUMN patient_review_tokens.is_active IS 'False if token has been manually revoked';
COMMENT ON COLUMN patient_review_tokens.last_accessed_at IS 'Last time this token was used to access the portal';
