# PHASE 17.19.12 — MIGRATION GRAPH

## Method

هذا graph مستنتج من `lib/db/migrations/manifest.mjs` وملفات SQL الموجودة في `drizzle/migrations/`. وجود الملف يثبت `SOURCE_EXISTS` فقط، ولا يثبت `MIGRATION_APPLIED` أو `MIGRATION_VERIFIED` في Production.

## Deterministic manifest order

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

الـnative runner لا يسمح بتجاوز أول pending migration، ولا يسمح بتطبيق migration لاحقة قبل prerequisites في manifest. هذا الترتيب لم يُختبر على Production registry لأن `schema_migrations` غير قابلة للرصد.

## Migration inventory

| Migration | Creates / changes | Depends on | Data risk | Destructive classification | Production status |
|---|---|---|---|---|---|
| 0001 core | `categories`, `people`, `person_categories`, occupations, sources, timeline, education، indexes، checks | none | structural foundation | SAFE_SCHEMA_ONLY at source level | NOT_OBSERVABLE |
| 0002 integrity | adds category/person name/slug checks via conditional `ALTER TABLE` | 0001 tables | existing invalid values could reject constraint | DATA_COMPATIBILITY_REQUIRED | NOT_OBSERVABLE |
| 0003 profiles | users, sessions, profiles, profile relations/files, audit logs، indexes/checks | 0001 categories for profile categories | existing values must satisfy constraints | DATA_COMPATIBILITY_REQUIRED | NOT_OBSERVABLE |
| 0004 admin identity | `user_accounts.disabled_at`; admin identities/roles/permissions/sessions | 0003 user accounts; later FKs target admins | existing user table compatibility | DATA_COMPATIBILITY_REQUIRED | NOT_OBSERVABLE |
| 0005 RBAC | permission overrides, role/permission relation indexes/checks | 0004 admin identities/roles/permissions | permission rows must satisfy allowlist | DATA_COMPATIBILITY_REQUIRED | NOT_OBSERVABLE |
| 0006 site experience | site experience configs; replaces RBAC permission check; index | 0005 RBAC | existing permission codes may fail tightened/replaced check | POTENTIALLY_DESTRUCTIVE | NOT_OBSERVABLE |
| 0007 media | `media_assets`, `person_media`, indexes/checks/FKs | 0001 people; 0004 admin identities; manifest prerequisites 0001–0006 | existing referenced media/legacy values unknown | SAFE_SCHEMA_ONLY at source level; runtime-critical | MISSING `person_media` in observed query; rest NOT_OBSERVABLE |
| 0008 AI ingestion/review | AI documents, processing, extracted sources/facts/evidence/review; replaces RBAC check | 0005 RBAC; manifest after 0007 | existing permission values must satisfy new check | POTENTIALLY_DESTRUCTIVE | NOT_OBSERVABLE; AI remains disabled |
| 0009 AI generation | AI generation jobs/attempts/claims/review; replaces RBAC check | 0008 AI documents; manifest after 0008 | existing permission values and FK compatibility | POTENTIALLY_DESTRUCTIVE | NOT_OBSERVABLE; AI remains disabled |
| 0010 CMS engine | CMS pages/posts/tags, taxonomy joins, revisions; replaces RBAC check | 0001 categories, 0004 admins, 0005 RBAC, 0007 media; manifest after 0009 | existing permission/FK/unique/status compatibility | POTENTIALLY_DESTRUCTIVE | NOT_OBSERVABLE; CMS persistence unverified |

## Structural dependency graph

```text
0001
├── 0002 (constraints on core tables)
├── 0003 (profile_categories → categories)
├── 0004 (user_accounts altered from 0003)
└── 0007 (people → person_media)

0004
├── 0005 (admin identity/role/permission roots)
├── 0006 (site configs → admin identities; RBAC constraint)
├── 0007 (media creator FKs)
├── 0008 (AI reviewer/owner FKs; RBAC constraint)
├── 0009 (AI reviewer FKs; RBAC constraint)
└── 0010 (CMS author FKs; RBAC constraint)

0005
├── 0006 (permission constraint replacement)
├── 0008 (permission constraint replacement)
├── 0009 (permission constraint replacement)
└── 0010 (content/taxonomy permissions)

0007 → 0009/0010 through media/runtime and manifest order
0008 → 0009 (generation jobs reference ai_documents)
0001 + 0004 + 0005 + 0007 → 0010 (CMS relations and permissions)
```

## Safety classification

لا تحتوي migrations 0001–0010 على row-level `INSERT`, `UPDATE`, `DELETE`, أو `TRUNCATE` statements. لكن 0002 و0004 و0006 و0008 و0009 و0010 تستخدم `ALTER TABLE` أو constraint replacement، و0006/0008/0009/0010 تستخدم `DROP CONSTRAINT IF EXISTS` قبل إعادة الإضافة. لذلك لا تُصنف chain كلها كـsafe-to-apply دون compatibility proof.

> `DESTRUCTIVE_CHANGE_REQUIRES_EXPLICIT_APPROVAL`

هذا التصنيف يخص structural constraint replacement، ولا يعني أن حذف records حدث أو سيحدث.

## Runtime minimum dependency set

لاستعادة Homepage/Person/Categories/Search، يلزم على الأقل تحقق runtime من core people/categories/sources/relations والـpublished validation، إضافة إلى media objects لأن Person route يستدعي portrait lookup. لاستعادة CMS read paths يلزم أيضًا CMS pages/posts/tags/revisions، admin/RBAC، categories، وmedia assets. لا يجوز إعلان الحد الأدنى فعليًا قبل schema metadata/data checks.

## Current conclusion

`SOURCE_EXISTS = VERIFIED` للمigrations الموجودة في manifest. `MIGRATION_APPLIED = NOT_OBSERVABLE` و`MIGRATION_VERIFIED = NOT_AVAILABLE` في Production. لا يجوز تشغيل chain blind أو القفز مباشرة إلى 0007/0010.
