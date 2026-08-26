# Phase 17.18.1 — A3LAM AI Profile Builder Security Boundaries

**التاريخ:** 26 أغسطس 2026
**الحالة:** Foundation only — لا يوجد inference أو upload أو persistence أو production mutation.

## 1. Security objective

هذه المرحلة لا تطلق نظام AI تشغيليًا؛ بل تثبت حدودًا أمنية وعقودًا قابلة للمراجعة. لا يجوز أن يتحول مستند خاص أو ناتج استخلاص مستقبلي إلى ملف شخصي عام دون مراجعة تحريرية بشرية ومسار النشر القائم.

> القاعدة الأساسية: لا يوجد provider call، ولا upload production، ولا persistence، ولا public projection لأي مستند أو extraction result في Phase 17.18.1.

## 2. Authorization and RBAC

صفحة `/admin/ai` محمية على الخادم عبر `getAdminPageAccess("system.read")` وإدارة Admin session/RBAC الحالية. لا يعتمد الوصول على إخفاء رابط الواجهة، ولا توجد permission vocabulary جديدة لأن المسار read-only ولا يملك mutation workflow.

| Boundary | Enforcement | Phase 17.18.1 state |
|---|---|---|
| Anonymous visitor | Admin page authorization | لا وصول؛ صفحة الإدارة لا تُعرض للعامة |
| Admin navigation | Existing `system.read` gate | يظهر الرابط فقط للمصرح له |
| Document upload | Server-side endpoint + storage authorization | غير موجود؛ uploader disabled |
| AI inference | Provider authorization and secret boundary | غير موجود؛ provider throws configuration-required |
| Public profile publication | Existing editorial lifecycle | لا يوجد draft أو profile ناتج |

عند إضافة persistence أو mutations مستقبلًا، يجب إنشاء permissions منفصلة مثل `ai.create` و`ai.review` فقط بعد مراجعة RBAC، وإعادة استخدام `requirePermissionPrincipal` وCSRF/error patterns الحالية.

## 3. Private document boundary

المستندات المتعاقد عليها هي PDF وDOCX وTXT فقط، وبحد أقصى 10 MB. يتحقق المسار من الامتداد وMIME والحجم والملف الفارغ والاسم الآمن وmagic bytes، ويرفض HTML وSVG وJavaScript والتنفيذيات والملفات الثنائية العشوائية. لا تُعاد ملفات الأصل إلى public URL، ولا تدخل sitemap أو search أو Open Graph أو public API.

في هذه المرحلة لا توجد `ai_documents` table ولا object-storage key ولا upload route. مدخل extractor هو `File` مؤقت داخل الذاكرة؛ TXT فقط له مسار deterministic محدود. PDF/DOCX يتحققان ثم يعيدان `DocumentExtractionUnavailableError` بدل تخمين النص أو إيهام المستخدم بأن parser موجود.

## 4. Provider and secret boundary

يُعبّر `lib/ai/provider.ts` عن interface مستقبلية فقط. حالة provider لا تعرض قيمة URL أو token ولا تعتبر env-shaped configuration دليلًا على جاهزية؛ لا يظهر `CONFIGURED` ما لم يوجد provider executable wired فعليًا. في الحالة الحالية تكون النتيجة `REQUIRES_CONFIGURATION`، و`unavailableAiProvider.run()` يفشل بصورة صريحة ولا يجري network call.

لا توجد model ID أو endpoint أو API key hard-coded، ولا يوجد استدعاء `invokeLLM` أو أي external AI API. أي تشغيل مستقبلي يجب أن يكون server-side فقط، مع allowlist provider وtimeouts وredaction للـlogs، وألا تُمرر الأسرار إلى client props أو audit payloads.

## 5. Extraction, provenance, and confidence

