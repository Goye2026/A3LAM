# A3LAM | أعلام

# PHASE 17.18.6 — FINAL STATUS

| البند | الحالة |
|---|---|
| **Decision** | **PASS WITH LIMITATIONS** |
| **Critical blockers** | Production AI provider، private storage، malware scanner، queue worker، retention executor، OCR، وmigrations 0007–0009 ما تزال غير مهيأة أو غير مطبقة عمدًا. |
| **Editorial Workspace** | PASS — workspace متعدد الخطوات داخل `/admin/ai` مع مسار خاص ومراجعة بشرية. |
| **Isolated Mock Workflow** | PASS — local-only وdeterministic، بلا network أو inference حقيقي. |
| **Production AI** | DISABLED — kill switch صريح ومغلق افتراضيًا. |
| **Production Upload** | DISABLED — الرفع الإنتاجي محجوب، والـfile picker داخل العرض المحلي local-only فقط. |
| **Publication** | DISABLED — لا يوجد زر نشر ولا انتقال تلقائي. |
| **People/Profile creation** | 0 — لا ينشئ AI Draft أي Person أو Profile. |
| **Production mutations** | 0 — لا upload أو document/job/claim/review generation في Production. |
| **Tests** | PASS — 23 test files / 150 tests. |
| **Build** | PASS — 71/71 pages. |
| **Production smoke** | PASS — GET-only على المسارات المطلوبة؛ `/admin` anonymous = 307 وprotected AI API = 401 وprivacy scan = PASS. |
| **Git** | main، normal commits فقط، دون reset/rebase/force-push. |
| **Deployment** | PASS — functional deployment `dpl_CUhXrh2pGYG8fWRrG54Ez3uRfP9i` وverification deployment `dpl_6i33kabsNLEemqHUawNmCjpxCKtg` كلاهما READY على Production. |
| **Population** | 0 — لم تُنشأ بيانات أشخاص أو ملفات شخصية. |
| **Phase 18** | NOT STARTED. |

## 1. Executive Summary

حوّلت هذه المرحلة صفحة `/admin/ai` من شاشة capability/readiness إلى **Editorial Workspace** متعدد الخطوات يشرح للمحرر مسار إعداد مسودة مهنية مدعومة بالذكاء الاصطناعي من المستند حتى بوابة الجودة. المسار يحافظ على الحدود: **Private + Draft-only + Human-controlled + Production-AI-disabled**.

يدعم workspace اختيار ملف محلي بطريقة drag-and-drop أو file picker للتحقق المحلي فقط، وتشغيل عرض اصطناعي معزول، واستخلاصًا bounded، وعرض facts وevidence وconflicts، واختيار generation mode/language، وإنشاء draft عبر Mock Provider محلي، والمقارنة بين source fact وgenerated claim، ثم مراجعة claims وبوابة جودة تحريرية نهائية.

> **AI Draft ≠ Person، وAI Draft ≠ Profile، وAI Draft ≠ Published Content.**

## 2. Workspace Architecture

المكون الرئيسي هو `components/a3lam/ai/A3lamEditorialWorkspace.tsx`. ويُستورد داخل صفحة Admin المحمية الحالية بعد server-side authorization. تعتمد الواجهة على عقود `lib/ai/types.ts`، و`runGeneration` وquality gate الحاليين، بينما توجد بيانات العرض وMock Provider في `components/a3lam/ai/editorialDemo.ts`، ولا تُستورد هذه البيانات من public routes.

| الطبقة | التنفيذ |
|---|---|
| Admin access | صفحة `/admin/ai` الحالية مع authentication/RBAC server-side |
| Step state | client state محدود داخل workspace، بلا persistence Production |
| Local document | `A3lamDocumentUploader` مع `localOnly`؛ لا network ولا upload |
| Extraction display | synthetic bounded fixture مع sections/paragraphs/checksum/state |
| Fact review | ACCEPT/EDIT/REJECT/REQUEST_SOURCE مع original/reviewed value في الحالة المحلية |
| Generation | `runGeneration` الحالي عبر deterministic Mock Provider |
| Draft preview | source-backed/needs-verification/AI wording labels |
| Claim comparison | side-by-side على desktop وstacked على mobile |
| Claim review | ACCEPT/EDIT/REJECT/REQUEST_SOURCE داخل الحالة المحلية |
| Quality gate | PASS/WARNING/BLOCKED مع Publication BLOCKED دائمًا |
| Localization | مفاتيح عربية/إنجليزية ضمن `FoundationMessages` |

## 3. User Workflow

