# PHASE 17.19.11 — BASELINE

## Decision before Production write

`STOP BEFORE PRODUCTION WRITE.`

هذه المرحلة بدأت فوق commit `5bcbbe109e73988ad052c9b592d0150cecf9bdbe`، وهو commit توثيقي/اختباري فقط من Phase 17.19.10. لا توجد آلية authorization منفصلة ومثبتة في بيئة التنفيذ تسمح بكتابة Production، ولا توجد قناة PostgreSQL read-only أو isolated PostgreSQL أو snapshot evidence متاح.

## Operating boundary

```text
Production migration = FORBIDDEN
Production DDL/DML = FORBIDDEN
Production seed/population/backfill = FORBIDDEN
Production AI/provider/OCR/upload = FORBIDDEN
No fake fallback or fake persistence
```

## Known incident baseline

الصفحة الرئيسية تستخدم PostgreSQL الحقيقي من خلال `personService` و`databaseRepository`، ولا تعود إلى `localRepository` في runtime الحالي. في Production، homepage تعرض unavailable catalog state بدل Person cards، ومسار `/person/ibn-khaldun` لا يعرض الملف العام في anonymous check.

الدليل runtime الحاسم هو PostgreSQL `42P01` عند استعلام portrait من `person_media` مع `media_assets`:

> `relation "person_media" does not exist`

هذا **KNOWN LEAD — NOT ASSUMED COMPLETE ROOT CAUSE**. لا يثبت وحده حالة بقية schema أو وجود/غياب بيانات Person.

## Old vs current homepage flow

| Layer | Earlier behavior | Current behavior | Evidence |
|---|---|---|---|
| Source | local sample repository | PostgreSQL runtime | `personService.ts`, `app/page.tsx` |
| Repository | `localRepository` | `databaseRepository` | source inspection |
| Filtering | sample/static behavior | published-only query + validation | `databaseRepository.ts` |
| Projection | local display values | `toDisplayCategories`/`toDisplayPeople` | `lib/a3lam/catalog.ts` |
| Media | no Production media dependency | optional portrait lookup in Person route | `lib/media/repository.ts` |
| Rendering | cards from local data | cards only after successful query/validation | `app/page.tsx` |

أول behavioral boundary المعروف هو commit `5c74590b2d641e2254caa22fe22e58777e0e015a`، وليس دليلًا على حذف بيانات Production.

## Current observability

| Area | Status |
|---|---|
| Production schema metadata | NOT_OBSERVABLE |
| `schema_migrations` | NOT_OBSERVABLE |
| Production row counts/data state | NOT_OBSERVABLE |
| Backup/snapshot confirmation | NOT_CONFIRMED |
| Isolated PostgreSQL | NOT_AVAILABLE |
| Authenticated Admin browser session | NOT_AVAILABLE |
| Runtime `person_media` existence | MISSING — runtime-confirmed |
| Core catalog complete health | NOT_VERIFIED |
| CMS persistence | NOT_VERIFIED |

لا يُستنتج أن Production database فارغة أو سليمة من هذه الحالة.

## Baseline evidence

- `phase171911_context_docs.txt`
- `phase171911_source_forensics.txt`
- `phase171911_isolation_check.txt`
- `phase171911_current_incident` Vercel runtime evidence
- Phase 17.19.10 forensic documents

