# PHASE 17.20.01 — خارطة طريق CMS التنفيذية

**الحالة الحالية:** `PARTIAL / NOT PRODUCTION-READY AS WORDPRESS PARITY`

**الهدف:** تحويل Content Engine الحالي إلى CMS تحريري موثوق وقابل للإدارة، دون خلط prototype مع production readiness.

---

## مبادئ التنفيذ

1. لا migration أو runtime code إلا ضمن phase منفصلة بتفويض صريح.
2. كل capability يجب أن تملك: schema contract، permission contract، UI states، API/server action، audit event، tests، وpublic publication rule.
3. لا تُعرض أي capability في UI كمتاحة إذا كانت `requires_configuration` أو غير مثبتة.
4. كل نشر يمر بـ Draft → Review → Preview → Published، مع بقاء draft/review خارج public projection.
5. accuracy/security قبل visual polish.
6. لا تستخدم بيانات synthetic أو مصادر مختلقة في المحتوى التحريري.

---

## خارطة الطريق

| Phase | الهدف | نطاق التنفيذ | مخرجات القبول |
|---|---|---|---|
| 17.20.01-A | Test/Contract Baseline | تحليل وإصلاح التباين بين registry/navigation/routes/tests | `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` كلها PASS؛ لا تغيير schema |
| 17.20.01-B | CMS Editorial Core | Pages/Posts editor موحد، validation، drafts، review، preview، publish | E2E موثق لكل دورة، publication gate، audit، optimistic concurrency |
| 17.20.01-C | Scheduling | قرار صريح حول scheduled status ثم worker آمن أو تعطيل status | لا scheduled UI بلا executor؛ اختبار timezone/retry/idempotency |
| 17.20.01-D | Revisions | revision list، diff، restore، reason، actor | استعادة draft لا تنشر تلقائيًا؛ audit وversion conflict tests |
| 17.20.01-E | Taxonomy | tags/categories CRUD، archive/merge، relationship safety | لا فقدان لعلاقات people/posts؛ uniqueness وslug redirect |
| 17.20.01-F | Media | provider abstraction موثق، media library، generic CMS attachment، license metadata | upload/delete/archive tests، MIME/size/license، cleanup on DB failure |
| 17.20.01-G | Search | Arabic normalization، FTS/index، filters، ranking، pagination | Arabic variants، exact/partial، load test، no unpublished leakage |
| 17.20.01-H | Editorial Governance | corrections، comments moderation، profile claiming/verification | workflows كاملة، permissions، audit، spam/rate limit |
| 17.20.01-I | Security Hardening | distributed rate limiting، credential recovery، invitations، email sandbox | rehearsal isolated فقط، no Production secrets، concurrency/replay tests |
| 17.20.01-J | SEO/Accessibility | structured data، canonical/OG، sitemap، WCAG/browser checks | measured contrast، screen reader، Chromium/Firefox/WebKit/mobile/tablet |
| 17.20.01-K | Operations | backups، restore، observability، alerts، API docs | restore evidence، health checks، runbooks، incident response |

---

## Phase A — إغلاق الاختبارات والعقود

### المشكلة

التحقق المحلي الحالي:

```text
pnpm typecheck  PASS
pnpm lint       PASS مع تحذير موثق
pnpm test       FAIL: 482 passed / 3 failed / 48 files
pnpm build      PASS
```

الاختبارات الفاشلة:

- `tests/phase17.11.test.ts` — assertion تركيبية قديمة في homepage.
- `tests/phase17.19.1.test.ts` — assertions قديمة حول Content Registry/navigation.

### خطة الإغلاق

1. تحديد ما إذا كانت assertions تقيس behavior أو source shape.
2. استبدال assertions النصية الهشة باختبارات contracts قابلة للتغيير عند الإمكان.
3. تثبيت تعريف واحد لـavailability:
   - `available`
   - `requires_configuration`
   - `not_available`
4. جعل `contentRegistry`, `adminNavigation`, routes، permissions، والمستندات متطابقة.
5. منع merge/deploy إذا فشل `pnpm test`.

### Acceptance

- صفر failed tests.
- لا test skip غير موثق.
- لا تغيير للـtoolchain أو migrations ضمن هذه الخطوة.

---

## Phase B — التحرير والنشر

### القدرات المطلوبة

- Page/Post list مع status filter وsearch وpagination.
- Create/Edit forms مع schema validation server-side.
- Draft save، Review transition، Preview، Publish، Trash/Restore.
- Revision snapshot قبل كل mutation مهمة.
- optimistic concurrency عبر `version`.
- slug uniqueness وredirect history عند تغيير slug المنشور.
- منع publish إذا كان content أو metadata غير صالح.
- audit event لكل transition.

### Acceptance workflow

```text
Create Draft
→ Save
→ Submit Review
→ Preview as non-public
→ Approve/Publish
→ Public GET 200
→ Edit published item
→ New revision + Draft/Review
→ Old public version remains stable until publish
```

### حالات يجب اختبارها

- غير مصادق عليه.
- مصادق عليه بلا permission.
- same-origin failure.
- duplicate slug.
- stale version.
- missing migration.
- DB transaction failure.
- public access to draft/review/trashed.

---

## Phase C — Scheduling

الحالة الحالية لا تثبت وجود worker ينفذ scheduled status.

يجب اختيار أحد القرارين:

### الخيار الموصى به

تنفيذ scheduler idempotent:

- `publish_at` واضح ومخزن UTC.
- job يلتقط العناصر due فقط.
- conditional update يمنع النشر المكرر.
- retry/backoff مع dead-letter أو audit failure.
- لا يعتمد على request زائر لتفعيل النشر.
- timezone policy موثقة.

