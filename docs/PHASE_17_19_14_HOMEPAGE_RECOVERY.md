# A3LAM — PHASE 17.19.14 HOMEPAGE RECOVERY

## Result

`HOMEPAGE = DEGRADED / NOT RESTORED`.

## Actual pipeline

```text
/ → app/page.tsx
  → personService.listCategories()
  → personService.listPublishedPeople()
  → databaseRepository
  → nested person hydration
  → media hydration
  → publication validation
  → public projection
  → PersonCard
```

The Homepage is database-backed. It does not use hardcoded Person cards, synthetic records, or a localRepository fallback. When the catalog promise fails or times out, it renders an honest unavailable state and metrics `—`.

## Observed reason for missing cards

The public runtime has observed PostgreSQL `42P01`:

> `relation "person_media" does not exist`

This proves a missing dependency for the observed query path. It does not prove that the database is empty or that this is the only missing dependency. Because Production schema/data metadata is not safely available, `REAL_PERSON_VISIBLE_ON_HOMEPAGE = NOT_VERIFIED`.

## Functional acceptance not met

The following were not proven in Production: category data loaded, real published people loaded, nested hydration completed, media resolution succeeded, publication validation passed for a real row, PersonCard rendered from public projection, or an observed empty state after confirming zero published records.

HTTP 200, build PASS, deployment READY, public shell, and metrics `—` are not functional Homepage PASS.

## Non-actions

لم تُضف fake metrics أو mock cards، ولم تُعاد local repository fixtures، ولم تُنشأ People أو Categories أو Media، ولم تُنفذ migration أو DML.

## Required next validation after authorized recovery

بعد schema/data recovery المصرح بها فقط، اختبر categories وpeople وmedia وpublication filtering وpublic projection، ثم افحص Homepage في المقاسات المطلوبة مع RTL/no clipping/no overflow. إذا ثبت عدم وجود منشورين، اعرض EMPTY STATE لا UNAVAILABLE.
