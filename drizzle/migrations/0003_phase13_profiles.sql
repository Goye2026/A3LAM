CREATE TABLE IF NOT EXISTS user_accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  email_normalized TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_signed_in TIMESTAMPTZ,
  CONSTRAINT user_accounts_role_check CHECK (role IN ('user', 'admin')),
  CONSTRAINT user_accounts_email_not_blank CHECK (length(btrim(email)) > 0),
  CONSTRAINT user_accounts_email_normalized_not_blank CHECK (length(btrim(email_normalized)) > 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS user_accounts_email_unique ON user_accounts (email_normalized);

CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS user_sessions_token_unique ON user_sessions (token_hash);
CREATE INDEX IF NOT EXISTS user_sessions_user_idx ON user_sessions (user_id);
CREATE INDEX IF NOT EXISTS user_sessions_expiry_idx ON user_sessions (expires_at);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  name_arabic TEXT NOT NULL,
  professional_title TEXT NOT NULL DEFAULT '',
  professional_summary TEXT NOT NULL DEFAULT '',
  biography TEXT NOT NULL DEFAULT '',
  city TEXT,
  country TEXT,
  contact_email TEXT,
  phone TEXT,
  email_public BOOLEAN NOT NULL DEFAULT FALSE,
  phone_public BOOLEAN NOT NULL DEFAULT FALSE,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  visibility TEXT NOT NULL DEFAULT 'private',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT profiles_status_check CHECK (status IN ('draft', 'pending_review', 'published', 'archived')),
  CONSTRAINT profiles_visibility_check CHECK (visibility IN ('private', 'unlisted', 'published')),
  CONSTRAINT profiles_name_not_blank CHECK (length(btrim(name)) > 0),
  CONSTRAINT profiles_name_arabic_not_blank CHECK (length(btrim(name_arabic)) > 0),
  CONSTRAINT profiles_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_unique ON profiles (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS profiles_slug_unique ON profiles (slug);
CREATE INDEX IF NOT EXISTS profiles_status_visibility_idx ON profiles (status, visibility);

CREATE TABLE IF NOT EXISTS profile_categories (
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  PRIMARY KEY (profile_id, category_id)
);
CREATE TABLE IF NOT EXISTS profile_source_records (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  publisher TEXT NOT NULL,
  url TEXT NOT NULL,
  source_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT profile_source_records_type_check CHECK (source_type IN ('official', 'institution', 'government', 'media', 'professional', 'academic', 'secondary')),
  CONSTRAINT profile_source_records_status_check CHECK (status IN ('draft', 'review', 'published', 'archived')),
  CONSTRAINT profile_source_records_url_check CHECK (url ~ '^https?://')
);
CREATE UNIQUE INDEX IF NOT EXISTS profile_source_records_profile_unique ON profile_source_records (profile_id);
CREATE INDEX IF NOT EXISTS profile_source_records_profile_idx ON profile_source_records (profile_id);

CREATE TABLE IF NOT EXISTS profile_experiences (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  organization TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS profile_experiences_profile_idx ON profile_experiences (profile_id);

CREATE TABLE IF NOT EXISTS profile_educations (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  institution TEXT NOT NULL,
  degree TEXT NOT NULL DEFAULT '',
  field TEXT NOT NULL DEFAULT '',
  start_date DATE,
  end_date DATE,
  description TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS profile_educations_profile_idx ON profile_educations (profile_id);

CREATE TABLE IF NOT EXISTS profile_skills (
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  skill_normalized TEXT NOT NULL,
  PRIMARY KEY (profile_id, skill)
);
CREATE INDEX IF NOT EXISTS profile_skills_normalized_idx ON profile_skills (skill_normalized);

CREATE TABLE IF NOT EXISTS profile_certifications (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  obtained_date DATE,
  verification_url TEXT
);
CREATE INDEX IF NOT EXISTS profile_certifications_profile_idx ON profile_certifications (profile_id);

CREATE TABLE IF NOT EXISTS profile_languages (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  proficiency TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS profile_languages_profile_idx ON profile_languages (profile_id);

CREATE TABLE IF NOT EXISTS profile_portfolio_items (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  url TEXT,
  cover_url TEXT,
  work_type TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS profile_portfolio_profile_idx ON profile_portfolio_items (profile_id);

CREATE TABLE IF NOT EXISTS profile_social_links (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  url TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS profile_social_platform_unique ON profile_social_links (profile_id, platform);
CREATE INDEX IF NOT EXISTS profile_social_profile_idx ON profile_social_links (profile_id);

CREATE TABLE IF NOT EXISTS profile_files (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL,
  url TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  extension TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS profile_files_storage_key_unique ON profile_files (storage_key);
CREATE INDEX IF NOT EXISTS profile_files_profile_idx ON profile_files (profile_id);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_type TEXT NOT NULL,
  actor_id TEXT,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  field TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  action TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs (entity_type, entity_id, created_at);
CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON audit_logs (actor_type, actor_id, created_at);