### البديل الآمن

إزالة scheduled من واجهة المستخدم والعقود العامة حتى يتم تنفيذ scheduler فعلًا.

---

## Phase D — Media

الحالة الحالية:

- schema وrepository وvalidation موجودة.
- provider خارجي يعتمد على `A3LAM_STORAGE_UPLOAD_URL`, `A3LAM_STORAGE_PUBLIC_BASE_URL`, `A3LAM_STORAGE_UPLOAD_TOKEN`.
- endpoint الحالي يركز على portrait مربوط بشخص.

### المطلوب

1. تقرير provider state دون كشف secrets.
2. Media library عامة للمحرر مع attach/detach آمن.
3. generic asset attachment للصفحات والمقالات عند الحاجة.
4. immutable metadata: source URL، attribution، license.
5. منع public exposure للأصل private/archived.
6. cleanup إذا نجح upload وفشلت DB transaction.
7. منع archive إذا كان asset مستخدمًا، أو تنفيذ detach workflow صريح.
8. اختبارات file size/mime/dimensions/path traversal/external URL safety.

---

## Phase E — البحث

الحالة الحالية:

- تطبيع عربي في `lib/domain/search.ts`.
- PostgreSQL `ILIKE` في `databaseRepository.ts`.
- public API يدعم query/category/occupation/city/country ويضم editorial records المنشورة.

### المطلوب المرحلي

1. إبقاء `published` gate داخل كل query.
2. إضافة pagination وcursor/limit واضح.
3. إضافة PostgreSQL FTS أو index مناسب قبل التوسع العددي.
4. تعريف transliteration policy بدل الادعاء بأنها موجودة.
5. ranking exact > normalized exact > prefix > contains.
6. اختبارات أسماء عربية بأشكال همزات/تنوين/تاء مربوطة.
7. load test وquery timeout.
8. قرار لاحق بشأن Meilisearch/Elasticsearch/vector search.

---

## Phase F — الحوكمة التحريرية

### Corrections

- نموذج correction مستقل عن comments.
- status: submitted → triaged → needs changes → accepted/rejected.
- source URL ودليل التغيير.
- عدم تعديل public record مباشرة من المستخدم.
- audit actor/reason.

### Comments

- moderation queue.
- report/spam protection.
- block/delete policy.
- rate limit.
- عدم خلط comment status مع publication status.

### Profile claiming

- claim request.
- identity/professional verification.
- Admin review.
- verified person يستطيع اقتراح updates فقط.
- لا bypass للمراجعة التحريرية.

---

## Phase G — الأمن والبنية المعزولة

تبقى Phase 17.19.30/31 منفصلة عن تنفيذ parity العام:

- PostgreSQL معزول.
- Postmark Sandbox Server منفصل.
- HTTPS callback منفصل.
- Upstash/Redis منفصل.
- test identities منفصلة.
- لا Production credentials.
- لا migration على Production.

يرجى استخدام:

- `docs/PHASE_17_19_30_CREDENTIAL_LIFECYCLE_REHEARSAL.md`
- `docs/PHASE_17_19_31_INFRASTRUCTURE_SETUP.md`
- `docs/PHASE_17_19_31_ISOLATION_VERIFICATION.md`

كمرجع تشغيل مستقل، ولا تُخلط هذه rehearsal مع CMS content rollout.

---

## Phase H — SEO/accessibility/performance

### SEO

- Person JSON-LD يجب أن يعكس visible content فقط.
- canonical ثابت مع slug redirects.
- sitemap للمنشور فقط.
- noindex للـadmin/search حسب السياسة.
- Open Graph image آمن ومتاح.
- اختبار Rich Results وURL inspection خارجيًا.

### Accessibility

- keyboard navigation.
- focus-visible.
- form labels/errors.
- live regions للحفظ.
- modal semantics.
- screen reader Arabic.
- contrast measured WCAG 2.2 AA.
- reduced motion.

### Performance

- pagination لا تحميل آلاف السجلات.
- `Promise.all` بحذر مع DB limits.
- caching/invalidation للpublic snapshots.
- image optimization.
- timeout/fallback monitoring.

---

## ترتيب التنفيذ المقترح

1. إغلاق 3 اختبارات فاشلة وتثبيت registry contract.
2. توثيق/تنفيذ Admin E2E لـPages/Posts.
3. حسم scheduled status.
4. إكمال revisions/preview.
5. إكمال taxonomy lifecycle.
6. حسم media provider وgeneric CMS media.
7. تحسين البحث وpagination.
8. إضافة corrections/comments/claiming.
9. تنفيذ isolated credential rehearsal.
10. إغلاق external accessibility/browser/SEO evidence.
11. backups/restore/observability.

---

## Definition of Done لـCMS Production

لا يُعلن CMS جاهزًا إلا إذا تحققت جميع النقاط التالية:

- `pnpm install --frozen-lockfile` PASS.
- `pnpm typecheck` PASS.
- `pnpm lint` PASS دون warnings غير مبررة.
- `pnpm test` PASS بلا failed tests.
- `pnpm build` PASS.
- Admin E2E موثق لكل content type.
- Publication gate مثبت بالـpublic GET.
- Draft/review/trashed غير قابل للوصول العام.
- RBAC matrix مثبتة server-side.
- audit لكل mutation حساس.
- media failure/rollback مثبت.
- scheduled behavior مثبت أو غير معروض.
- search لا يعرض unpublished.
- sitemap/robots/JSON-LD validated.
- browser/mobile/screen-reader/contrast evidence مكتملة.
- backup/restore rehearsal مكتملة.
- لا secrets في logs أو client bundle.

**الحالة الحالية:** لا تتحقق Definition of Done بعد.
