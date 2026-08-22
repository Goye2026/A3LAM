CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS people (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_arabic TEXT NOT NULL,
  short_bio TEXT NOT NULL,
  biography TEXT NOT NULL,
  birth_date DATE,
  death_date DATE,
  birth_place TEXT,
  death_place TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
  search_name TEXT NOT NULL,
  search_name_arabic TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT people_name_not_blank CHECK (length(btrim(name)) > 0),
  CONSTRAINT people_name_arabic_not_blank CHECK (length(btrim(name_arabic)) > 0),
  CONSTRAINT people_slug_not_blank CHECK (length(btrim(slug)) > 0)
);

CREATE TABLE IF NOT EXISTS person_categories (
  person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  PRIMARY KEY (person_id, category_id)
);

CREATE TABLE IF NOT EXISTS person_occupations (
  person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  occupation TEXT NOT NULL,
  occupation_normalized TEXT NOT NULL,
  PRIMARY KEY (person_id, occupation),
  CONSTRAINT person_occupation_not_blank CHECK (length(btrim(occupation)) > 0)
);

CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  publisher TEXT NOT NULL,
  url TEXT NOT NULL,
  publication_date DATE,
  accessed_at DATE NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('official', 'institution', 'government', 'media', 'professional', 'academic', 'secondary')),
  reliability TEXT NOT NULL CHECK (reliability IN ('high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT sources_url_not_blank CHECK (length(btrim(url)) > 0),
  CONSTRAINT sources_title_not_blank CHECK (length(btrim(title)) > 0)
);

CREATE TABLE IF NOT EXISTS person_sources (
  person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,
  PRIMARY KEY (person_id, source_id)
);

CREATE TABLE IF NOT EXISTS timeline_events (
  id TEXT PRIMARY KEY,
  person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS timeline_event_sources (
  event_id TEXT NOT NULL REFERENCES timeline_events(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,
  PRIMARY KEY (event_id, source_id)
);

CREATE TABLE IF NOT EXISTS education (
  id TEXT PRIMARY KEY,
  person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  institution TEXT NOT NULL,
  field TEXT NOT NULL,
  date_range TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS education_sources (
  education_id TEXT NOT NULL REFERENCES education(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,
  PRIMARY KEY (education_id, source_id)
);

CREATE INDEX IF NOT EXISTS people_status_idx ON people(status);
CREATE INDEX IF NOT EXISTS people_search_name_idx ON people(search_name);
CREATE INDEX IF NOT EXISTS people_search_name_arabic_idx ON people(search_name_arabic);
CREATE INDEX IF NOT EXISTS categories_status_idx ON categories(status);
CREATE INDEX IF NOT EXISTS person_occupations_normalized_idx ON person_occupations(occupation_normalized);
CREATE INDEX IF NOT EXISTS timeline_events_person_idx ON timeline_events(person_id, event_date);
CREATE INDEX IF NOT EXISTS education_person_idx ON education(person_id);