يعرض stepper واضحًا من سبع خطوات: **Document → Extraction → Facts → Generation → Draft → Claims → Review**. يستطيع المستخدم معرفة الخطوة النشطة، والخطوات المكتملة، وما إذا كانت الخطوة تحتاج مراجعة. توجد أزرار انتقال واضحة، وتُعطّل الإجراءات التي لا تملك مدخلات لازمة.

تبدأ التجربة بزر `تشغيل العرض المعزول`. هذا الزر لا ينشئ سجلًا في قاعدة البيانات ولا يرفع ملفًا ولا يرسل network request. أما اختيار الملفات المحلي فيقتصر على validation للامتداد والحجم وعرض اسم الملف، ولا يتحول إلى Production upload.

## 4. Step 1 — Document Intake

يعرض Step 1 مستندًا اصطناعيًا محددًا باسم `synthetic-arabic-cv.txt`، مع format وsize وstatus، ويعرض حدود PDF/DOCX/TXT وmax file size وlocal-only state. أُعيد استخدام `A3lamDocumentUploader` مع دعم drag-and-drop وfile picker عندما تكون `localOnly=true`، بينما يبقى uploader الإنتاجي disabled وفق kill switch والـdependency state.

لا يوجد fake upload progress. ولا يتم عرض أي نجاح للرفع الإنتاجي. إذا لم تكن البيئة مهيأة، تظل الرسائل صريحة حول configuration-required.

## 5. Step 2 — Extraction Workspace

يعرض Step 2 checksum اصطناعيًا، detected language، processing state، عدد sections والـparagraphs، قائمة الأقسام، والنص المستخرج داخل bounded scroll container. تظهر رسائل واضحة بأن PDF بلا text layer يحتاج OCR وأن OCR غير مهيأ، وأن DOCX يخضع لحدود archive/paragraph/table ويرفض الملفات غير الآمنة.

لا يدّعي هذا العرض OCR ولا يعرض extraction ناجحًا وهميًا لملف يحتاج OCR.

## 6. Step 3 — Fact Review

يعرض كل fact حقلًا وقيمة وثقة وتصنيفًا ومصدرًا ودليلًا وموقعًا وprovenance. يدعم ACCEPT وEDIT وREJECT وREQUEST_SOURCE. عند EDIT تُحفظ القيمة الأصلية وتظهر القيمة المراجعة في الحالة المحلية، مع actor/timestamp semantics محفوظة في عقود المراجعة الحالية عند استخدام persistence الفعلية.

لا يسمح الانتقال إلى Generation دون fact مقبول أو معدل واحد على الأقل. كما يظهر counter المراجعة بصيغة `reviewed / total` بدل عداد وهمي.

## 7. Evidence Viewer

يوفر كل fact عنصر `details/summary` يفتح excerpt المصدر وموقعه وoffsets وقسم المستند. عند غياب evidence تظهر رسالة `Evidence unavailable — verification required.` ولا يخترع المكون evidence أو source URL.

## 8. Conflict Handling

يتضمن Step 3 بطاقة تعارض اصطناعية واضحة تعرض `Source A` و`Source B` وقيمتين مختلفتين للحقل `experience.startDate` مع حالة `NEEDS HUMAN REVIEW`. لا تُخفى قيمة التعارض ولا تُمرّر كحقيقة مؤكدة.

## 9. Step 4 — Generation Configuration

يوفر Step 4 جميع أوضاع التوليد المطلوبة: `PROFESSIONAL_CV`، `PROFESSIONAL_PROFILE`، `A3LAM_PERSON_DRAFT`، `BIOGRAPHY`، و`SEO_DRAFT`. لكل وضع وصف تحريري localized. كما يوفر لغات `ARABIC` و`ENGLISH` و`BILINGUAL` و`SOURCE_LANGUAGE`.

يعرض الحاجز بوضوح أن المصادر يجب أن تكون مراجعة، وأن الخصوصية PASS، وأن Mock AI متاح للاختبار المعزول فقط، بينما Production AI disabled. لا يستدعي هذا المسار أي provider حقيقي.

## 10. Step 5 — Draft Generation and Preview

يستخدم زر `Create local draft` دالة `runEditorialDemo` التي تبني `AiGenerationInput` من facts المقبولة/المعدلة، ثم تمررها إلى `runGeneration` الحالي مع Mock Provider deterministic. النتيجة تحمل `DRAFT` وتخضع للـschema والـquality gate.

يعرض Preview العنوان واللغة والوضع والclaims المنظمة، مع تمييز `Source-backed` و`Needs verification` و`AI-generated wording needs review`. وعند اكتمال مراجعة claims المقبولة تصبح الحالة المنطقية **FINAL_PRIVATE_DRAFT**، وتظل Publication BLOCKED. لا يُنشأ Person أو Profile أو public page.

