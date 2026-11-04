# PHASE 17.20.02 — CMS Stability & Content Registry Reconciliation

**المنتج:** A3LAM — أعلام

**التاريخ:** 2 نوفمبر 2026

**القرار النهائي:** **COMPLETE**

---

## 1. نطاق المرحلة

هذه المرحلة كانت مرحلة استقرار ومصالحة عقود فقط. لم تُنفذ إعادة تصميم لـCMS، ولم تُضف capability جديدة، ولم تُجرَ تغييرات على schema أو migrations أو Production أو البنية التحتية.

الأهداف المنفذة:

1. إعادة إنتاج الاختبارات الفاشلة الثلاثة.
2. تحديد السبب الفعلي لكل فشل.
3. مصالحة الاختبارات مع Content Registry والتنقل الحاليين.
4. إضافة اختبارات contract مركزة لحماية Pages وPosts وTags والنشر العام.
5. تشغيل كامل test/typecheck/lint/build.

---

## 2. الحالة قبل الإصلاح

تمت إعادة تشغيل `pnpm test` قبل أي تعديل. النتيجة:

```text
Test Files  2 failed | 46 passed (48)
Tests       3 failed | 482 passed (485)
```

### الفشل الأول

**الملف:** `tests/phase17.11.test.ts`

**الاختبار:** `renders trust and discovery as reusable public components`

**التوقع القديم:** وجود النص الحرفي:

```tsx
<HomepageTrust copy={publicCopy} />
```

**التنفيذ الفعلي:** المكوّن موجود ويُستخدم، لكنه يُمرر أيضًا خصائص `title`, `description`, و`style`:

```tsx
<HomepageTrust
  copy={publicCopy}
  title={homepage.about.title}
  description={homepage.about.description}
  style={sectionStyle(homepage, "about")}
/>
```

**التصنيف:** Obsolete test assertion.

**الإصلاح:** استبدال المطابقة الحرفية بـregex يتحقق من وجود `HomepageTrust` و`copy={publicCopy}` دون ربط الاختبار بترتيب الخصائص أو بقية JSX.

### الفشل الثاني

**الملف:** `tests/phase17.19.1.test.ts`

**الاختبار:** `keeps content types honest: domain entities are schema-backed and generic types are unavailable`

**التوقع القديم:** `page`, `post`, و`tag` في حالة `requires_configuration`.

**التنفيذ الفعلي:**

- `page` مسجل كـ`available` مع `cms_pages` ومسار `/admin/content/pages`.
- `post` مسجل كـ`available` مع `cms_posts` ومسار `/admin/content/posts`.
- `tag` مسجل كـ`available` مع `cms_tags` ومسار `/admin/content/tags`.
- المحرر في registry لا يزال `unavailable`، وهو وصف صادق لعدم وجود editor identifier مخصص في النوع، وليس غيابًا لمسارات الإدارة أو API.

**التصنيف:** Contract mismatch بين assertion قديم وregistry الحالي.

**الإصلاح:** تحديث التوقع إلى `availability: "available"` مع الإبقاء على `editor: "unavailable"` و`supportsPublication` كما هي.

### الفشل الثالث

**الملف:** `tests/phase17.19.1.test.ts`

**الاختبار:** `keeps admin navigation declarative, RBAC-filtered, and visibly unavailable where persistence is absent`

**التوقع القديم:** عنصر Pages في التنقل بحالة `requires_configuration`، مع عدم التحقق من Posts وTags.

**التنفيذ الفعلي:** التنقل يحتوي عناصر Pages وPosts وTags بمسارات فعلية وحالة `available`، وتخضع كلها لصلاحيات `content.read` أو `taxonomy.read`.

**التصنيف:** Contract mismatch.

**الإصلاح:** تحديث الاختبار إلى `available` والتحقق من Pages وPosts وTags الثلاثة، مع الحفاظ على اختبار RBAC الذي يثبت عدم ظهور مجموعة Users للمحرر.

---

## 3. مصفوفة Content Registry الموحدة

