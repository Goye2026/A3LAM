# PHASE 17.20.01 — تقرير تدقيق CMS الشامل

**المنتج:** A3LAM — أعلام

**النطاق:** تدقيق CMS الحالي مقابل الحد الأدنى العملي من قدرات WordPress الحديثة، مع مراجعة إدارة المحتوى، النشر، التصنيفات، الوسائط، البحث، SEO، الصلاحيات، وسلامة البيانات.

**تاريخ التدقيق:** 2 نوفمبر 2026

**نوع التدقيق:** Read-only code audit + local validation + public deployment smoke tests.

**القيود:** لم تُستخدم Production credentials، ولم تُنفذ mutations أو migrations أو SQL أو seed أو deployment. لم تُعدّل ملفات التطبيق. نتائج المتصفح/الأجهزة الخارجية، ورفع الوسائط الفعلي، واختبارات Admin authenticated end-to-end ليست مثبتة في هذه الجلسة.

---

## 1. الخلاصة التنفيذية

### القرار

**DECISION: PARTIAL — CMS صالح كقاعدة تحريرية أولية، لكنه غير جاهز بعد لادعاء WordPress-like parity أو Production CMS completeness.**

المنصة تمتلك أساسًا قويًا ومتماسكًا نسبيًا:

- Next.js App Router مع واجهة عربية RTL.
- PostgreSQL/Drizzle مع كيانات domain منفصلة وعلاقات واضحة.
- Content Engine فعلي للصفحات والمقالات والوسوم والتصنيفات والمراجعات.
- حالات تحريرية `draft → review → published → trashed` للصفحات والمقالات.
- publication gate يفصل البيانات المنشورة عن غير المنشورة.
- RBAC server-side وSame-Origin mutation protection.
- audit logging لعدد من العمليات الحساسة.
- Public Person JSON-LD وsitemap وcanonical/Open Graph metadata.
- إدارة مظهر ومحتوى للصفحة الرئيسية مع draft/published separation.
- Media schema وprovider abstraction وتحقق من نوع وحجم الملف.

لكن توجد فجوات تمنع اعتبار النظام CMS مكتملًا:

1. اختبار Vitest المحلي انتهى بـ **482 PASS و3 FAIL في 48 ملفًا**. الفشل ناتج عن اختبارات Phase 17.11/17.19.1 التي ما زالت تتوقع تركيبًا نصيًا قديمًا للصفحة الرئيسية وContent Registry، وليس عن فشل build/typecheck/lint.
2. سجل الاختبارات يثبت وجود عدم توافق بين بعض العقود الاختبارية الحالية والتنفيذ الموجود؛ يجب إصلاح الاختبارات أو توثيق سبب اعتمادها قبل اعتبار CI أخضرًا بالكامل.
3. `contentRegistry` يعلن Pages/Posts/Tags كـ `requires_configuration` أو editor unavailable في بعض الاختبارات/التعريفات، رغم وجود migration وrepositories وAPI ومسارات عامة فعلية. هذه فجوة contract/registry وليست دليلًا على غياب كل التنفيذ.
4. لا يوجد دليل كافٍ على محرر CMS متقدم قريب من Gutenberg: لا block editor عام، ولا media upload مدمج عام للصفحات والمقالات، ولا scheduled publishing worker مثبت.
5. إدارة المحتوى العامة لا تظهر في sitemap إلا إذا كانت published، وهذا صحيح، لكن لا توجد في الأدلة الحالية مراجعة متصفح authenticated تثبت دورة التحرير الكاملة من لوحة التحكم إلى النشر.
6. البحث عربي ويستخدم تطبيعًا عربيًا و`ILIKE`، لكنه ليس semantic/vector search ولا يثبت transliteration حقيقيًا أو ranking production-grade.
7. معظم دوال الإدارة تعتمد على PostgreSQL مباشرة من server-side repositories، لكن بعض الميزات تعتمد على جداول migrations اختيارية وتعرض fallback/Requires Configuration؛ يلزم سجل توافق واضح بين البيئة والهجرات.
8. الوسائط تعتمد على provider خارجي متغيراتُه server-only، ولا يمكن اعتبار الرفع جاهزًا دون تهيئة provider واختبار فشل/نجاح حقيقي.

