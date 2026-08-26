CREATE TABLE IF NOT EXISTS ai_documents (
  id TEXT PRIMARY KEY,
  original_filename TEXT NOT NULL,
  normalized_filename TEXT NOT NULL,
  document_type TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  checksum_sha256 TEXT NOT NULL,
  ingestion_status TEXT NOT NULL DEFAULT 'UPLOADED',
  extraction_status TEXT NOT NULL DEFAULT 'NOT_STARTED',
  processing_status TEXT NOT NULL DEFAULT 'QUEUED',
  owner_type TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  storage_key TEXT,
  retention_policy TEXT NOT NULL DEFAULT 'REQUIRES_CONFIGURATION',
  failure_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ai_documents_original_filename_not_blank CHECK (length(btrim(original_filename)) > 0),
  CONSTRAINT ai_documents_normalized_filename_not_blank CHECK (length(btrim(normalized_filename)) > 0),
  CONSTRAINT ai_documents_type_check CHECK (document_type IN ('pdf', 'docx', 'txt')),
  CONSTRAINT ai_documents_mime_check CHECK (mime_type IN ('application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain')),
  CONSTRAINT ai_documents_size_check CHECK (size_bytes > 0 AND size_bytes <= 10485760),
  CONSTRAINT ai_documents_checksum_check CHECK (checksum_sha256 ~ '^[a-f0-9]{64}$'),
  CONSTRAINT ai_documents_ingestion_status_check CHECK (ingestion_status IN ('UPLOADED', 'VALIDATING', 'EXTRACTING', 'EXTRACTED', 'NORMALIZING', 'READY_FOR_REVIEW', 'REVIEW_IN_PROGRESS', 'APPROVED', 'READY_FOR_GENERATION', 'REJECTED', 'EXTRACTION_FAILED', 'PROCESSING_FAILED', 'REVIEW_REJECTED', 'ARCHIVED')),
  CONSTRAINT ai_documents_extraction_status_check CHECK (extraction_status IN ('NOT_STARTED', 'IN_PROGRESS', 'SUCCEEDED', 'FAILED', 'UNAVAILABLE')),
  CONSTRAINT ai_documents_processing_status_check CHECK (processing_status IN ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED')),
  CONSTRAINT ai_documents_owner_type_check CHECK (owner_type IN ('ADMIN_IDENTITY', 'USER')),
  CONSTRAINT ai_documents_owner_id_not_blank CHECK (length(btrim(owner_id)) > 0),
  CONSTRAINT ai_documents_storage_key_safe CHECK (storage_key IS NULL OR storage_key !~ '(^|/)\.\.(/|$)'),
  CONSTRAINT ai_documents_retention_policy_check CHECK (retention_policy IN ('AVAILABLE', 'REQUIRES_CONFIGURATION')),
  CONSTRAINT ai_documents_failure_code_check CHECK (failure_code IS NULL OR failure_code IN ('VALIDATION_FAILED', 'UNSUPPORTED_FORMAT', 'MALFORMED_DOCUMENT', 'EXTRACTION_UNAVAILABLE', 'EXTRACTION_FAILED', 'PROCESSING_FAILED', 'REVIEW_REJECTED'))
);
CREATE UNIQUE INDEX IF NOT EXISTS ai_documents_owner_checksum_unique ON ai_documents (owner_type, owner_id, checksum_sha256);
CREATE INDEX IF NOT EXISTS ai_documents_status_idx ON ai_documents (ingestion_status, processing_status);
CREATE INDEX IF NOT EXISTS ai_documents_owner_idx ON ai_documents (owner_type, owner_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_processing_jobs (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES ai_documents(id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL,
  attempt INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'QUEUED',
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ai_processing_jobs_idempotency_not_blank CHECK (length(btrim(idempotency_key)) > 0),
  CONSTRAINT ai_processing_jobs_attempt_check CHECK (attempt >= 0 AND attempt <= 3),
  CONSTRAINT ai_processing_jobs_status_check CHECK (status IN ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED')),
  CONSTRAINT ai_processing_jobs_error_code_check CHECK (error_code IS NULL OR error_code IN ('VALIDATION_FAILED', 'UNSUPPORTED_FORMAT', 'MALFORMED_DOCUMENT', 'EXTRACTION_UNAVAILABLE', 'EXTRACTION_FAILED', 'PROCESSING_FAILED', 'REVIEW_REJECTED'))
);
CREATE UNIQUE INDEX IF NOT EXISTS ai_processing_jobs_idempotency_unique ON ai_processing_jobs (idempotency_key);
CREATE INDEX IF NOT EXISTS ai_processing_jobs_document_idx ON ai_processing_jobs (document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_processing_jobs_status_idx ON ai_processing_jobs (status, updated_at DESC);

CREATE TABLE IF NOT EXISTS ai_extracted_sources (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES ai_documents(id) ON DELETE CASCADE,
  normalized_text TEXT NOT NULL,
  text_sha256 TEXT NOT NULL,
  text_bytes INTEGER NOT NULL,
  extractor TEXT NOT NULL,
  extraction_status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ai_extracted_sources_text_not_blank CHECK (length(btrim(normalized_text)) > 0),
  CONSTRAINT ai_extracted_sources_text_size_check CHECK (text_bytes > 0 AND text_bytes <= 8388608),
  CONSTRAINT ai_extracted_sources_hash_check CHECK (text_sha256 ~ '^[a-f0-9]{64}$'),
  CONSTRAINT ai_extracted_sources_extractor_not_blank CHECK (length(btrim(extractor)) > 0),
  CONSTRAINT ai_extracted_sources_status_check CHECK (extraction_status IN ('NOT_STARTED', 'IN_PROGRESS', 'SUCCEEDED', 'FAILED', 'UNAVAILABLE'))
);
CREATE UNIQUE INDEX IF NOT EXISTS ai_extracted_sources_document_text_unique ON ai_extracted_sources (document_id, text_sha256);
CREATE INDEX IF NOT EXISTS ai_extracted_sources_document_idx ON ai_extracted_sources (document_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_extracted_facts (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES ai_extracted_sources(id) ON DELETE CASCADE,
  field_path TEXT NOT NULL,
  value JSONB NOT NULL,
  confidence TEXT NOT NULL,
  classification TEXT NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'UNREVIEWED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ai_extracted_facts_field_path_not_blank CHECK (length(btrim(field_path)) > 0),
  CONSTRAINT ai_extracted_facts_confidence_check CHECK (confidence IN ('high', 'medium', 'low', 'unknown')),
  CONSTRAINT ai_extracted_facts_classification_check CHECK (classification IN ('EXTRACTED', 'USER_PROVIDED', 'EDITOR_VERIFIED', 'AI_INFERRED', 'NEEDS_VERIFICATION')),
  CONSTRAINT ai_extracted_facts_review_status_check CHECK (review_status IN ('UNREVIEWED', 'ACCEPTED', 'EDITED', 'REJECTED'))
);
CREATE INDEX IF NOT EXISTS ai_extracted_facts_source_idx ON ai_extracted_facts (source_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_extracted_facts_review_idx ON ai_extracted_facts (review_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS ai_fact_evidence (
  id TEXT PRIMARY KEY,
  fact_id TEXT NOT NULL REFERENCES ai_extracted_facts(id) ON DELETE CASCADE,
  page INTEGER,
  section TEXT,
  excerpt TEXT NOT NULL,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ai_fact_evidence_page_check CHECK (page IS NULL OR page > 0),
  CONSTRAINT ai_fact_evidence_excerpt_check CHECK (length(btrim(excerpt)) > 0 AND length(excerpt) <= 500),
  CONSTRAINT ai_fact_evidence_url_check CHECK (source_url IS NULL OR source_url ~ '^https?://')
);
CREATE INDEX IF NOT EXISTS ai_fact_evidence_fact_idx ON ai_fact_evidence (fact_id);

CREATE TABLE IF NOT EXISTS ai_review_decisions (
  id TEXT PRIMARY KEY,
  fact_id TEXT NOT NULL REFERENCES ai_extracted_facts(id) ON DELETE CASCADE,
  reviewer_id TEXT REFERENCES admin_identities(id) ON DELETE SET NULL,
  decision TEXT NOT NULL,
  original_value JSONB NOT NULL,
  reviewed_value JSONB,
  reviewer_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ai_review_decisions_decision_check CHECK (decision IN ('UNREVIEWED', 'ACCEPTED', 'EDITED', 'REJECTED')),
  CONSTRAINT ai_review_decisions_note_size_check CHECK (reviewer_note IS NULL OR length(reviewer_note) <= 2000)
);
CREATE INDEX IF NOT EXISTS ai_review_decisions_fact_idx ON ai_review_decisions (fact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_review_decisions_reviewer_idx ON ai_review_decisions (reviewer_id, created_at DESC);

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
    'ai.documents.read', 'ai.documents.create', 'ai.review'
  ));