| المعرّف | مصدر الحقيقة | الجدول/المصدر | مسار الإدارة | عقد API/الخدمة | المسار العام | قواعد النشر | Search | Sitemap | العمليات الحالية |
|---|---|---|---|---|---|---|---|---|---|
| `person` | A3LAM domain model | `people` وعلاقاتها | `/admin/people` | people APIs و`personService`/`databaseRepository` | `/person/[slug]` | `people.status=published` مع تحقق العلاقات والمصادر | public people search فقط | الأشخاص المنشورون | read/create/update/review/publish/archive |
| `profile` | Professional profile domain | `profiles` وعلاقات Phase 13 | `/admin/profiles` | profile repository وprofile APIs | `/person/[slug]` | profile status/visibility المنشوران | `searchPublicProfiles` | public profiles | read/review/publish/archive |
| `category` | A3LAM taxonomy | `categories` | `/admin/categories` | categories APIs و`adminRepository` | `/categories`, `/categories/[slug]` | التصنيف المنشور مطلوب للعلاقات العامة | category filter | التصنيفات المنشورة | read/create/update |
| `page` | CMS editorial entity | `cms_pages` | `/admin/content/pages` | `editorialRepository` وPages APIs | `/page/[slug]` | `status=published` و`publishedAt IS NOT NULL` | `editorialRepository.searchPublished` | `listPublishedForSitemap("page")` | read/create/update/review/publish/archive/trash/revisions/preview |
| `post` | CMS editorial entity | `cms_posts` + category/tag joins | `/admin/content/posts` | `editorialRepository` وPosts APIs | `/article/[slug]` | `status=published` و`publishedAt IS NOT NULL` | `editorialRepository.searchPublished` | `listPublishedForSitemap("post")` | read/create/update/review/publish/archive/trash/revisions/preview |
| `tag` | CMS taxonomy | `cms_tags` | `/admin/content/tags` | Tags APIs وrepository | لا يوجد public tag route مثبت في هذه المرحلة | لا يُنشر ككيان عام مستقل | يستخدم كعلاقة Post، لا public projection مستقل | لا يدخل sitemap مستقلًا | read/create/update |

### ثوابت المصالحة

- People بقي كيانًا متخصصًا في نموذج A3LAM ولم يُحوّل إلى Post.
- Pages وPosts هما كيانا CMS منفصلان عن People/Profile.
- Categories الخاصة بـA3LAM بقيت منفصلة عن `cms_tags`.
- البحث العام لا يقرأ draft/review/trashed للمحتوى التحريري.
- sitemap يضيف صفحات ومقالات منشورة فقط.
- `contentRegistry` و`adminNavigation` يعكسان توفر المسارات الحالية، مع إبقاء `editor: "unavailable"` كتسمية دقيقة لغياب محرر معرف خاص في النوع.

---

## 4. التصحيحات المنفذة

### الملفات المتتبعة المعدلة

1. `tests/phase17.11.test.ts`
   - جعل assertion HomepageTrust مرنًا تجاه خصائص JSX الإضافية.
2. `tests/phase17.19.1.test.ts`
   - تحديث availability المتوافق مع registry الحالي.
   - تحديث توقعات Admin navigation لـPages وPosts وTags.
   - تحديث أسماء الاختبارات لتعكس العقد الحقيقي بدل وصف قديم.

### ملف الاختبار المضاف

3. `tests/cms02-stability.test.ts`
   - يثبت ارتباط كل نوع CMS بجدول التخزين ومسار الإدارة.
   - يثبت حماية APIs بصلاحيات server-side.
   - يثبت published-only projection للمحتوى العام والبحث وsitemap.
   - يثبت بقاء People خارج أنواع CMS العامة مع الحفاظ على عقود النشر للصفحات والمقالات.

لم تُعدّل ملفات runtime أو schema أو migrations أو package files.

---

## 5. اختبارات regression المضافة/المحافظة عليها

الاختبار الجديد يحقق الحد الأدنى المطلوب لهذه المرحلة:

- Pages behavior contract.
- Posts/articles behavior contract.
- Tags behavior contract.
- Content Registry consistency.
- Published-only public projection.
- Draft/unpublished exclusion عبر شروط repository.
- Search integration.
- Sitemap integration.
- People specialized domain boundary.

كما تم الحفاظ على الاختبارات السابقة الخاصة بالـHomepage وpublication firewall وRBAC وpublic routes دون حذف أو إضعاف assertions أمنية.

---

## 6. نتائج التحقق الكامل بعد الإصلاح

