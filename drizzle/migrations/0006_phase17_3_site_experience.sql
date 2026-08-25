-- A3LAM Phase 17.3: typed site experience configuration foundation.
-- CREATED / NOT APPLIED. Production application requires separate explicit approval.

CREATE TABLE IF NOT EXISTS site_experience_configs (
  resource TEXT PRIMARY KEY,
  draft JSONB NOT NULL,
  published JSONB NOT NULL,
  updated_by TEXT REFERENCES admin_identities(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_by TEXT REFERENCES admin_identities(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  CONSTRAINT site_experience_resource_check CHECK (resource IN (
    'settings', 'identity', 'appearance', 'homepage', 'navigation', 'footer', 'seo', 'profile_presentation'
  ))
);

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
    'system.read', 'system.migrations.execute'
  ));

CREATE INDEX IF NOT EXISTS site_experience_configs_updated_idx
  ON site_experience_configs (updated_at DESC);
