# A3LAM — PHASE 17.19.13 MIGRATION AUDIT

## Scope and source of truth

تم فحص `lib/db/migrations/manifest.mjs` و`lib/db/migrations/runner.mjs` و`lib/db/schema.ts` وجميع ملفات SQL من `0001` إلى `0010` في Git HEAD الحالي. هذا تدقيق source-only؛ لا يثبت أي حالة Applied في Production.

## Canonical order

```text
0001_a3lam_core.sql
  ↓
0002_a3lam_integrity.sql
  ↓
0003_phase13_profiles.sql
  ↓
0004_phase17_1_admin_identity.sql
  ↓
0005_phase17_2_rbac_management.sql
  ↓
0006_phase17_3_site_experience.sql
  ↓
0007_phase17_16_media_architecture.sql
  ↓
0008_phase17_18_2_ai_ingestion_review.sql
  ↓
0009_phase17_18_4_ai_generation.sql
  ↓
0010_phase17_19_3_content_engine.sql
```

هذا هو ترتيب manifest والـrunner، وليس إثباتًا لترتيب Production history. الـrunner يرفض unknown/duplicate state ويمنع skipping وlater-applied versions.

## Migration matrix

| Migration | Tables/objects | Dependencies | Indexes/constraints | Risk classification | Production status |
|---|---|---|---|---|---|
| 0001 | categories, people, person_categories, occupations, sources, timeline, education، link tables | none | PK/FK، unique slugs، status/name checks، search/timeline/education indexes | SAFE_SCHEMA_ONLY at source level | NOT_OBSERVABLE |
| 0002 | adds core name/slug checks via conditional ALTER | 0001 | category nonblank and slug regex checks | existing invalid values may reject ALTER | DATA_COMPATIBILITY_REQUIRED |
| 0003 | user_accounts, sessions, profiles, profile relations/files, audit_logs | 0001 categories | unique email/token/profile/slug/storage indexes، status/visibility checks | existing rows/values and FK compatibility | NOT_OBSERVABLE |
| 0004 | admin identity/roles/permissions/sessions; alters user_accounts | 0003 user_accounts | admin status/token/role checks and FKs | user/admin compatibility | NOT_OBSERVABLE |
| 0005 | admin_permission_overrides | 0004 admin roots | effect/permission allowlist, composite PK/indexes | existing permission compatibility | NOT_OBSERVABLE |
| 0006 | site_experience_configs; replaces RBAC check | 0005 | resource allowlist and DROP/ADD permission constraint | constraint replacement | POTENTIALLY_DESTRUCTIVE |
| 0007 | media_assets, person_media | people/admin identities and manifest prerequisites | media safety checks, FKs, primary portrait partial unique index | runtime-critical; data state unknown | MISSING relation observed in runtime; rest NOT_OBSERVABLE |
| 0008 | AI documents/jobs/extracted sources/facts/evidence/review | 0005 and prior manifest | bounded type/status/hash checks and RBAC constraint replacement | compatibility-sensitive; AI remains disabled | NOT_OBSERVABLE |
| 0009 | AI generation jobs/attempts/claims/review | 0008 AI documents | idempotency/status/attempt/JSON bounds and RBAC constraint replacement | compatibility-sensitive; AI remains disabled | NOT_OBSERVABLE |
| 0010 | CMS pages/posts/tags, taxonomy joins, revisions | categories, admin identities, media, prior manifest | slug/status/template/version/revision checks and RBAC constraint replacement | compatibility-sensitive | NOT_OBSERVABLE |

## Dependency graph

```text
0001
├── 0002
├── 0003
└── 0007 (people → person_media)

0003 → 0004 (user_accounts/admin foundation)
0004 → 0005 → 0006
0004 → 0007 (media creator FKs)
0005 → 0008 → 0009
0007 → 0010 (featured media / CMS dependency)
0001 + 0004 + 0005 + 0007 → 0010
```

The canonical runner still requires the full manifest sequence; the graph must not be used to skip earlier versions.

## `person_media` contract

`0007_phase17_16_media_architecture.sql` creates `media_assets` and `person_media`. `person_media` references `people(id)` with `ON DELETE CASCADE`, `media_assets(id)` with `ON DELETE RESTRICT`, and `admin_identities(id)` with `ON DELETE SET NULL`. It has a composite primary key and indexes for asset/person lookup plus a partial unique index for one primary portrait per person.

`lib/db/schema.ts` mirrors this relation. `lib/media/repository.ts` joins it to `media_assets`, and the public Person path uses `getPersonMedia(..., true)`. The application assumes both relations, the expected columns, the ready/public media states, and a safe public URL projection.

## Safety classification

No SQL file in 0001–0010 contains row-level `INSERT`, `UPDATE`, `DELETE`, or `TRUNCATE` statements. However, 0002/0004 use ALTER operations and 0006/0008/0009/0010 use `DROP CONSTRAINT IF EXISTS` followed by a replacement constraint. Those operations require existing-data compatibility checks and explicit review:

> `DESTRUCTIVE_CHANGE_REQUIRES_EXPLICIT_APPROVAL`

No migration is executed in this phase. No manual `CREATE person_media`, `drizzle-kit push`, reset, drop, truncate, or migration-history rewrite is allowed.

## Runner controls

The native runner uses a transaction and advisory lock, creates/reads `schema_migrations`, detects inconsistent applied versions, selects only the first pending manifest item, checks prerequisites, executes SQL inside the transaction, and inserts history after execution. It has no force/reset/skip bypass.

## Conclusion

`SOURCE_MIGRATIONS = VERIFIED`; `PRODUCTION_MIGRATION_HISTORY = NOT_OBSERVABLE`; `PRODUCTION_SCHEMA = NOT_OBSERVABLE`. Blind application of 0007 or the chain is unsafe until backup, isolated rehearsal, compatibility, and authorization gates pass.