### الحالة العامة حسب الطبقات

| الطبقة | الحالة | الحكم |
|---|---|---|
| Public read-only routes | **WORKING evidence** | `/`, `/categories`, `/search`, `/api/health`, `/api/categories`, `/api/search`, `/sitemap.xml` أعادت استجابات ناجحة في smoke test عام |
| Publication gate و404 للـCMS | **WORKING evidence** | المحتوى العام يُقرأ من published فقط، والصفحات/المقالات غير الموجودة أعادت HTTP 404 |
| Core data model | **IMPLEMENTED** | People/categories/sources/timeline/education/relationships الأساسية ممثلة في schema وrepositories |
| Admin CMS Pages/Posts | **IMPLEMENTED/PARTIAL** | APIs وrepositories وstatus/revisions موجودة؛ اكتمال editor المتقدم وE2E غير مثبت |
| Taxonomy | **IMPLEMENTED/PARTIAL** | Categories management وCMS tags موجودان، مع فجوات في الحذف/دمج taxonomy وسجل E2E |
| Media | **IMPLEMENTED/PARTIAL** | schema/provider/validation/attach موجودة؛ provider خارجي ورفع فعلي غير مثبتين |
| Search | **IMPLEMENTED/PARTIAL** | Arabic normalization وfilters وpublic API موجودة؛ لا semantic/transliteration/scale evidence |
| RBAC/security | **IMPLEMENTED/PARTIAL** | server-side permissions وsame-origin وaudit موجودة؛ يلزم اختبار اختراق/تدفق Admin كامل |
| SEO | **IMPLEMENTED/PARTIAL** | metadata/JSON-LD/sitemap/robots موجودة؛ يلزم validation لمحركات البحث وcanonical coverage |
| CI/test health | **BLOCKED** | 3 اختبارات فاشلة محليًا رغم نجاح typecheck/lint/build |

---

## 2. الأدلة الفعلية

### 2.1 التحقق المحلي

الأوامر المنفذة على المستودع:

```text
pnpm typecheck  → PASS
pnpm lint       → PASS مع تحذير موثق في سجل lint
pnpm test       → FAIL: 482 passed, 3 failed, 48 test files (46 passed, 2 failed)
pnpm build      → PASS
```

سجلا الفشل:

- `tests/phase17.11.test.ts`: فشل assertion واحد يتوقع `<HomepageTrust copy={publicCopy} />` بالشكل النصي القديم.
- `tests/phase17.19.1.test.ts`: فشلان مرتبطان بتوقعات Content Registry/navigation القديمة مقارنة بالتنفيذ الحالي.

هذه النتيجة لا تعني أن build أو typecheck فشلا؛ تعني أن suite الحالية ليست خضراء بالكامل.

### 2.2 النشر العام

تم استخدام GET عام فقط على `https://a3-lam.vercel.app`:

| المسار | النتيجة |
|---|---|
| `/` | HTTP 200، HTML عربي RTL |
| `/categories` | HTTP 200 |
| `/search` | HTTP 200 |
| `/api/health` | HTTP 200 و`status: ok` |
| `/api/categories` | HTTP 200، 10 تصنيفات في الاستجابة وقت التدقيق |
| `/api/search?q=ibn` | HTTP 200، أعاد 4 نتائج عامة، منها `ibn-khaldun` |
| `/sitemap.xml` | HTTP 200، 26 `<loc>` وقت التدقيق |
| `/robots.txt` | HTTP 200، يمنع `/api/` و`/admin/` ويشير إلى sitemap |
| `/page/phase-17-20-01-nonexistent` | HTTP 404 |
| `/article/phase-17-20-01-nonexistent` | HTTP 404 |
| `/admin` | أعاد التوجيه إلى `/admin/login?next=%2Fadmin` دون جلسة |
| `/admin/content` | أعاد التوجيه إلى صفحة الدخول دون جلسة |
| `/admin/categories` | أعاد التوجيه إلى صفحة الدخول دون جلسة |

