CREATE TABLE IF NOT EXISTS ai_generation_jobs (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES ai_documents(id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL,
  mode TEXT NOT NULL,
  output_language TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'QUEUED',
  provider_id TEXT,
  model_id TEXT,
  attempt INTEGER NOT NULL DEFAULT 0,
  quality_gate TEXT NOT NULL DEFAULT 'PENDING',
  error_code TEXT,
  output_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ai_generation_jobs_idempotency_not_blank CHECK (length(btrim(idempotency_key)) > 0),
  CONSTRAINT ai_generation_jobs_mode_check CHECK (mode IN ('PROFESSIONAL_CV', 'PROFESSIONAL_PROFILE', 'A3LAM_PERSON_DRAFT', 'BIOGRAPHY', 'SEO_DRAFT')),
  CONSTRAINT ai_generation_jobs_language_check CHECK (output_language IN ('ARABIC', 'ENGLISH', 'BILINGUAL', 'SOURCE_LANGUAGE')),
  CONSTRAINT ai_generation_jobs_status_check CHECK (status IN ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REQUIRES_CONFIGURATION')),
  CONSTRAINT ai_generation_jobs_attempt_check CHECK (attempt >= 0 AND attempt <= 3),
  CONSTRAINT ai_generation_jobs_quality_gate_check CHECK (quality_gate IN ('PENDING', 'PASS', 'PASS_WITH_REVIEW', 'REJECTED')),
  CONSTRAINT ai_generation_jobs_error_check CHECK (error_code IS NULL OR error_code IN ('PROVIDER_NOT_CONFIGURED', 'PROVIDER_TIMEOUT', 'PROVIDER_RATE_LIMITED', 'PROVIDER_UNAVAILABLE', 'INVALID_OUTPUT', 'VALIDATION_FAILED', 'SOURCE_CONFLICT', 'REVIEW_REQUIRED', 'PRIVACY_BLOCKED', 'PAYLOAD_TOO_LARGE', 'UNSUPPORTED_LANGUAGE')),
  CONSTRAINT ai_generation_jobs_output_size_check CHECK (output_json IS NULL OR octet_length(output_json::text) <= 500000)
);
CREATE UNIQUE INDEX IF NOT EXISTS ai_generation_jobs_idempotency_unique ON ai_generation_jobs (idempotency_key);
CREATE INDEX IF NOT EXISTS ai_generation_jobs_document_idx ON ai_generation_jobs (document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_generation_jobs_status_idx ON ai_generation_jobs (status, updated_at DESC);

CREATE TABLE IF NOT EXISTS ai_generation_attempts (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES ai_generation_jobs(id) ON DELETE CASCADE,
  attempt INTEGER NOT NULL,
  status TEXT NOT NULL,
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ai_generation_attempts_number_check CHECK (attempt >= 1 AND attempt <= 3),
  CONSTRAINT ai_generation_attempts_status_check CHECK (status IN ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REQUIRES_CONFIGURATION')),
  CONSTRAINT ai_generation_attempts_error_check CHECK (error_code IS NULL OR error_code IN ('PROVIDER_NOT_CONFIGURED', 'PROVIDER_TIMEOUT', 'PROVIDER_RATE_LIMITED', 'PROVIDER_UNAVAILABLE', 'INVALID_OUTPUT', 'VALIDATION_FAILED', 'SOURCE_CONFLICT', 'REVIEW_REQUIRED', 'PRIVACY_BLOCKED', 'PAYLOAD_TOO_LARGE', 'UNSUPPORTED_LANGUAGE')),
  CONSTRAINT ai_generation_attempts_job_attempt_unique UNIQUE (job_id, attempt)
);
CREATE INDEX IF NOT EXISTS ai_generation_attempts_job_idx ON ai_generation_attempts (job_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_generation_claims (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES ai_generation_jobs(id) ON DELETE CASCADE,
  field_path TEXT NOT NULL,
  value JSONB,
  source_fact_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  evidence_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence TEXT NOT NULL,
  classification TEXT NOT NULL,
  claim_status TEXT NOT NULL,
  provenance JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ai_generation_claims_field_path_not_blank CHECK (length(btrim(field_path)) > 0),
  CONSTRAINT ai_generation_claims_confidence_check CHECK (confidence IN ('high', 'medium', 'low', 'unknown')),
  CONSTRAINT ai_generation_claims_classification_check CHECK (classification IN ('EXTRACTED', 'USER_PROVIDED', 'EDITOR_VERIFIED', 'AI_INFERRED', 'NEEDS_VERIFICATION')),
  CONSTRAINT ai_generation_claims_status_check CHECK (claim_status IN ('VERIFIED', 'NEEDS_VERIFICATION', 'INFERRED', 'MISSING', 'CONFLICTED', 'REJECTED')),
  CONSTRAINT ai_generation_claims_source_ids_array_check CHECK (jsonb_typeof(source_fact_ids) = 'array'),
  CONSTRAINT ai_generation_claims_evidence_ids_array_check CHECK (jsonb_typeof(evidence_ids) = 'array'),
  CONSTRAINT ai_generation_claims_provenance_array_check CHECK (jsonb_typeof(provenance) = 'array'),
  CONSTRAINT ai_generation_claims_value_size_check CHECK (value IS NULL OR octet_length(value::text) <= 100000)
);
CREATE INDEX IF NOT EXISTS ai_generation_claims_job_idx ON ai_generation_claims (job_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_generation_claims_status_idx ON ai_generation_claims (claim_status, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_generation_review_decisions (
  id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL REFERENCES ai_generation_claims(id) ON DELETE CASCADE,
  reviewer_id TEXT REFERENCES admin_identities(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  original_value JSONB,
  reviewed_value JSONB,
  reviewer_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ai_generation_review_action_check CHECK (action IN ('ACCEPT', 'EDIT', 'REJECT', 'REQUEST_SOURCE')),
  CONSTRAINT ai_generation_review_note_size_check CHECK (reviewer_note IS NULL OR length(reviewer_note) <= 2000),
  CONSTRAINT ai_generation_review_value_size_check CHECK (reviewed_value IS NULL OR octet_length(reviewed_value::text) <= 100000)
);
CREATE INDEX IF NOT EXISTS ai_generation_review_claim_idx ON ai_generation_review_decisions (claim_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_generation_review_reviewer_idx ON ai_generation_review_decisions (reviewer_id, created_at DESC);

ALTER TABLE admin_permission_overrides
  DROP CONSTRAINT IF EXISTS admin_permission_overrides_code_check;

ALTER TABLE admin_permission_overrides
  ADD CONSTRAINT admin_permission_overrides_code_check CHECK (permission_code IN (
    'users.read', 'users.manage', 'users.suspend', 'users.sessions.revoke',
    'sessions.read', 'sessions.revoke',
    'admins.read', 'admins.manage',
    'editors.read', 'editors.manage',
    'roles.read', 'roles.update',
    'permissions.read', 'permissions.assign',
    'people.read', 'people.create', 'people.update', 'people.delete', 'people.publish',
    'profiles.read', 'profiles.moderate', 'profiles.publish', 'profiles.unpublish',
    'categories.read', 'categories.create', 'categories.update', 'categories.delete',
    'homepage.read', 'homepage.update', 'homepage.publish',
    'appearance.read', 'appearance.update',
    'navigation.read', 'navigation.update',
    'footer.read', 'footer.update',
    'profile_presentation.read', 'profile_presentation.update',
    'media.read', 'media.manage',
    'seo.read', 'seo.update',
    'audit.read',
    'settings.read', 'settings.manage',
    'system.read', 'system.migrations.execute',
    'ai.documents.read', 'ai.documents.create', 'ai.generation.create', 'ai.review'
  ));
