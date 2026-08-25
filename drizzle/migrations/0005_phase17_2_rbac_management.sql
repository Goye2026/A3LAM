CREATE TABLE IF NOT EXISTS admin_permission_overrides (
  admin_id TEXT NOT NULL REFERENCES admin_identities(id) ON DELETE CASCADE,
  permission_code TEXT NOT NULL,
  effect TEXT NOT NULL,
  assigned_by TEXT REFERENCES admin_identities(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT admin_permission_overrides_effect_check CHECK (effect IN ('allow', 'deny')),
  CONSTRAINT admin_permission_overrides_code_check CHECK (permission_code IN (
    'users.read', 'users.manage', 'users.suspend', 'users.sessions.revoke',
    'sessions.read', 'sessions.revoke',
    'admins.read', 'admins.manage',
    'editors.read', 'editors.manage',
    'roles.read', 'roles.update',
    'permissions.read', 'permissions.assign',
    'people.read', 'people.create', 'people.update', 'people.delete', 'people.publish',
    'profiles.read', 'profiles.moderate', 'profiles.publish', 'profiles.unpublish',
    'categories.read', 'categories.create', 'categories.update', 'categories.delete',
    'homepage.read', 'homepage.update',
    'appearance.read', 'appearance.update',
    'media.read', 'media.manage',
    'seo.read', 'seo.update',
    'audit.read',
    'settings.read', 'settings.manage',
    'system.read'
  )),
  PRIMARY KEY (admin_id, permission_code)
);
CREATE INDEX IF NOT EXISTS admin_permission_overrides_permission_idx ON admin_permission_overrides (permission_code);
CREATE INDEX IF NOT EXISTS admin_permission_overrides_assigned_by_idx ON admin_permission_overrides (assigned_by);
