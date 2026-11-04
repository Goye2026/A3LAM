# PHASE 17.20.03 — Pages & Posts Editorial Workflow

**المنتج:** A3LAM — أعلام

**التاريخ:** 3 نوفمبر 2026

**القرار النهائي:** **PARTIAL**

السبب: تم تنفيذ وتصحيح الحواجز البرمجية المطلوبة ونجحت جميع التحققات المحلية، لكن لم تُنفذ جلسة Admin E2E مصادق عليها ولا اختبار تكامل CMS على قاعدة اختبار آمنة في هذه الجلسة. لذلك لا أزعم أن دورة التحرير persistence الفعلية في بيئة تشغيل قد اجتازت E2E.

---

## 1. حدود التنفيذ

تم احترام القيود التالية:

- لا migrations أو SQL أو DDL/DML.
- لا تعديل Production أو بياناته أو حساباته أو جلساته.
- لا seed أو backfill أو synthetic content.
- لا media upload/delete.
- لا email أو credential lifecycle.
- لا Neon/Postmark/Upstash/Vercel أو environment changes.
- لا deployment أو Git push.
- لا package manifest أو lockfile changes.
- لا إعادة تصميم لـCMS أو Gutenberg-like editor.
- People بقي كيان A3LAM متخصصًا ومستقلًا عن Pages/Posts.

---

## 2. جرد الوظائف قبل التعديل

### موجود ومُعاد استخدامه

كانت البنية الحالية تحتوي على معظم workflow المطلوب:

- شاشات منفصلة لـPages وPosts وقوائم server-rendered.
- بحث bounded بالعنوان والـslug.
- فلترة بالحالة التحريرية.
- pagination وحد أقصى 50 سجلًا في الطلب.
- حالات empty/error/unavailable/loading.
- محرر مشترك `CmsEditorialEditor` للصفحات والمقالات.
- Rich text JSON مدعوم عبر محرر نصي آمن دون HTML خام.
- حفظ Draft وEdit عبر APIs محمية.
- local recovery عبر `localStorage` و`beforeunload` لمنع فقدان التعديلات غير المحفوظة.
- revision snapshots وpreview/detail وrestore.
- Admin preview محمي بصلاحية `content.read` و`noindex`.
- RBAC server-side وSame-Origin mutation checks وbounded request bodies.
- audit events عند create/edit/status transition/restore.
- published-only projections في public routes/search/sitemap.
- optimistic concurrency باستخدام `version`.

### النواقص أو نقاط المخاطر المكتشفة

1. حالة `scheduled` كانت مقبولة في `editorialRepository.transition` رغم أن الواجهة لا توفر scheduler فعليًا؛ هذا كان يسمح باستدعاء API مصادق عليه لتسجيل حالة غير تشغيلية.
2. لم تكن هناك بوابة مركزية تمنع نشر سجل ذي `content.blocks` فارغة؛ parser يسمح بمسودة فارغة، لكن النشر يجب أن يتطلب محتوى.
3. لا يوجد دليل Admin E2E مصادق عليه في هذه الجلسة.
4. لا يوجد scheduler/worker، ولذلك يجب أن تبقى `scheduled` غير تشغيلية.
5. لا يمكن إثبات persistence الفعلية أو publication gate عبر قاعدة تشغيل دون تنفيذ اختبار تكامل آمن؛ لم يُنفذ ذلك لتجنب أي Database/Production mutation.

---

## 3. التصحيحات المنفذة

### `lib/cms/editorialValidation.ts`

أضيفت الدالة `assertCmsPublishable` التي تتحقق server-side من:

- وجود العنوان.
- وجود slug.
- وجود block واحد على الأقل في المحتوى.

تسمح `parseCmsEditorialMutation` بحفظ مسودة فارغة، لكن لا يمكن استخدام السجل الفارغ للنشر.

### `lib/cms/editorialRepository.ts`

تم تعديل `transition` بحيث:

- ترفض `scheduled` صراحة برسالة `Scheduled publishing is not available`.
- تستدعي `assertCmsPublishable` قبل الانتقال إلى `published`.
- تبقي version check وstatus transition rules وtransaction وaudit كما هي.

لم تتغير بنية الجداول أو migration أو نموذج revision.

### `tests/cms03-workflow.test.ts`

أضيفت اختبارات مركزة لـ:

- Page/Post payload separation.
- required fields وslug policy وtaxonomy restriction للصفحات.
- السماح بالمسودة الفارغة ومنع نشرها.
- منع scheduled عند repository boundary.
- حماية preview وmutation APIs.
- revision restore إلى Draft دون نشر تلقائي.
- local recovery وbeforeunload وfeedback states.

### ملفات Phase 17.20.02 السابقة

لم تُعدّل التغييرات السابقة في:

- `tests/phase17.11.test.ts`
- `tests/phase17.19.1.test.ts`
- `tests/cms02-stability.test.ts`

لكنها بقيت ضمن شجرة العمل كما كانت قبل هذه المرحلة.

---

## 4. مصفوفة API والصلاحيات

