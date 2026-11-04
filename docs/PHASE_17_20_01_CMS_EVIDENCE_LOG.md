# PHASE 17.20.01 — سجل الأدلة والقيود

**تاريخ التنفيذ:** 2 نوفمبر 2026

**نوع السجل:** Evidence log للتدقيق read-only.

**المستودع:** `/home/ubuntu/phase171929-repo`

**الفرع:** `main`

**الحالة عند انتهاء التدقيق:** `main...origin/main [ahead 2]`، والملفات الوحيدة غير المتعقبة هي وثائق Phase 17.19.31 السابقة لهذا التدقيق. لم تُعدّل ملفات source أو package أو lockfile أو schema خلال التدقيق.

---

## 1. أوامر التحقق المحلية

| الأمر | النتيجة | ملاحظة |
|---|---|---|
| `pnpm typecheck` | PASS | لا أخطاء TypeScript حسب السجل المحلي |
| `pnpm lint` | PASS | يوجد تحذير/تحذيرات موثقة في السجل؛ لم تُعدّل الشفرة لإزالتها |
| `pnpm test` | FAIL | 482 passed، 3 failed، 48 files؛ 46 files passed و2 failed |
| `pnpm build` | PASS | build المحلي اكتمل حسب السجل |

### الاختبارات الفاشلة

1. `tests/phase17.11.test.ts`
   - assertion يتوقع وجود `<HomepageTrust copy={publicCopy} />` كسلسلة نصية محددة.
   - التنفيذ الحالي يستورد ويستخدم `HomepageTrust`، لكن الاختبار لا يلتقط التركيب الفعلي بعد إعادة تنظيم JSX.
2. `tests/phase17.19.1.test.ts`
   - assertions متعلقة بتوقعات قديمة لـContent Registry/navigation.
   - التنفيذ الحالي يحتوي على Content Engine ومسارات/API، لكن contract الاختباري لا يطابق الحالة الحالية بالكامل.

**الاستنتاج:** لا يجوز إعلان CI/test health PASS بالكامل قبل معالجة هذه الفجوة. لا يوجد في هذا السجل تفويض لإصلاحها.

---

## 2. اختبارات النشر العام GET فقط

الهدف من هذه الطلبات هو smoke testing عام، وليس mutation أو اختبارًا مصادقًا عليه.

| الطلب | الحالة المرصودة |
|---|---|
| `GET https://a3-lam.vercel.app/` | 200، HTML `lang="ar" dir="rtl"` |
| `GET https://a3-lam.vercel.app/categories` | 200 |
| `GET https://a3-lam.vercel.app/search` | 200 |
| `GET https://a3-lam.vercel.app/api/health` | 200، `status=ok` |
| `GET https://a3-lam.vercel.app/api/categories` | 200، 10 categories في الاستجابة وقت الفحص |
| `GET https://a3-lam.vercel.app/api/search?q=ibn` | 200، 4 public items، من ضمنها `ibn-khaldun` |
| `GET https://a3-lam.vercel.app/sitemap.xml` | 200، 26 `<loc>` وقت الفحص |
| `GET https://a3-lam.vercel.app/robots.txt` | 200، `/admin/` و`/api/` محجوبان، وsitemap مذكور |
| `GET /page/phase-17-20-01-nonexistent` | 404 |
| `GET /article/phase-17-20-01-nonexistent` | 404 |
| `GET /admin` دون cookie | 200 بعد redirect إلى `/admin/login?next=%2Fadmin` |
| `GET /admin/content` دون cookie | 200 بعد redirect إلى صفحة الدخول |
| `GET /admin/categories` دون cookie | 200 بعد redirect إلى صفحة الدخول |

**حد الدليل:** لا يثبت هذا الجدول أن جلسة Admin صالحة أو أن mutations تعمل، ولا يثبت browser compatibility أو accessibility.

---

## 3. أدلة schema/code التي تمت مراجعتها

### CMS

- `drizzle/migrations/0010_phase17_19_3_content_engine.sql`
  - `cms_pages`
  - `cms_posts`
  - `cms_tags`
  - `cms_post_categories`
  - `cms_post_tags`
  - `cms_content_revisions`
- `lib/db/schema.ts`
  - Drizzle exports للكيانات السابقة.
- `lib/cms/editorialRepository.ts`
  - published-only reads.
  - revision snapshots.
  - version-based updates.
  - status transition logic.
  - sitemap/search helpers.