كل fact مستقبلي يحمل `provenance` و`confidence` و`classification`. `confidence` تصنيف تحريري (`high | medium | low | unknown`) وليس probability؛ و`AI_INFERRED` و`NEEDS_VERIFICATION` لا يتحولان تلقائيًا إلى verified fact. Excerpt المصدر محدود إلى 500 حرف، وsource URL يقبل HTTP(S) الآمن فقط.

المراجعة البشرية تعرض contract يتضمن field/value/source/confidence/classification/actions. واجهة Fact Review الحالية تعرض empty state فقط؛ لا توجد rows أو confidence أو extraction results مصطنعة.

## 6. Draft and publication gate

أي provider output مستقبلي مقيد نوعيًا بحالة `DRAFT`. المراجعة البشرية لا تعني النشر، وملكية profile لا تتجاوز editorial review. لا يوجد في Phase 17.18.1 زر accept/edit/reject يكتب إلى People/Profile، ولا endpoint يمكنه تجاوز gate.

## 7. Retention and deletion

يجب أن يحدد أي phase لاحق retention policy قبل إنشاء persistence: `uploaded → processing → processed → retained/private → archived → deleted`. يلزم أن تتضمن السياسة owner، مدة الاحتفاظ، deletion semantics، orphan cleanup، audit semantics، وحقوق الوصول. لا تُنشأ ملفات أو سجلات خاصة في Production الآن، لذلك لا توجد deletion job أو retention claim تشغيلية في هذه المرحلة.

## 8. Audit boundary

`lib/ai/audit.ts` يطابق typed AI vocabulary مع شكل `audit_logs` الحالي، ولا ينشئ audit system ثانيًا. لا تُكتب أحداث AI لأن لا توجد jobs أو documents أو facts محفوظة. عند تفعيل workflow، يجب تسجيل actor/action/entity/time مع reason عند الحاجة، وتجنب old/new values التي تحتوي أسرارًا أو document contents كاملة.

## 9. Public leakage controls

تستخدم public routes `getPublicMessages()` بدل تمرير `FoundationMessages` الكامل، وتثبت regression test أن مفاتيح `adminAi*` لا تدخل public projection. كما أن AI modules غير مستوردة من public person/category/search projection، ولا توجد AI records في sitemap أو public APIs.

يفصل هذا control بين نصوص الواجهة الإدارية وبين بيانات المستندات؛ وعند إضافة أي public-facing AI feature مستقبلًا يجب إجراء privacy review مستقل وعدم اعتبار وجود public copy تفويضًا لنشر extraction.

## 10. Migration and deployment safety

لم تُنشأ migration `0008` ولم تُنفذ أي migration في هذه المرحلة. Migration `0007` السابقة بقيت pending ولم تُمس. لا يوجد DB write أو seed أو production upload أو provider provisioning. Deployment يمر عبر Git push المعتاد، والتحقق التشغيلي المسموح هو GET/HEAD فقط.

## 11. Security acceptance checklist

| Check | Evidence/state |
|---|---|
| Server-side page authorization | `/admin/ai` uses existing `system.read` gate |
| No provider call | Provider abstraction only; no outbound call path |
| No secret exposure | Values are never read/displayed/logged; only state is surfaced |
| No production upload | Uploader is disabled; no AI upload endpoint exists |
| No public document/result projection | No AI persistence/schema/public route |
| No fake output/counters | Empty review workspace and null/`—` counters |
| Draft-first rule | Typed response is `DRAFT`; no publication mutation |
| Audit reuse | Typed mapping to existing `audit_logs`, no second store |
| Migration safety | No `0008`; no migration execution |
| Phase boundary | Population, 17.18.2, Phase 18, and provider provisioning not started |

## 12. Required gates before any future activation

قبل تفعيل provider أو upload، يجب تنفيذ schema/retention review، permissions review، malware/content scanning، object-storage private policy، signed internal access URLs، rate limiting، job isolation، retry/idempotency، structured-output validation، source traceability، reviewer UX، audit writes، deletion testing، وproduction canary read-only verification. هذه البنود توصيات لاحقة وليست أعمالًا منفذة ضمن Phase 17.18.1.