هذه أدلة smoke عامة وليست إثباتًا لاختبار Admin authenticated أو browser/device compatibility.

---

## 3. مصفوفة WordPress-like parity

### رموز الحالة

- **IMPLEMENTED:** التنفيذ موجود ومسنود بالكود أو schema.
- **PARTIAL:** جزء مهم موجود، لكن توجد فجوة تمنع parity كاملة.
- **MISSING:** غير موجود أو غير مثبت.
- **BLOCKED:** لا يمكن إعلان الجاهزية بسبب فشل اختبار أو غياب تكامل/دليل مطلوب.
- **NOT IN SCOPE:** خارج النطاق الآمن الحالي أو يحتاج قرارًا معماريًا مستقلًا.

| المجال | الحد الأدنى المتوقع | الحالة | الدليل/الفجوة |
|---|---|---:|---|
| Content types | Pages, Posts, Tags, Categories | **IMPLEMENTED/PARTIAL** | `lib/cms/contentRegistry.ts`، migrations 0010، APIs؛ registry والاختبارات لا تتفق بالكامل مع التنفيذ |
| Page CRUD | إنشاء/قراءة/تعديل صفحة | **IMPLEMENTED/PARTIAL** | `app/api/admin/cms/pages/route.ts` و`[id]/route.ts` و`editorialRepository.ts`؛ E2E غير مثبت |
| Post CRUD | إنشاء/قراءة/تعديل مقال | **IMPLEMENTED/PARTIAL** | APIs وrepository موجودة؛ اكتمال editor غير مثبت |
| Taxonomy | Tags/Categories وربط المقال | **IMPLEMENTED** | `cms_tags`, `cms_post_categories`, `cms_post_tags` وواجهات الإدارة |
| Taxonomy lifecycle | حذف/دمج/إعادة تسمية آمنة | **PARTIAL** | تحديث وإنشاء موجودان؛ حذف/merge غير مثبتين، وFK تمنع بعض الحذف الخطِر |
| Status workflow | Draft/Review/Published/Trash | **IMPLEMENTED** | `editorialStatus.ts` وstatus routes؛ scheduling يحتاج worker/due-date execution |
| Scheduling | نشر مؤجل فعليًا | **MISSING/UNVERIFIED** | status `scheduled` موجود في العقود، لكن لا يوجد دليل worker/cron ينفذ النشر تلقائيًا |
| Revisions | حفظ واستعادة revisions | **IMPLEMENTED/PARTIAL** | `cms_content_revisions` وroutes؛ استعادة تعيد المحتوى إلى draft، وE2E غير مثبت |
| Preview | معاينة آمنة قبل النشر | **PARTIAL** | توجد contracts ومسارات للمحتوى، لكن لا توجد أدلة browser على preview token/preview mode مكتمل |
| Autosave | حفظ مسودة تلقائي | **MISSING/UNVERIFIED** | لا دليل على autosave مستقل؛ form dirty warning لا يعادل autosave |
| Editorial validation | منع نشر ناقص/غير صالح | **IMPLEMENTED** | `editorialValidation.ts` وpublication checks؛ يلزم تغطية كل نوع محتوى |
| Publication gate | منع ظهور draft/review للعامة | **WORKING evidence** | repositories تستخدم `status=published` و`publishedAt IS NOT NULL`؛ 404 smoke ناجح |
| Media library | إدارة أصول وmetadata | **IMPLEMENTED/PARTIAL** | media schema/repository/API وaudit؛ provider خارجي مطلوب |
| Generic media upload | رفع media لصفحات/posts | **PARTIAL** | endpoint الحالي يربط portrait بشخص ويتطلب `personId`; لا دليل upload عام للـCMS |
| Image safety | mime/size/dimensions/license | **IMPLEMENTED** | `lib/storage/validation.ts` وmedia validation وحقول attribution/license |
| Rich text | عرض آمن للمحتوى | **IMPLEMENTED/PARTIAL** | `CmsRichTextRenderer` و`BiographyContent`؛ لا دليل block editor كامل |
| Menus | إدارة navigation | **IMPLEMENTED/PARTIAL** | menu registry وsite experience navigation؛ يلزم اختبار loops/depth UI المستمر |
| Widgets/blocks | blocks/widgets قابلة للتركيب | **PARTIAL** | safe widget registry موجود؛ لا custom block builder ولا widget persistence عام |
| Theme/appearance | tokens/layout/template | **IMPLEMENTED/PARTIAL** | `site-experience/config.ts` وrepository؛ الموارد draft/published، والاختبار العام محدود |
| Homepage builder | ترتيب الأقسام وfeatured data | **IMPLEMENTED/PARTIAL** | homepage settings والربط العام موجود؛ suite لديها expectation قديم فاشل |
| Search | query/filter/sort | **IMPLEMENTED/PARTIAL** | `/api/search`، Arabic normalization، category/occupation/city/country؛ لا semantic/vector |
| Search indexing | index مستقل/cache | **MISSING** | البحث الحالي PostgreSQL `ILIKE` مع limits؛ لا Meilisearch/Elasticsearch evidence |
| Import/export | استيراد/تصدير محتوى | **MISSING** | لا route أو job مثبت في المسح |
| Users | user accounts/sessions/profiles | **IMPLEMENTED/PARTIAL** | migration 0003 وuser routes؛ لا lifecycle credential rehearsal مكتمل |
| Admin users | إدارة وتعطيل الجلسات | **IMPLEMENTED/PARTIAL** | routes users/sessions/administrators؛ اختبار privileged E2E غير مثبت |
| RBAC | صلاحيات server-side | **IMPLEMENTED** | `lib/admin/rbac.ts`, `admin/http.ts`, permission checks |
| Audit log | actor/time/entity/action | **IMPLEMENTED/PARTIAL** | `audit_logs` وتسجيل في repositories؛ تغطية كل mutation غير مثبتة |
| Comments | moderation/report/block | **MISSING/UNVERIFIED** | لا evidence كافٍ على module comments مكتمل في المسح |
| Corrections | correction workflow | **MISSING/UNVERIFIED** | لا evidence كافٍ على public correction submission/review ضمن CMS الحالي |
| Profiles/claiming | طلب ملكية ومراجعة | **PARTIAL** | user profiles موجودة؛ claiming/verification workflow الكامل غير مثبت |
| AI boundary | no auto-publish | **IMPLEMENTED** | `lib/ai/activation.ts` يبقي production/publication disabled وفق الاختبار |
| SEO metadata | title/description/canonical/OG | **IMPLEMENTED** | صفحات person/page/article تضبط metadata |
| JSON-LD | Person structured data | **IMPLEMENTED** | `app/person/[slug]/page.tsx` يخرج JSON-LD Person للمحتوى المرئي |
| Sitemap | public pages/posts/people/categories | **IMPLEMENTED/PARTIAL** | `app/sitemap.ts` يضم المنشور فقط؛ E2E freshness غير مثبت |
| Robots | admin/API exclusions | **IMPLEMENTED** | `/robots.txt` smoke ناجح |
| i18n | Arabic RTL, future English | **IMPLEMENTED/PARTIAL** | messages وdirection موجودان؛ تغطية English/LTR كاملة غير مثبتة |
| Accessibility | semantic/focus/keyboard | **IMPLEMENTED/PARTIAL** | semantic HTML وaria موجودان؛ لا browser/screen-reader evidence في هذه الجلسة |
| Observability | errors/audit/metrics | **PARTIAL** | safe errors وaudit وhealth موجودة؛ لا distributed tracing/alerting evidence |
| Rate limiting | distributed abuse protection | **MISSING/UNVERIFIED** | لا Upstash/Redis integration مثبتة في runtime الحالي |
| Email | transactional provider | **MISSING** | credential lifecycle design موجود؛ لا provider configured ولا send rehearsal |
| API | public/admin API contract | **PARTIAL** | APIs موجودة، لكن لا versioning/openapi/public access policy واضحة |
| Backup/recovery | restore-tested DB/media | **MISSING** | لا دليل backup/restore rehearsal |