- `app/api/admin/cms/pages/**`
- `app/api/admin/cms/posts/**`
- `app/api/admin/cms/tags/**`
- `app/page/[slug]/page.tsx`
- `app/article/[slug]/page.tsx`

### Domain

- `drizzle/migrations/0001_a3lam_core.sql`
  - people/categories/person_categories/person_occupations/sources/person_sources/timeline/education.
- `drizzle/migrations/0003_phase13_profiles.sql`
  - accounts/sessions/profiles وملحقاتها وaudit logs.
- `drizzle/migrations/0007_phase17_16_media_architecture.sql`
  - media_assets/person_media.
- `lib/data/databaseRepository.ts`
  - public-only category/person reads.
  - hydration للعلاقات والمصادر والتعليم والتسلسل الزمني.
  - validation قبل public projection.
- `lib/domain/search.ts`
  - Arabic normalization: hamza/diacritics/ى/ؤ/ئ/ة/kashida.
- `app/person/[slug]/page.tsx`
  - Person JSON-LD، canonical، Open Graph، public-only profile resolution.

### Security/RBAC

- `lib/admin/rbac.ts`
- `lib/admin/http.ts`
- `lib/user/requestSecurity.ts`
- `app/api/admin/**`

### Media

- `lib/media/repository.ts`
- `lib/media/validation.ts`
- `lib/storage/provider.ts`
- `app/api/admin/media/route.ts`

### Site experience

- `lib/site-experience/config.ts`
- `lib/site-experience/repository.ts`
- `app/admin/(protected)/site/page.tsx`
- resources draft/published مع parsing وaudit.

---

## 4. ما لم يُنفذ

لم تُنفذ أي من العمليات التالية:

- production database write.
- DDL/DML.
- migration.
- seed/backfill/population.
- content creation/edit/publish.
- Admin mutation.
- file upload/delete.
- Vercel environment change.
- deployment.
- secret read/print/copy.
- external email send.
- provider configuration.
- rate-limit store provisioning.
- browser takeover أو authenticated admin E2E.

---

## 5. قيود الأدلة الحالية

- لا توجد جلسة Admin مصادق عليها متاحة في هذا التدقيق العام.
- لا توجد نتائج Firefox/Safari/WebKit/mobile/tablet أو screen-reader في هذا السجل.
- لا توجد قياسات contrast رقمية WCAG 2.2 AA.
- لا توجد أدلة فعلية على Postmark/Upstash/storage provider configured في بيئة rehearsal.
- لا توجد production DB metadata أو migration history جديدة مقروءة في هذا التدقيق.
- لا توجد اختبارات concurrency للـrevisions أو scheduled publishing أو token lifecycle.
- public search smoke يثبت الاستجابة فقط، لا جودة ranking الشاملة.
- عدد sitemap/categories هو snapshot وقت الفحص وليس invariant دائمًا.

---

## 6. مصفوفة الأدلة

| الادعاء | Evidence | الحكم |
|---|---|---|
| public health يعمل | `/api/health` HTTP 200 | مثبت جزئيًا |
| public categories endpoint يعمل | `/api/categories` HTTP 200 | مثبت smoke |
| Arabic public HTML | root response `lang=ar dir=rtl` | مثبت smoke |
| public search يعيد published items | `/api/search?q=ibn` وrepository gate | مثبت smoke/code |
| draft/review content لا يظهر | repository شرط published + nonexistent 404 | مثبت code/404، يحتاج E2E لحالة موجودة unpublished |
| CMS tables modeled | migrations/schema/repositories | مثبت code، لا يعني أن كل deployment محدث |
| Admin protected | public no-cookie redirects إلى login | مثبت smoke |
| Admin mutation secure | RBAC + same-origin code review | مثبت code، يحتاج negative E2E |
| media upload جاهز | provider abstraction + validation | PARTIAL؛ provider/upload غير مثبت |
| WordPress parity مكتملة | لا يوجد دليل كافٍ | غير مثبت |
| CI أخضر | test log فيها 3 failures | FAIL |

---

## 7. القرار

**AUDIT STATUS = PARTIAL**

الخطوة الآمنة التالية الوحيدة هي تنفيذ Phase مستقلة لإغلاق فشل الاختبارات وتثبيت CMS contracts قبل إضافة capabilities جديدة أو الإعلان عن WordPress-like parity.

لا يُسمح باستنتاج نجاح غير موجود من smoke tests العامة.
