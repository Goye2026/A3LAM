# PHASE 17.19.11 — SCHEMA AUDIT

## Access result

`PRODUCTION_SCHEMA_ACCESS = NOT_AVAILABLE`.

لا توجد قناة PostgreSQL read-only مصرح بها في بيئة التنفيذ. الأدوات المحلية `psql` و`pg_isready` و`docker` و`podman` غير متاحة، ولا يوجد PostgreSQL process أو listener محلي. Connectors الخاصة بـNeon وPrisma Postgres وSupabase غير مفعلة، ولم يتم تمكين أي connector أو طلب credential. Vercel المتاح يوفر deployment/runtime observability فقط، وليس `information_schema` أو `pg_catalog`.

## Drift matrix

| Object | Expected | Actual | Drift | Severity | Runtime impact |
|---|---|---|---|---|---|
| `people` | table from 0001/schema | NOT_OBSERVABLE | UNKNOWN | UNKNOWN | row/query compatibility غير مثبتة |
| `categories` | table from 0001/schema | public API boundary responds | UNKNOWN metadata; API boundary PRESENT | MEDIUM | بعض category reads تعمل |
| `person_categories` | composite relation from 0001/schema | NOT_OBSERVABLE | UNKNOWN | HIGH | publication validation يعتمد عليها |
| `sources` / `person_sources` | source relation from 0001/schema | NOT_OBSERVABLE | UNKNOWN | HIGH | public publication gate غير قابل للتحقق runtime |
| `profiles` | tables from 0003/schema | NOT_OBSERVABLE | UNKNOWN | HIGH | user profile path غير قابل للتحقق |
| `media_assets` | table from 0007/schema | NOT_OBSERVABLE | UNKNOWN | HIGH | join target غير قابل للفحص |
| `person_media` | table from 0007/schema | relation missing in observed runtime query | MISSING_TABLE (runtime-confirmed) | CRITICAL | Person metadata/page media lookup fails |
| `cms_pages` / `cms_posts` | tables from 0010/schema | NOT_OBSERVABLE | UNKNOWN | HIGH | CMS persistence غير قابلة للإثبات |
| `cms_tags` / join tables | tables from 0010/schema | NOT_OBSERVABLE | UNKNOWN | HIGH | taxonomy persistence غير قابلة للإثبات |
| `cms_content_revisions` | table from 0010/schema | NOT_OBSERVABLE | UNKNOWN | HIGH | revision runtime غير قابل للإثبات |
| `schema_migrations` | registry table used by runner | protected endpoint returns 401 anonymous; DB table NOT_OBSERVABLE | MIGRATION_HISTORY_DRIFT = UNKNOWN | CRITICAL | applied/pending order غير قابل للتحديد |
| columns/types/nullability | expected in `lib/db/schema.ts` | NOT_OBSERVABLE | UNKNOWN | HIGH | compatibility غير مثبتة |
| indexes/FKs/check constraints | expected in migrations/schema | NOT_OBSERVABLE | UNKNOWN | HIGH | integrity and query behavior غير مثبتين |
| extra objects | none assumed | NOT_OBSERVABLE | UNKNOWN | UNKNOWN | لا يمكن تقييمها |

## Person/media finding

الـruntime query الفاشل هو:

```text
select media_assets.public_url
from person_media
inner join media_assets on person_media.media_asset_id = media_assets.id
where person_media.person_id = $1
  and person_media.usage_type = 'portrait'
  and person_media.is_primary = true
  and media_assets.status = 'ready'
  and media_assets.visibility = 'public'
limit 1
```

Vercel يسجل `42P01` و`relation "person_media" does not exist`. هذا يثبت missing relation في runtime للـquery المرصود، لكنه لا يثبت أن `media_assets` أو أي جدول آخر مفقود.

## Data integrity

لا يمكن تنفيذ row-level read-only checks، لذلك الحالات التالية هي `NOT_OBSERVABLE`: orphan people/profiles/media، duplicate slugs أو unique values، nullability conflicts، invalid statuses، broken revisions، invalid taxonomy relations، وinvalid foreign-key references. لا يجوز حذف أو تعديل أي record مشتبه به.

## Public projection path

```text
DB record
→ databaseRepository
→ hydrate/validation
→ public projection
→ route
→ UI
```

المصدر يفرض `published-only` و`validatePublishedRecord` قبل العرض العام. فشل media relation يحدث داخل public Person route metadata/media lookup، بينما homepage catches catalog exceptions إلى unavailable state. لا يوجد evidence يبرر استبدال unavailable بـempty أو إضافة local mock data.

## Classification

- `person_media`: **MISSING_TABLE / CRITICAL / runtime-confirmed**.
- بقية schema objects: **UNKNOWN / NOT_OBSERVABLE**.
- Production data state: **NOT_OBSERVABLE**.
- Migration history: **NOT_OBSERVABLE**.
- Production schema health: **NOT VERIFIED**.
