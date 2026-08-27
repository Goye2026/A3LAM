CREATE TABLE IF NOT EXISTS cms_pages (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  content JSONB NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  author_id TEXT REFERENCES admin_identities(id) ON DELETE SET NULL,
  featured_media_id TEXT REFERENCES media_assets(id) ON DELETE RESTRICT,
  template TEXT NOT NULL DEFAULT 'single-page',
  seo_title TEXT NOT NULL DEFAULT '',
  seo_description TEXT NOT NULL DEFAULT '',
  canonical_url TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  CONSTRAINT cms_pages_title_not_blank CHECK (length(btrim(title)) > 0),
  CONSTRAINT cms_pages_slug_not_blank CHECK (length(btrim(slug)) > 0),
  CONSTRAINT cms_pages_status_check CHECK (status IN ('draft', 'review', 'scheduled', 'published', 'trashed')),
  CONSTRAINT cms_pages_template_check CHECK (template = 'single-page'),
  CONSTRAINT cms_pages_content_size_check CHECK (octet_length(content::text) <= 1000000),
  CONSTRAINT cms_pages_version_check CHECK (version >= 1),
  CONSTRAINT cms_pages_published_at_check CHECK (status <> 'published' OR published_at IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS cms_pages_slug_unique ON cms_pages (slug);
CREATE INDEX IF NOT EXISTS cms_pages_status_idx ON cms_pages (status, updated_at DESC);
CREATE INDEX IF NOT EXISTS cms_pages_author_idx ON cms_pages (author_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS cms_posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  content JSONB NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  author_id TEXT REFERENCES admin_identities(id) ON DELETE SET NULL,
  featured_media_id TEXT REFERENCES media_assets(id) ON DELETE RESTRICT,
  template TEXT NOT NULL DEFAULT 'single-post',
  seo_title TEXT NOT NULL DEFAULT '',
  seo_description TEXT NOT NULL DEFAULT '',
  canonical_url TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  CONSTRAINT cms_posts_title_not_blank CHECK (length(btrim(title)) > 0),
  CONSTRAINT cms_posts_slug_not_blank CHECK (length(btrim(slug)) > 0),
  CONSTRAINT cms_posts_status_check CHECK (status IN ('draft', 'review', 'scheduled', 'published', 'trashed')),
  CONSTRAINT cms_posts_template_check CHECK (template = 'single-post'),
  CONSTRAINT cms_posts_content_size_check CHECK (octet_length(content::text) <= 1000000),
  CONSTRAINT cms_posts_version_check CHECK (version >= 1),
  CONSTRAINT cms_posts_published_at_check CHECK (status <> 'published' OR published_at IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS cms_posts_slug_unique ON cms_posts (slug);
CREATE INDEX IF NOT EXISTS cms_posts_status_idx ON cms_posts (status, updated_at DESC);
CREATE INDEX IF NOT EXISTS cms_posts_author_idx ON cms_posts (author_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS cms_tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT cms_tags_name_not_blank CHECK (length(btrim(name)) > 0),
  CONSTRAINT cms_tags_slug_not_blank CHECK (length(btrim(slug)) > 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS cms_tags_name_unique ON cms_tags (name);
CREATE UNIQUE INDEX IF NOT EXISTS cms_tags_slug_unique ON cms_tags (slug);

CREATE TABLE IF NOT EXISTS cms_post_categories (
  post_id TEXT NOT NULL REFERENCES cms_posts(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  PRIMARY KEY (post_id, category_id)
);
CREATE INDEX IF NOT EXISTS cms_post_categories_category_idx ON cms_post_categories (category_id);

CREATE TABLE IF NOT EXISTS cms_post_tags (
  post_id TEXT NOT NULL REFERENCES cms_posts(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES cms_tags(id) ON DELETE RESTRICT,
  PRIMARY KEY (post_id, tag_id)
);
CREATE INDEX IF NOT EXISTS cms_post_tags_tag_idx ON cms_post_tags (tag_id);

CREATE TABLE IF NOT EXISTS cms_content_revisions (
  id TEXT PRIMARY KEY,
  page_id TEXT REFERENCES cms_pages(id) ON DELETE CASCADE,
  post_id TEXT REFERENCES cms_posts(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  status TEXT NOT NULL,
  snapshot JSONB NOT NULL,
  author_id TEXT REFERENCES admin_identities(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT cms_content_revisions_owner_check CHECK ((page_id IS NOT NULL)::integer + (post_id IS NOT NULL)::integer = 1),
  CONSTRAINT cms_content_revisions_version_check CHECK (version >= 1),
  CONSTRAINT cms_content_revisions_status_check CHECK (status IN ('draft', 'review', 'scheduled', 'published', 'trashed')),
  CONSTRAINT cms_content_revisions_snapshot_size_check CHECK (octet_length(snapshot::text) <= 1000000)
);
CREATE UNIQUE INDEX IF NOT EXISTS cms_content_revisions_page_version_unique ON cms_content_revisions (page_id, version) WHERE page_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS cms_content_revisions_post_version_unique ON cms_content_revisions (post_id, version) WHERE post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS cms_content_revisions_page_idx ON cms_content_revisions (page_id, created_at DESC);
CREATE INDEX IF NOT EXISTS cms_content_revisions_post_idx ON cms_content_revisions (post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS cms_content_revisions_author_idx ON cms_content_revisions (author_id, created_at DESC);

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
    'ai.documents.read', 'ai.documents.create', 'ai.generation.create', 'ai.review',
    'content.read', 'content.create', 'content.update', 'content.review', 'content.publish', 'content.schedule', 'content.trash',
    'taxonomy.read', 'taxonomy.create', 'taxonomy.update'
  ));