## 11. Source-to-Draft Comparison

يعرض Step 6 كل claim بصيغة:

> SOURCE FACT → GENERATED CLAIM → EVIDENCE → CONFIDENCE → REVIEW STATUS

على desktop يظهر المصدر والادعاء في عمودين متجاورين، وعلى mobile يتحول العرض إلى stacked cards. evidence يفتح داخل details ولا يُستبدل بنص غير موثق.

## 12. Step 6/7 — Claim Review

يوفر Claim Review الإجراءات الأربعة: Accept، Edit and accept، Reject، وRequest source. تحفظ الحالة محليًا في العرض فقط، ولا ينفذ هذا المكون POST أو mutation. يصبح claim المقبول `VERIFIED` داخل workflow المعزول، والمعدل `VERIFIED` مع value جديدة، والمرفوض `REJECTED`، وطلب المصدر `NEEDS_VERIFICATION`.

لا تستخدم الواجهة `Auto Verified` أو `AI Verified`. كل claim يبقى تحت human review حتى انتهاء الإجراء الصريح.

## 13. Editorial Quality Gate

تعرض خطوة Review مصفوفة deterministic للحالات PASS/WARNING/BLOCKED:

| البند | السلوك |
|---|---|
| Identity | PASS في synthetic demo |
| Sources | PASS فقط عند وجود fact reviewed |
| Evidence | WARNING إذا احتاجت الأدلة تحققًا إضافيًا |
| Conflicts | BLOCKED عند وجود conflict غير محلول |
| Claims | WARNING قبل اكتمال claim review، ثم PASS عند اكتماله |
| Completeness | PASS للمسودة الاصطناعية المحدودة |
| Privacy | PASS داخل boundary المعزول |
| Publication | BLOCKED دائمًا في هذه المرحلة |

لا تظهر حالة `PUBLISHABLE`، ولا يتحول draft إلى نشر تلقائيًا. وتعرض الواجهة رسالة: **هذا الملف مسودة خاصة ولم يتم نشره.**

## 14. RBAC and Privacy

لم تتغير permissions أو RBAC semantics. تبقى حماية `/admin/ai` server-side، وتبقى API routes الحالية محمية authentication وpermission وsame-origin. لا تعتمد الواجهة على إخفاء الأزرار كوسيلة أمن وحيدة.

البيانات الاصطناعية والـextracted text والـclaims والـreview state لا تدخل public routes أو search أو sitemap أو OG أو JSON-LD. المكون الجديد لا يحتوي `fetch` ولا ينفذ mutation أو external call.

## 15. Prompt Injection Boundary

الـfixture الحالي من Phase 17.18.5 يظل جزءًا من الاختبارات المحلية. يثبت الاختبار أن instruction-like text داخل document data لا يغير system instructions أو RBAC أو tools أو publication أو secrets. واجهة Phase 17.18.6 لا تعرض raw prompt ولا raw provider response.

## 16. Responsive Validation

أضيفت قواعد mobile-first لمساحات workspace، stepper أفقي bounded، grids تتحول إلى عمود واحد، source-to-draft comparison يتحول إلى stacked، وcontrols لا تتجاوز الشاشة. فحص Chromium authenticated على `https://a3-lam.vercel.app/admin/ai` أكد ظهور workspace والـstepper ذي السبع خطوات وlocal-only file picker وProduction-AI-disabled notice، ثم أكد تشغيل `تشغيل العرض المعزول` والانتقال إلى Step 2 — الاستخلاص مع bounded synthetic text وOCR/DOCX limitation notices.

هذا دليل Chromium على viewport الافتراضي فقط؛ لا يُدّعى PASS منفصل للمقاسات 390×844 و393×852 و768×1024 و1440×900. القياس الخارجي متعدد المقاسات وWCAG measured compliance ما يزال مطلوبًا.

## 17. Accessibility

يتضمن workspace semantic headings، `aria-labelledby`، `aria-current="step"`، `role="status"` للحالات، `role="alert"` للأخطاء/التعارض، labels للنماذج، focus-visible states، و`details/summary` للأدلة. لا يدّعي التقرير WCAG 2.2 AA measured compliance؛ القياس الخارجي ما يزال مطلوبًا.

## 18. Automated Tests

أضيف `tests/phase17.18.6.test.ts` ويغطي:

| الاختبار | النتيجة |
|---|---|
| local demo عبر generation quality gate | PASS |
| draft-only وعدم إنشاء Person/Profile/publication | PASS |
| bounded synthetic extraction وsource/evidence | PASS |
| accessible seven-step navigation | PASS |
| عدم وجود fetch أو production mutation في workspace | PASS |
| دمج المكون في `/admin/ai` والحماية الحالية | PASS |

