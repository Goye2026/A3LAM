# PHASE 17.19.10 — MIGRATION ANALYSIS

## Method

هذا تحليل static لمحتوى ملفات migration وmanifest وrunner. لم تُقرأ `schema_migrations` من Production لأن القناة المتاحة لا تقدم database metadata read-only، ولم تُستخدم أسماء الملفات كدليل على التطبيق الفعلي.

## Migration inventory

| Migration | Source exists | Production applied | Safe to apply | Status |
|---|---|---|---|---|
| 0007 `phase17_16_media_architecture` | VERIFIED | NOT_OBSERVABLE | UNKNOWN until isolated/data compatibility checks | Runtime evidence indicates `person_media` missing |
| 0008 `phase17_18_2_ai_ingestion_review` | VERIFIED | NOT_OBSERVABLE | UNKNOWN; additive tables plus permission constraint replacement | NOT_OBSERVABLE |
| 0009 `phase17_18_4_ai_generation` | VERIFIED | NOT_OBSERVABLE | UNKNOWN; depends on AI ingestion and replaces permission constraint | NOT_OBSERVABLE |
| 0010 `phase17_19_3_content_engine` | VERIFIED | NOT_OBSERVABLE | UNKNOWN; CMS tables reference media/admin/categories and replaces permission constraint | NOT_OBSERVABLE |

## Per-migration analysis

| Migration | Creates | Alters | Drops | Data writes | Dependencies | Risk |
|---|---|---|---|---|---|---|
| 0007 | `media_assets`, `person_media`, unique/index objects | None | None | None | 0001 `people`; 0004 `admin_identities` for nullable creator FKs | HIGH/CRITICAL if runtime already queries absent relations; structural-only source |
| 0008 | AI documents, processing jobs, extracted sources/facts/evidence, review decisions, indexes | `admin_permission_overrides` permission check | Drops/re-adds the permission check constraint | None | 0004/0005; independent of 0007 at table level | HIGH; constraint replacement may reject existing invalid permission values |
| 0009 | AI generation jobs, attempts, claims, review decisions, indexes | `admin_permission_overrides` permission check | Drops/re-adds the permission check constraint | None | 0008 `ai_documents`; 0004/0005 | HIGH; strict order and permission-value compatibility required |
| 0010 | CMS pages, posts, tags, post-category/tag joins, content revisions, indexes | `admin_permission_overrides` permission check | Drops/re-adds the permission check constraint | None | 0001 categories; 0004 admin identities; 0007 media assets; 0005 permission overrides | HIGH; existing permission rows and existing FK/data compatibility must be checked |

`DROP CONSTRAINT IF EXISTS` in 0008–0010 is a destructive schema operation in the narrow forensic classification, even though the migrations contain no row-level `INSERT`, `UPDATE`, `DELETE`, `MERGE`, or `TRUNCATE`. No backfill or data transformation statement is present in 0007–0010.

## 0007 details

`media_assets` requires an id, provider, storage key, public URL, original name, MIME/extension, positive size, optional positive dimensions, attribution/license fields, status, visibility, and timestamps. It has storage-key uniqueness and status/visibility/created-at indexes. `person_media` requires `person_id`, `media_asset_id`, `usage_type`, `is_primary`, optional creator, and timestamp; it has a composite primary key, a primary-portrait partial unique index, and person/asset indexes. Foreign keys use `people ON DELETE CASCADE`, `media_assets ON DELETE RESTRICT`, and nullable `admin_identities ON DELETE SET NULL`.

The migration is **SAFE STRUCTURAL ONLY at source level**, not proven safe for Production. The runtime error confirms the relation is absent for the observed query, but no evidence establishes whether `media_assets` is also missing, whether legacy image fields are populated, or whether existing rows would satisfy the constraints.

## 0008 details

0008 adds an additive AI ingestion/review chain. It constrains document type, MIME, size, SHA-256 format, ingestion/extraction/processing statuses, owner type, retention policy, and optional failure codes. It adds foreign keys from processing jobs to documents, sources to documents, facts to sources, evidence to facts, and decisions to facts. It expands the RBAC permission check by dropping and recreating the constraint. There are no row-level data operations.

## 0009 details

0009 adds an additive generation/review chain rooted in `ai_documents`: generation jobs, attempts, claims, and review decisions. It adds idempotency and status/quality/error checks, JSONB size/array checks, and foreign keys across the generation chain. It again replaces the permission check constraint and contains no row-level data operations. It cannot safely precede 0008 because `ai_generation_jobs.document_id` references `ai_documents`.

## 0010 details

0010 adds `cms_pages`, `cms_posts`, `cms_tags`, post-category and post-tag join tables, and `cms_content_revisions`. Pages/posts include status, JSONB content, template restrictions, version/published-at checks, SEO fields, optional admin author, and optional featured media. The join tables use cascade from content and restrict categories/tags. Revisions enforce exactly one page-or-post owner through a check, per-owner version uniqueness, and indexes. The migration replaces the RBAC permission constraint to add content and taxonomy permissions. It contains no row-level data operations, but it has direct prerequisites on categories, admin identities, media assets, and the RBAC permission table.

## Dependency graph

The source manifest and native runner enforce this strict sequence:

```text
0001 core
  ↓
0002 integrity
  ↓
0003 profiles
  ↓
0004 admin identity
  ↓
0005 RBAC
  ↓
0006 site experience
  ↓
0007 media
  ↓
0008 AI ingestion/review
  ↓
0009 AI generation
  ↓
0010 CMS content engine
```

The requested subgraph is therefore:

```text
0007 → 0008 → 0009 → 0010
```

At table-level, 0008 is not dependent on 0007, and 0009 is dependent on 0008. Nevertheless, the native runner rejects out-of-order application and always chooses the first pending manifest entry. It also blocks if any of the first three prerequisites are pending. Therefore no manual skipping or direct 0010 application is safe or supported.

## Production applicability

`MIGRATION_HISTORY = NOT_OBSERVABLE`. The repository contains all four files, but file presence does not establish Production application. Applying any migration requires schema metadata, migration registry, data-compatibility checks, snapshot/backup, isolated rehearsal, and an explicit approval gate. None was performed in this phase.