```text
pnpm test       PASS — 49 test files, 488 tests
pnpm typecheck  PASS — tsc --noEmit
pnpm lint       PASS — 0 errors، مع تحذيرين pre-existing في tests/phase17.18.15.test.ts
pnpm build      PASS — Next.js 16.3.1، توليد 82 صفحة ثابتة/ديناميكية بنجاح
```

### تحذيرات lint الموجودة

التحذيران في:

- `tests/phase17.18.15.test.ts:7` — `getAiProductionReadinessReport` غير مستخدم.
- `tests/phase17.18.15.test.ts:11` — `AiGeneratedClaim` غير مستخدم.

لم تُعدّل هذه المرحلة هذا الملف لأن التحذيرات خارج نطاق Tasks A–C، ولا تمنع lint من النجاح.

---

## 7. القيود المتبقية

هذه المرحلة لم تنفذ ميزات جديدة، ولذلك تبقى النقاط التالية خارج نطاقها:

- لا يوجد قرار تنفيذي جديد حول scheduled publishing worker.
- لا يوجد generic CMS media upload جديد.
- لا يوجد block editor أو Gutenberg implementation.
- لا يوجد import/export أو semantic search.
- لا توجد corrections/comments/claiming implementation جديدة.
- لا توجد اختبارات browser أو screen-reader أو Production Admin authenticated.
- لا توجد تغييرات على credential lifecycle أو Postmark أو Upstash.

هذه ليست blockers لهذه المرحلة، لكنها تبقى متطلبات phases لاحقة قبل ادعاء parity كاملة.

---

## 8. Git قبل وبعد

### قبل التنفيذ

```text
Branch: main
HEAD: 9a98a1b docs: design isolated credential lifecycle
Tracking: main...origin/main [ahead 2]
Uncommitted pre-existing files:
  docs/PHASE_17_19_31_INFRASTRUCTURE_SETUP.md
  docs/PHASE_17_19_31_ISOLATION_VERIFICATION.md
  docs/PHASE_17_20_01_CMS_AUDIT_REPORT.md
  docs/PHASE_17_20_01_CMS_EVIDENCE_LOG.md
  docs/PHASE_17_20_01_CMS_ROADMAP.md
```

تم التحقق من بقاء commits التالية:

- `b0c2863 docs: audit account security lifecycle`
- `9a98a1b docs: design isolated credential lifecycle`

### بعد التنفيذ

```text
Branch: main
HEAD: 9a98a1b docs: design isolated credential lifecycle
Tracking: main...origin/main [ahead 2]
Tracked modified:
  tests/phase17.11.test.ts
  tests/phase17.19.1.test.ts
Untracked added:
  tests/cms02-stability.test.ts
Pre-existing documentation remains unmodified:
  docs/PHASE_17_19_31_INFRASTRUCTURE_SETUP.md
  docs/PHASE_17_19_31_ISOLATION_VERIFICATION.md
  docs/PHASE_17_20_01_CMS_AUDIT_REPORT.md
  docs/PHASE_17_20_01_CMS_EVIDENCE_LOG.md
  docs/PHASE_17_20_01_CMS_ROADMAP.md
```

لم يتم إنشاء commit أو تنفيذ push لأن التعليمات منعت Git push ولم تطلب إنشاء commit.

---

## 9. تأكيد السلامة

- Database migrations: `0`
- Schema changes: `0`
- DDL/DML: `0`
- Seed/backfill: `0`
- Production data mutations: `0`
- Production account/session changes: `0`
- Media upload/deletion: `0`
- Email sending: `0`
- Neon/Postmark/Upstash/Vercel changes: `0`
- Environment variable/secret changes: `0`
- Production deployment: `0`
- Git push: `0`
- Unrelated UI/runtime functionality changes: `0`

---

## 10. القرار النهائي

**COMPLETE**

تم حل الاختبارات الثلاثة لأسباب موثقة وصحيحة، وأصبحت مجموعة الاختبارات الكاملة ناجحة. تم تثبيت عقد Content Registry مع التنفيذ الحالي وإضافة regression contracts مركزة، مع الحفاظ على People ككيان A3LAM متخصص، ودون أي تغيير في قاعدة البيانات أو Production أو البنية التحتية.

المرحلة التالية، إن تم تفويضها لاحقًا، يجب أن تبدأ من هذا baseline ولا تُعتبر جزءًا من Phase 17.20.02.
