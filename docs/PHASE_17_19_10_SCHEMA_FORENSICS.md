# PHASE 17.19.10 — SCHEMA FORENSICS

## Operating mode

```text
PHASE 17.19.10 MODE = READ-ONLY FORENSICS
PRODUCTION WRITES = FORBIDDEN
DDL = FORBIDDEN
DML = FORBIDDEN
MIGRATIONS = FORBIDDEN
SEEDS = FORBIDDEN
POPULATION = FORBIDDEN
AI = DISABLED
PUBLICATION = DISABLED
```

لم تُستخدم Production credentials، ولم يُجرَ أي SQL مباشر على Production. قناة Vercel المتاحة للقراءة استُخدمت فقط لقراءة runtime error clusters وdeployment metadata؛ لا توفر هذه القناة `information_schema` أو `pg_catalog` أو `schema_migrations`.

## 1. Production schema observability

| Domain/object | Production observation | Status | Risk |
|---|---|---|---|
| Core tables (`categories`, `people`, `sources`, timeline, education) | لا توجد قناة metadata أو row-count مصرح بها؛ بعض public reads تعمل | NOT_OBSERVABLE | UNKNOWN |
| Person | public route/runtime لا يثبت schema أو row counts | NOT_OBSERVABLE | UNKNOWN |
| Profile | protected/public behavior موجود في source؛ Production metadata غير متاحة | NOT_OBSERVABLE | UNKNOWN |
| `media_assets` | لا يمكن فصل وجود الجدول عن فشل join بدون metadata query؛ runtime query references it | NOT_OBSERVABLE | HIGH |
| `person_media` | Vercel runtime error code `42P01`: `relation "person_media" does not exist` | MISSING (runtime-confirmed) | CRITICAL |
| Category | `/api/categories` أعاد categories منشورة فعلية عبر public GET | PRESENT at API boundary; schema metadata NOT_OBSERVABLE | MEDIUM |
| CMS (`cms_pages`, `cms_posts`, `cms_tags`) | لا authenticated read أو DB metadata متاح | NOT_OBSERVABLE | HIGH |
| Revisions (`cms_content_revisions`) | لا authenticated read أو DB metadata متاح | NOT_OBSERVABLE | HIGH |
| `schema_migrations` | protected migration endpoints تعيد 401 anonymous؛ لا DB channel | NOT_OBSERVABLE | CRITICAL |
| Extra production-only objects | لا يمكن فحصها | NOT_OBSERVABLE | UNKNOWN |
| Columns/indexes/constraints/types/functions/views | لا يمكن فحصها مباشرة | NOT_OBSERVABLE | UNKNOWN |

**قاعدة البيانات ليست مصنفة فارغة.** `PRODUCTION_DATA_STATE = NOT_OBSERVABLE`.

## 2. Source expected model

المصدر المتوقع هو `lib/db/schema.ts` مع migration manifest في `lib/db/migrations/manifest.mjs`. الجداول الأساسية والروابط المتوقعة هي:

| Object | Expected source | Migration | Key structure / dependency | Destructive? |
|---|---|---|---|---|
| `categories` | `schema.categories` | 0001 | PK `id`, unique `slug`, status index | No |
| `people` | `schema.people` | 0001 | PK `id`, unique `slug`, published status, search indexes | No |
| `person_categories` | `schema.personCategories` | 0001 | composite PK; people cascade; categories restrict | No |
| `person_occupations` | `schema.personOccupations` | 0001 | composite PK; normalized index | No |
| `sources` / `person_sources` | `schema.sources`, `schema.personSources` | 0001 | source records and restrict relationship | No |
| `timeline_events` / sources | `schema.timelineEvents`, `schema.timelineEventSources` | 0001 | person cascade; source restrict | No |
| `education` / sources | `schema.education`, `schema.educationSources` | 0001 | person/education cascade; source restrict | No |
| `user_accounts`, `user_sessions`, profile tables | `schema.userAccounts` through `schema.profileFiles` | 0003 | user/profile FKs, unique user/slug/storage constraints | No; structural only |
| `admin_identities`, roles, permissions, sessions | `schema.adminIdentities` etc. | 0004–0005 | admin identity root for later FKs and RBAC | 0004 adds `user_accounts.disabled_at` |
| `site_experience_configs` | `schema.siteExperienceConfigs` | 0006 | resource PK, JSONB draft/published, admin FKs | Constraint replacement in permission table |
| `media_assets` | `schema.mediaAssets` | 0007 | storage/public metadata, status/visibility, admin FKs | No |
| `person_media` | `schema.personMedia` | 0007 | composite PK; people cascade; media restrict; primary portrait unique index | No |
| AI ingestion tables | `schema.aiDocuments` through `schema.aiReviewDecisions` | 0008 | AI document→source→fact→evidence/review chain | Permission constraint replacement |
| AI generation tables | `schema.aiGenerationJobs` etc. | 0009 | document/job/claim/review chain | Permission constraint replacement |
| CMS pages/posts/tags | `schema.cmsPages`, `cmsPosts`, `cmsTags` | 0010 | status, JSONB content, slug uniqueness, media/admin/category FKs | Permission constraint replacement |
| CMS taxonomy/revisions | `schema.cmsPostCategories`, `cmsPostTags`, `cmsContentRevisions` | 0010 | cascade/restrict relationships; page/post owner check; per-owner version uniqueness | No table-data writes |

This table is a **source-expected model**, not a claim that all objects exist in Production.

## 3. Person domain forensics

The expected Person pipeline is:

```text
people
→ person_categories / person_occupations / person_sources
→ timeline_events / education and source links
→ hydratePerson()
→ validatePublishedRecord()
→ personService
→ PersonCard or /person/[slug]
```

The source requires a published Person to have valid published categories, published sources, source references, valid slugs/status fields, and consistent timeline/education references. The public route also attempts an optional portrait lookup through `person_media` joined to `media_assets`.

The Person table itself, row count, published row count, slug validity, orphan relationships, and legacy alternatives are **NOT_OBSERVABLE**. The only Production schema-level fact established is the runtime absence of `person_media` for the observed query.

## 4. Homepage forensics

```text
Production PostgreSQL
  ↓
getDb()
  ↓
databaseRepository.listCategories()
+ databaseRepository.listPublishedPeople()
  ↓
personService
  ↓
validatePublishedRecord / display projection
  ↓
CategoryCard / PersonCard
  ↓
app/page.tsx
```

`app/page.tsx` catches catalog query/timeout failures and renders `dataUnavailable`, `—` metrics, and no Person cards. Therefore the observed homepage state proves the public catalog read did not complete successfully, but does not prove an empty database.

## 5. Person route forensics

```text
/person/[slug]
  ↓
getUnlistedOrPublishedProfileBySlug(slug)
  ↓
if no profile: personService.getPublishedPersonBySlug(slug)
  ↓
hydrate + validate published record
  ↓
optional getPersonMedia(person.id, true)
  ↓
public profile/person render
```

The Vercel runtime query is the `getPersonMedia` query defined in `lib/media/repository.ts:158-165`. Its relation reference to `person_media` fails with `42P01`. The public route therefore remains blocked until the schema mismatch is resolved or an explicitly approved compatibility contract removes the dependency safely.

## 6. Data compatibility

No Production row-level or metadata query was available. Consequently, orphan records, duplicate unique values, nullability conflicts, invalid status values, invalid enum-like text values, and broken references are all **NOT_OBSERVABLE**. No migration safety claim can be upgraded to `SAFE TO APPLY` based on source text alone.

## 7. Classification

`person_media` missing at runtime is **CRITICAL** because the public Person route attempts the relation and the observed public route does not render the expected record. The broader homepage catalog failure is **CRITICAL / UNKNOWN root sub-cause**: the caught error boundary hides the exact database exception, and the database cannot be inspected under the current boundary. CMS and migration state are **HIGH / NOT_OBSERVABLE**. No claim of healthy Production schema is made.

## Evidence files

- `phase171910_source_inventory.txt`
- `phase171910_schema_source.txt`
- `phase171910_migration_operations.txt`
- `phase171910_public_forensics.txt`
- Vercel read-only runtime errors for the project during the audit window
