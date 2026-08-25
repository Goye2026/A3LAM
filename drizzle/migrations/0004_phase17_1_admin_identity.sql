ALTER TABLE user_accounts
  ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS admin_identities (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  email_normalized TEXT NOT NULL,
  display_name TEXT NOT NULL,
  password_hash TEXT,
  status TEXT NOT NULL DEFAULT 'invited',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_signed_in TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  CONSTRAINT admin_identities_status_check CHECK (status IN ('invited', 'active', 'disabled')),
  CONSTRAINT admin_identities_email_not_blank CHECK (length(btrim(email)) > 0),
  CONSTRAINT admin_identities_email_normalized_not_blank CHECK (length(btrim(email_normalized)) > 0),
  CONSTRAINT admin_identities_display_name_not_blank CHECK (length(btrim(display_name)) > 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS admin_identities_email_unique ON admin_identities (email_normalized);
CREATE INDEX IF NOT EXISTS admin_identities_status_idx ON admin_identities (status);

CREATE TABLE IF NOT EXISTS admin_roles (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  CONSTRAINT admin_roles_code_check CHECK (code IN ('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'MODERATOR'))
);

CREATE TABLE IF NOT EXISTS admin_permissions (
  code TEXT PRIMARY KEY,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_role_permissions (
  role_code TEXT NOT NULL REFERENCES admin_roles(code) ON DELETE CASCADE,
  permission_code TEXT NOT NULL REFERENCES admin_permissions(code) ON DELETE CASCADE,
  PRIMARY KEY (role_code, permission_code)
);

CREATE TABLE IF NOT EXISTS admin_role_assignments (
  admin_id TEXT NOT NULL REFERENCES admin_identities(id) ON DELETE CASCADE,
  role_code TEXT NOT NULL,
  assigned_by TEXT REFERENCES admin_identities(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT admin_role_assignments_role_check CHECK (role_code IN ('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'MODERATOR')),
  PRIMARY KEY (admin_id)
);
CREATE INDEX IF NOT EXISTS admin_role_assignments_role_idx ON admin_role_assignments (role_code);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL REFERENCES admin_identities(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT,
  CONSTRAINT admin_sessions_token_hash_check CHECK (token_hash ~ '^[0-9a-f]{64}$')
);
CREATE UNIQUE INDEX IF NOT EXISTS admin_sessions_token_unique ON admin_sessions (token_hash);
CREATE INDEX IF NOT EXISTS admin_sessions_admin_idx ON admin_sessions (admin_id);
CREATE INDEX IF NOT EXISTS admin_sessions_expiry_idx ON admin_sessions (expires_at);