---

## 4. المشاكل مرتبة حسب الأولوية

### P0 — يجب إغلاقها قبل إعلان CMS production-ready

1. **إعادة suite الاختبارات إلى اللون الأخضر:** إصلاح أو تحديث assertions المتقادمة في `tests/phase17.11.test.ts` و`tests/phase17.19.1.test.ts` بعد قرار واضح: هل الاختبار يقيس contract سلوكيًا أم تركيبًا نصيًا.
2. **تثبيت عقد Content Registry:** جعل registry، navigation، routes، permissions، واختبارات phase تتفق حول availability الفعلية لـPages/Posts/Tags.
3. **إثبات دورة Admin كاملة:** create → edit → review → preview → publish → public GET، مع منع draft/review من public routes.
4. **حسم scheduling:** إما تنفيذ worker/cron موثق وآمن، أو إزالة/تعطيل status scheduled من الواجهة حتى لا توحي بقدرة غير موجودة.
5. **تثبيت استراتيجية media:** provider منفصل، upload عام للـCMS أو توضيح أن media حاليًا people-only، مع tests لفشل provider وlicense metadata.

### P1 — قبل التوسع التحريري الكبير

1. تحسين البحث إلى PostgreSQL FTS أو محرك مستقل، مع Arabic normalization وtransliteration strategy وpagination/ranking.
2. إضافة correction workflow وmoderation أو توثيق عدم توفرهما.
3. إضافة preview tokens آمنة، وautosave اختياري، وrevision restore واضح.
4. توسيع إدارة taxonomy إلى archive/merge مع فحص العلاقات، بدل حذف مباشر.
5. تغطية audit لكل mutation ومنع تسريب القيم الحساسة.
6. إضافة test coverage للـRBAC matrix، sessions، failed mutations، CSRF/Same-Origin، وrate limiting.

