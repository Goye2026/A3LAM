-- PHASE 17.19.30 — PROPOSED ISOLATED-ONLY MIGRATION
-- REVIEW ARTIFACT ONLY. DO NOT APPLY TO PRODUCTION.
-- Raw reset/invitation tokens must never be persisted.

BEGIN;

CREATE TABLE IF NOT EXISTS user_password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_password_reset_tokens_hash_not_blank CHECK (length(btrim(token_hash)) > 0),
  CONSTRAINT user_password_reset_tokens_expiry_after_creation CHECK (expires_at > created_at),
  CONSTRAINT user_password_reset_tokens_used_revoked_exclusive CHECK (NOT (used_at IS NOT NULL AND revoked_at IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS user_password_reset_tokens_hash_unique
  ON user_password_reset_tokens (token_hash);
CREATE INDEX IF NOT EXISTS user_password_reset_tokens_user_idx
  ON user_password_reset_tokens (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS user_password_reset_tokens_expiry_idx
  ON user_password_reset_tokens (expires_at);

CREATE TABLE IF NOT EXISTS admin_invitations (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL REFERENCES admin_identities(id) ON DELETE CASCADE,
  role_code TEXT NOT NULL REFERENCES admin_roles(code) ON DELETE RESTRICT,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_by TEXT REFERENCES admin_identities(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT admin_invitations_hash_not_blank CHECK (length(btrim(token_hash)) > 0),
  CONSTRAINT admin_invitations_expiry_after_creation CHECK (expires_at > created_at),
  CONSTRAINT admin_invitations_used_revoked_exclusive CHECK (NOT (used_at IS NOT NULL AND revoked_at IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS admin_invitations_hash_unique
  ON admin_invitations (token_hash);
CREATE INDEX IF NOT EXISTS admin_invitations_admin_idx
  ON admin_invitations (admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_invitations_expiry_idx
  ON admin_invitations (expires_at);
CREATE INDEX IF NOT EXISTS admin_invitations_active_idx
  ON admin_invitations (admin_id, expires_at)
  WHERE used_at IS NULL AND revoked_at IS NULL;

COMMIT;

-- Required application transaction semantics, not encoded by this DDL:
-- 1. SELECT ... FOR UPDATE by token_hash.
-- 2. Reject when used_at/revoked_at is non-null or expires_at <= NOW().
-- 3. Update the password/credential and mark used_at in the same transaction.
-- 4. Revoke relevant sessions in that same transaction.
-- 5. Never return or log token_hash/raw token.
-- 6. Invitation role must come from role_code stored here, never from client input.