التحقق الشامل الحالي: **23 test files / 150 tests PASS**.

## 19. Production Guard

يبقى `AI_PRODUCTION_ENABLED = false` افتراضيًا. لا يغير هذا الـworkspace environment variables أو secrets أو DNS. الرفع المحلي يستخدم `localOnly=true`، والـgeneration المحلي يستخدم Mock Provider فقط. لا توجد routes debug أو temporary production routes.

## 20. Production Verification

أُجري التحقق بعد deployment النهائي `dpl_6i33kabsNLEemqHUawNmCjpxCKtg` باستخدام GET فقط، دون upload أو generation أو review أو أي mutation. أعادت `/` و`/api/health` و`/categories` و`/search` و`/robots.txt` و`/sitemap.xml` الحالة HTTP 200. أعاد anonymous `/admin` الحالة 307 إلى `/admin/login?next=%2Fadmin`، وأعاد anonymous `/api/admin/ai/documents` الحالة 401 مع `application/json`. نجح public privacy scan ولم يجد raw document/prompt/provider/token/job-table indicators.

فحص Chromium authenticated read-only موثق في `docs/phase17.18.6-browser-evidence.md`. لا يمثل هذا الفحص تفعيلًا إنتاجيًا ولا يثبت تهيئة dependencies.

## 21. Data Safety Counters

| Counter | Value |
|---|---:|
| Production uploads | 0 |
| Production AI documents | 0 |
| Production processing jobs | 0 |
| Production AI inference calls | 0 |
| External provider calls | 0 |
| People created | 0 |
| Profiles created | 0 |
| Published AI profiles | 0 |
| Production mutations | 0 |
| Migrations executed | 0 |
| Secrets changed | 0 |
| Providers changed | 0 |
| Vercel configuration changed | 0 |
| DNS changes | 0 |

هذه القيم تخص تنفيذ Phase 17.18.6 الحالي فقط. لا تُستخدم لادعاء أن Production dependencies مهيأة.

## 22. Validation Commands

| الأمر | النتيجة |
|---|---|
| `pnpm install --frozen-lockfile` | PASS — lockfile up to date، pnpm 11.21.0 |
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS |
| `pnpm test` | PASS — 23 files / 150 tests |
| `pnpm build` | PASS — Next.js 16.3.1، 71/71 pages |
| `git diff --check` | PASS |
| `pnpm test:integration` | NOT RUN — ممنوع لأنه قد يشغل migrations/seed أو DB غير معزولة |

## 23. Limitations and Critical Blockers

لا تثبت هذه المرحلة وجود private storage أو malware scanner أو queue worker أو retention executor أو OCR أو provider حقيقي في Production. ولا تثبت performance/load testing أو browser compatibility خارج Chromium أو measured WCAG evidence.

Migrations `0007_phase17_16_media_architecture.sql` و`0008_phase17_18_2_ai_ingestion_review.sql` و`0009_phase17_18_4_ai_generation.sql` تبقى خارج Production ما لم تُفتح مهمة مستقلة صريحة. لا يجوز اعتبار Mock Provider أو isolated demo دليلًا على AI Production readiness.

## 24. Git and Deployment

تمت التغييرات على `main` وبـnormal commits فقط، دون reset أو rebase أو force-push. commit التنفيذ هو `86c529399265d11cb850b9888c209403b514ef72` (`feat: build AI editorial workspace`) ثم commit التوثيق هو `ac836d870766806bff735a9afdd924b3e3bd43b2` (`docs: record phase 17.18.6 verification`). كلاهما دُفع إلى `origin/main`، والتحقق النهائي أثبت `HEAD == origin/main` وworking tree clean.

Deployment مرتبط بمستودع Git في Vercel. أي فحص deployment يظل read-only، ولا يتضمن environment changes أو migrations أو provisioning.

## 25. Next Recommended Phase

الخطوة الموصى بها هي **Phase 17.18.7 مستقلة** لتهيئة integration environment فقط: private storage، malware scanning، queue worker، retention executor، OCR، provider sandbox، وmigrations في قاعدة معزولة. لا يبدأ ذلك تلقائيًا بهذه المرحلة، ولا يسمح بتحويل AI output إلى Person/Profile أو publication.

## 26. Mandatory Stop

بعد هذا التقرير يجب التوقف. لا تبدأ Phase 17.18.7 أو Phase 17.19 أو Population expansion أو Production AI activation أو provider/storage/scanner/queue provisioning أو migration execution أو Android أو VPS أو DNS أو Phase 18 دون تعليمات مستقلة وصريحة.