### P2 — تحسينات parity طويلة الأجل

- block editor قابل للتركيب.
- import/export.
- public API versioning.
- background jobs/notifications.
- backups and restore drills.
- semantic search/knowledge graph.
- English/LTR verification.

---

## 5. مخاطر وتوصيات تشغيلية

- لا تعتمد على status `published` وحده؛ استمر في شرط `publishedAt` والتحقق من المصادر/التصنيفات المنشورة كما يفعل `validatePublishedRecord`.
- لا تُدخل صورًا تحريرية دون `sourceUrl`, `attribution`, و`license` واضحة.
- لا تفعّل AI publication أو provider دون human editorial review.
- لا تستخدم `DATABASE_URL` أو secrets في تقارير التدقيق أو logs.
- اجعل كل Admin mutation في transaction مع audit event؛ لا تسمح بـbulk publish غير المراجع.
- اعتمد smoke tests عامة بعد كل deployment، لكن لا تعتبرها بديلًا عن browser/device/accessibility tests.

---

## 6. الحكم النهائي

**A3LAM CMS في وضع `PARTIAL / NOT PRODUCTION-READY AS WORDPRESS PARITY`.**

الأساس المعماري مناسب للتوسع، والـpublic publication gate يعمل في الأدلة العامة الحالية، لكن لا ينبغي إعلان WordPress-like parity أو اكتمال Production CMS قبل إغلاق فشل الاختبارات، وتثبيت Content Registry contract، وإثبات دورة التحرير الموثقة والـmedia/search/scheduling capabilities.