| العملية | API/المكوّن | الصلاحية | الحماية | النتيجة المتوقعة |
|---|---|---|---|---|
| List Pages | `GET /api/admin/cms/pages` | `content.read` | server-side principal، no-store، bounded page/pageSize | قائمة محدودة قابلة للبحث والفلترة |
| Create Page | `POST /api/admin/cms/pages` | `content.create` | Same-Origin + bounded JSON + validation | Draft جديد مع revision وaudit |
| Update Page | `PUT /api/admin/cms/pages/[id]` | `content.update` | Same-Origin + expectedVersion + validation | تعديل ذري مع version جديد وrevision |
| Page status | `PATCH /api/admin/cms/pages/[id]/status` | حسب الحالة: review/publish/trash/update | Same-Origin + expectedVersion + transition rules | انتقال مسموح فقط؛ scheduled مرفوض |
| List Posts | `GET /api/admin/cms/posts` | `content.read` | server-side principal، bounded query | قائمة Posts محدودة |
| Create/Update Posts | APIs المقابلة | `content.create`/`content.update` | Same-Origin + taxonomy/media validation | Draft/Edit مع علاقات taxonomy |
| Revision list/detail | `GET .../revisions` و`GET .../revisions/[revisionId]` | `content.read` | principal + private no-store | revision metadata/snapshot |
| Revision restore | `POST .../revisions` | `content.update` | Same-Origin + expectedVersion | revision مستعاد كـDraft مع audit |
| Public page/article | `/page/[slug]`, `/article/[slug]` | عامة | repository published-only | المنشور فقط |
| Public search | `/api/search` | عامة | repository published-only | لا draft/review/trashed |
| Sitemap | `/sitemap.xml` | عامة | `listPublishedForSitemap` | المنشور فقط |

---

## 5. مصفوفة انتقال الحالات

| الحالة الحالية | Draft | Review | Scheduled | Published | Trashed |
|---|---:|---:|---:|---:|---:|
| Draft | مسموح | مسموح | **مرفوض** | مرفوض حتى Review | مسموح |
| Review | مسموح | مسموح | **مرفوض** | مسموح بعد publish gate | مسموح |
| Scheduled | مسموح | غير متاح كتشغيل فعلي | **مرفوض** | **مرفوض كمسار تشغيلي غير مدعوم** | مسموح |
| Published | مسموح كإعادة تحرير | غير مسموح مباشرة | **مرفوض** | مسموح idempotent حسب العقد الحالي | مسموح |
| Trashed | مسموح كاستعادة | غير مباشر | **مرفوض** | غير مباشر | مسموح |

ملاحظة: قيمة `scheduled` ما زالت موجودة في النوع/قاعدة البيانات لأسباب توافقية سابقة، لكن لا يتم عرضها كقدرة تشغيلية ولا قبولها من repository transition حتى يتم تنفيذ scheduler مستقل في مرحلة لاحقة.

---

## 6. المعاينة والأمن

المعاينة الإدارية الحالية تستخدم المسار:

```text
/admin/content/pages/[id]/preview
/admin/content/posts/[id]/preview
```

وتحقق ما يلي في الكود:

- `getAdminPageAccess("content.read")` قبل القراءة.
- القراءة من `editorialRepository.get` داخل مسار Admin، وليس من public published-only lookup.
- `robots: { index: false, follow: false }`.
- المحتوى غير المنشور لا يدخل public search أو sitemap أو public slug routes.
- public page/article routes تستخدم `status = published` و`publishedAt IS NOT NULL`.

**تقييم الأمان:** mechanism موجود ومتماسك على مستوى code contract، ولم يُنفذ authenticated browser E2E للتحقق من session/role الفعلية.

---

## 7. المراجعات والاستعادة

الموجود حاليًا:

- snapshot عند create/edit/status transition.
- revision list ببيانات version/date/actor.
- revision detail وpreview داخل Admin.
- restore محمي بـ`content.update` وSame-Origin و`expectedVersion`.
- restoration يكتب `status: "draft"` و`publishedAt: null`.
- restoration ينشئ revision جديدة ويسجل `restore_revision` في audit log.
- stale version يؤدي إلى conflict بدل overwrite صامت.

بذلك لا تقوم الاستعادة بالنشر تلقائيًا، ولا تتجاوز optimistic concurrency.

---

## 8. الاختبارات المنفذة

### Unit/contract tests

تم تشغيل:

```text
pnpm exec vitest run \
  tests/cms03-workflow.test.ts \
  tests/cms02-stability.test.ts \
  tests/phase17.19.3.test.ts \
  tests/phase17.19.4.test.ts
```

النتيجة:

```text
4 test files passed
32 tests passed
```

### Full local suite

```text
pnpm test       PASS — 50 test files, 493 tests
pnpm typecheck  PASS — tsc --noEmit
pnpm lint       PASS — 0 errors، تحذيران سابقان
pnpm build      PASS — Next.js 16.3.1، 82 routes generated
```

تحذيرا lint السابقان في `tests/phase17.18.15.test.ts` ولم تنتجهما هذه المرحلة:

- `getAiProductionReadinessReport` غير مستخدم.
- `AiGeneratedClaim` غير مستخدم.

### أنواع الأدلة

| النوع | الحالة |
|---|---|
| Unit/contract | منفذ وناجح |
| Integration على CMS database | غير منفذ في هذه الجلسة |
| Authenticated Admin E2E | غير منفذ |
| Public HTTP smoke | ليس جزءًا من هذه المرحلة الحالية ولم يُعد تشغيله |

لا يتم تقديم unit/source tests على أنها Admin E2E.

---

## 9. الملفات المتغيرة

### تغييرات Phase 17.20.03

- `lib/cms/editorialValidation.ts` — إضافة publish gate.
- `lib/cms/editorialRepository.ts` — منع scheduled transition وتطبيق publish gate.
- `tests/cms03-workflow.test.ts` — اختبارات workflow والحماية الجديدة.
- `docs/PHASE_17_20_03_EDITORIAL_WORKFLOW_REPORT.md` — هذا التقرير.

### آثار سابقة محفوظة

تظل ملفات Phase 17.19.31 وPhase 17.20.01 وPhase 17.20.02 غير المتعقبة/المعدلة كما كانت قبل بدء هذه المرحلة، ولم تُحذف أو تُستبدل.

---

## 10. Production وDeployment impact

```text
Production data changes: 0
Database migrations: 0
SQL/DDL/DML: 0
Seed/backfill: 0
Production accounts/sessions: 0
Media operations: 0
Email/provider changes: 0
Infrastructure changes: 0
Environment/secrets changes: 0
Deployment: 0
Git push: 0
```

التعديلات محلية على runtime validation/repository واختبارات فقط، ولم تُنشر.

---

## 11. Git قبل وبعد

### قبل التنفيذ

```text
Branch: main
HEAD: 9a98a1b7b40f4f24d858fe0d85da11923ee2cc25
Tracking: main...origin/main [ahead 2]
```

تم الحفاظ على:

- `b0c2863` — audit account security lifecycle.
- `9a98a1b` — design isolated credential lifecycle.
- جميع وثائق Phase 17.19.31 و17.20.01 و17.20.02.

### بعد التنفيذ

```text
Branch: main
HEAD: 9a98a1b7b40f4f24d858fe0d85da11923ee2cc25
Tracking: main...origin/main [ahead 2]
```

الملفات المعدلة/المضافة في شجرة العمل:

```text
 M lib/cms/editorialRepository.ts
 M lib/cms/editorialValidation.ts
 M tests/phase17.11.test.ts                 # من Phase 17.20.02، محفوظ
 M tests/phase17.19.1.test.ts               # من Phase 17.20.02، محفوظ
?? tests/cms02-stability.test.ts            # من Phase 17.20.02، محفوظ
?? tests/cms03-workflow.test.ts
?? docs/PHASE_17_19_31_INFRASTRUCTURE_SETUP.md
?? docs/PHASE_17_19_31_ISOLATION_VERIFICATION.md
?? docs/PHASE_17_20_01_CMS_AUDIT_REPORT.md
?? docs/PHASE_17_20_01_CMS_EVIDENCE_LOG.md
?? docs/PHASE_17_20_01_CMS_ROADMAP.md
?? docs/PHASE_17_20_02_CMS_STABILITY_REPORT.md
?? docs/PHASE_17_20_03_EDITORIAL_WORKFLOW_REPORT.md
```

لم يتم reset أو clean أو stash أو commit أو push.

---

## 12. القيود المعروفة والخطوة الآمنة التالية

المرحلة لا تُعلن اكتمال E2E لأن الوصول إلى Admin session وقاعدة اختبار CMS لم يكن متاحًا ضمن هذه الجلسة. قبل إعلان workflow Production-ready، يجب تنفيذ اختبار خارجي مصادق عليه على بيئة معزولة يثبت:

1. إنشاء Page وحفظه Draft.
2. إعادة فتحه وتعديل title/slug/content.
3. الانتقال إلى Review ثم Publish بصلاحية مناسبة.
4. رفض نفس الانتقالات دون الصلاحية أو من Origin غير مسموح.
5. منع Draft/Review/Trashed من public route/search/sitemap.
6. فتح Preview للمحرر المصرح فقط.
7. استعادة Revision والتحقق من بقاء السجل Draft.
8. التحقق من stale-version conflict.

لا ينبغي تنفيذ هذه الخطوات على Production دون تفويض وبيئة اختبار آمنة.

---

## 13. القرار النهائي

**PARTIAL**

تم تنفيذ التصحيح البرمجي الأدنى اللازم، وأصبح publish gate وscheduled restriction محميين server-side، ونجحت كل الاختبارات المحلية المطلوبة. لكن عدم وجود Admin E2E مصادق عليه أو تكامل CMS على قاعدة اختبار آمنة يمنع إعلان Complete وفق معيار عدم الخلط بين الاختبارات الوحداتية والـworkflow التشغيلي الكامل.

لم تبدأ أي مرحلة تالية.
