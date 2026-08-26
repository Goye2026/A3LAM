CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'external',
  storage_key TEXT NOT NULL,
  public_url TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  extension TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  alt_text TEXT NOT NULL DEFAULT '',
  source_url TEXT,
  attribution TEXT NOT NULL DEFAULT '',
  license TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'ready',
  visibility TEXT NOT NULL DEFAULT 'private',
  created_by TEXT REFERENCES admin_identities(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES admin_identities(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT media_assets_provider_not_blank CHECK (length(btrim(provider)) > 0),
  CONSTRAINT media_assets_storage_key_not_blank CHECK (length(btrim(storage_key)) > 0),
  CONSTRAINT media_assets_storage_key_safe CHECK (storage_key !~ '(^|/)\.\.(/|$)'),
  CONSTRAINT media_assets_public_url_check CHECK (public_url ~ '^https?://'),
  CONSTRAINT media_assets_original_name_not_blank CHECK (length(btrim(original_name)) > 0),
  CONSTRAINT media_assets_mime_type_check CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  CONSTRAINT media_assets_extension_check CHECK (extension IN ('jpg', 'jpeg', 'png', 'webp')),
  CONSTRAINT media_assets_size_check CHECK (size_bytes > 0),
  CONSTRAINT media_assets_dimensions_check CHECK ((width IS NULL AND height IS NULL) OR (width > 0 AND height > 0)),
  CONSTRAINT media_assets_source_url_check CHECK (source_url IS NULL OR source_url ~ '^https?://'),
  CONSTRAINT media_assets_status_check CHECK (status IN ('ready', 'archived')),
  CONSTRAINT media_assets_visibility_check CHECK (visibility IN ('private', 'public'))
);
CREATE UNIQUE INDEX IF NOT EXISTS media_assets_storage_key_unique ON media_assets (storage_key);
CREATE INDEX IF NOT EXISTS media_assets_status_visibility_idx ON media_assets (status, visibility);
CREATE INDEX IF NOT EXISTS media_assets_created_at_idx ON media_assets (created_at DESC);

CREATE TABLE IF NOT EXISTS person_media (
  person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  media_asset_id TEXT NOT NULL REFERENCES media_assets(id) ON DELETE RESTRICT,
  usage_type TEXT NOT NULL DEFAULT 'portrait',
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_by TEXT REFERENCES admin_identities(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (person_id, media_asset_id, usage_type),
  CONSTRAINT person_media_usage_type_check CHECK (usage_type IN ('portrait', 'secondary'))
);
CREATE UNIQUE INDEX IF NOT EXISTS person_media_primary_portrait_unique ON person_media (person_id) WHERE usage_type = 'portrait' AND is_primary = TRUE;
CREATE INDEX IF NOT EXISTS person_media_asset_idx ON person_media (media_asset_id);
CREATE INDEX IF NOT EXISTS person_media_person_idx ON person_media (person_id);
