# PHASE 17.19.12 — BASELINE

## Scope and operating mode

هذه المرحلة هي controlled recovery/readiness operation، وليست feature work أو redesign أو population. تم تنفيذ Mode A فقط: repository/source forensics، migration analysis، dependency analysis، runtime classification، readiness gate review، وGET/HEAD-only Production verification. لم يبدأ Mode B، ولم تُنفذ أي Production write.

```text
PRODUCTION_RECOVERY = NOT_STARTED
PRODUCTION_WRITES = 0
DDL = 0
DML = 0
MIGRATIONS_EXECUTED = 0
SEEDS = 0
POPULATION = 0
AI_CALLS = 0
PROVIDER_CALLS = 0
```

## Source of truth

Git HEAD عند بدء هذه المرحلة هو `58b8270171f6070d07e5e9bac77484572279cf17` على `main`. المشروع هو Next.js App Router / React / TypeScript / Drizzle، ولا توجد إضافة CMS أو framework بديل.

تم فحص `package.json`, `pnpm-lock.yaml`, `next.config.ts`, `drizzle.config.ts`, `drizzle/`, `lib/`, `app/`, `components/`, `tests/`, و`docs/`. manifest الفعلي هو `lib/db/migrations/manifest.mjs`، وnative runner هو `lib/db/migrations/runner.mjs`.

## Current known incident

Production public runtime يفشل في المسار المرصود بسبب PostgreSQL `42P01`:

> `relation "person_media" does not exist`

Homepage تعتمد على `databaseRepository.listCategories()` و`databaseRepository.listPublishedPeople()`، وتنتقل إلى unavailable state بدل عرض Person cards. `/person/ibn-khaldun` لم يعرض السجل العام في anonymous verification.

هذا **KNOWN LEAD — NOT ASSUMED COMPLETE ROOT CAUSE**. لا يجوز افتراض أن `person_media` هي المشكلة الوحيدة أو أن database فارغة.

## Runtime flow

```text
Production PostgreSQL
→ getDb()
→ databaseRepository
→ personService
→ publication validation / public projection
→ HomepageCatalogSections or /person/[slug]
→ UI
```

مسار Person يستدعي أيضًا `getPersonMedia()`، الذي يقرأ `person_media` مع `media_assets`. Media relation failure مثبتة runtime، لكن بقية relations وحالة البيانات غير مثبتة.

## Observability baseline

| Item | Status |
|---|---|
| Production PostgreSQL read-only channel | NOT_AVAILABLE |
| `information_schema` / `pg_catalog` access | NOT_AVAILABLE |
| `schema_migrations` access | NOT_OBSERVABLE |
| Production row counts/data state | NOT_OBSERVABLE |
| Backup/snapshot evidence | NOT_CONFIRMED |
| Isolated PostgreSQL | NOT_AVAILABLE |
| Authenticated Admin browser session | NOT_AVAILABLE |
| `person_media` runtime existence | MISSING — runtime-confirmed for observed query |
| Homepage restored | NO — degraded/unavailable |
| Person route restored | NO — observed error |
| CMS persistence verified | NO |

لا تُحوّل `NOT_OBSERVABLE` إلى صفر أو EMPTY.

## Safety boundary

لم تُقرأ أو تُستخرج أي Production credential أو `DATABASE_URL`. لم يُستخدم Vercel إلا للـruntime/deployment read-only evidence. لم يتم تمكين PostgreSQL connector، ولم تبدأ migration runner أو integration suite أو seed. بقي AI disabled ولم تُنشأ People أو Profiles أو Media.

## Evidence

الأدلة الأساسية هي `phase171912_repo_inventory.txt`, `phase171912_source_forensics.txt`, `phase171912_migrations_source.txt`, `phase171911_isolation_check.txt`, وVercel runtime-error evidence المحفوظة خارج المستودع.
