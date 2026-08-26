# Phase 17.18.1 — A3LAM AI Profile Builder Architecture

**التاريخ:** 26 أغسطس 2026
**الحالة:** Foundation only — no external AI inference, no Production upload, no Production mutation.

## 1. Architectural Intent

A3LAM AI هو مسار داخلي مستقبلي لتحويل مستندات خاصة إلى معلومات منظمة قابلة للمراجعة البشرية. لا يُعامل AI كنظام نشر، ولا تُعتبر مخرجات الاستخلاص حقائق منشورة. المسار المنطقي هو:

> Document → Validation → Extraction → Normalized Text → Structured Facts → Provenance + Confidence + Classification → Human Review → Draft Profile → Existing Editorial Review → Published Profile

Foundation الحالية تجهز العقود والحدود فقط. لا تُرسل ملفات إلى provider خارجي، ولا تُنشئ بيانات أشخاص أو profiles، ولا تعرض نتائج اصطناعية. الصفحة الإدارية محمية server-side بـ`system.read` وتبقى read-only.

## 2. Reuse Decisions

| Concern | Decision |
|---|---|
| Authentication | إعادة استخدام Admin session الحالية و`requirePermissionPrincipal`؛ لا يوجد auth جديد. |
| RBAC | `/admin/ai` read-only يستخدم permission الحالية `system.read`; لا توجد `ai.*` permissions أو mutation endpoints في هذه المرحلة، وتُحجز vocabulary المستقبلية عند تنفيذ عمليات فعلية. |
| Audit | إعادة استخدام شكل `audit_logs` الحالي عبر typed event contract؛ لا يوجد audit system ثانٍ. |
| Storage | إعادة استخدام storage provider الحالي؛ AI documents private by default ولا تُرفع في هذه المرحلة. |
| Privacy | public projection الحالية لا تتلقى أي AI document أو extraction result. |
| Publication | لا lifecycle جديد؛ أي draft مستقبلي يدخل `draft` ثم review التحريري الحالي. |
| Persistence | لا migration في 17.18.1؛ لا توجد ingestion jobs أو facts محفوظة حتى يتوفر provider/upload/review workflow فعلي. |
| Extraction | abstraction قابلة للاستبدال؛ TXT يمكن دعمه محليًا كتحويل deterministic في الذاكرة، بينما PDF/DOCX يعيدان unavailable إلى أن يُضف extractor معتمد. |

## 3. Contracts

### 3.1 Document ingestion

`DocumentIngestionService` يفصل validation عن extraction وعن normalization. المدخل هو `File` خاص مؤقت؛ الناتج هو `DocumentExtractionResult` غير منشور يحتوي metadata وnormalized text وextractor identity. لا يحتفظ المسار بالـbytes بعد انتهاء العملية، ولا يكتب إلى DB أو storage في هذه المرحلة.

الأنواع المسموح بها هي PDF وDOCX وTXT، مع تحقق MIME والامتداد والحجم والملف الفارغ وmagic bytes والاسم المنظف. SVG وHTML وJavaScript والتنفيذيات والملفات الثنائية العشوائية مرفوضة.

### 3.2 Structured profile

`StructuredProfileDraft` هو contract داخلي يشمل Identity وProfessional وEducation وCareer وAchievements وAwards وPublications وSkills وLanguages وLinks وSources. الحقول لا تُعتبر صالحة للنشر بمجرد وجودها؛ كل fact قابل للمراجعة يحمل classification وconfidence وprovenance.

### 3.3 Provenance

كل fact يدعم مصدرًا من الأنواع `document`, `user`, `editor`, `external-source`, أو `ai-inferred`. يدعم مصدر المستند page/section وexcerpt قصير محدود الطول. لا تُحفظ excerpts طويلة أو credentials أو URLs غير موثوقة.

### 3.4 Confidence and classification

Confidence هو تصنيف تحريري `high | medium | low | unknown` وليس احتمالًا علميًا أو نسبة دقة. Fact classification هو `EXTRACTED | USER_PROVIDED | EDITOR_VERIFIED | AI_INFERRED | NEEDS_VERIFICATION`. `AI_INFERRED` و`NEEDS_VERIFICATION` لا يجوز أن يتحولا تلقائيًا إلى حقائق منشورة.

### 3.5 Provider

`AIProfileProvider` يعرّف العمليات المستقبلية `extractProfile`, `improveProfile`, `generateBiography`, `generateCV`, `generateSEO`، مع output types محددة. حالة provider مشتقة typed من environment configuration فقط، وتبقى `REQUIRES_CONFIGURATION` عند غياب config أو عدم صلاحيتها. لا تُقرأ أو تُعرض قيم الأسرار، ولا يُستدعى provider في 17.18.1.

## 4. Human Review

`HumanReviewWorkspace` contract يعرض لكل fact: field، value، source، confidence، classification، وallowed actions. الإجراءات المستقبلية هي accept/edit/reject/mark verified/mark for verification، لكنها لا تُنفذ في هذه المرحلة ولا يوجد زر ينشر أو يكتب إلى People/Profile.

أي output مستقبلي يظل draft. الملكية أو المراجعة البشرية لا تتجاوز editorial publication review الموجود.

## 5. Data Retention

المستندات الخاصة تسير مستقبلًا عبر `uploaded → processing → processed → retained/private → archived → deleted`. لا deletion تلقائي في Production ضمن هذه المرحلة، ولا retention دائم بلا سياسة صريحة. لا يظهر original document في public URL أو sitemap أو search أو OG أو public API.

## 6. Persistence Decision

لم تُنشأ migration `0008` لأن foundation المطلوبة يمكن تنفيذها بعقود pure وworkspace read-only دون سجلات تشغيل فعلية. إنشاء migration الآن سيُنتج جداول فارغة بلا provider أو upload أو review workflow حقيقي، ويزيد سطح البيانات الخاصة دون فائدة تشغيلية. إذا احتاجت المرحلة التالية persistence فعلية، تُنشأ migration additive منفصلة بعد قرار schema ومراجعة retention وdeletion/audit semantics، ولا تُطبق تلقائيًا في Production.

## 7. Production Truthfulness

واجهة AI تعرض بوضوح أن الميزة قيد التهيئة عندما يكون provider أو document processing غير متاح. لا تعرض fake confidence أو fake extraction أو fake counters. Dashboard يعرض `لا توجد بيانات بعد` عندما لا توجد persistence فعلية، ولا يساوي غياب السجلات بنجاح processing.
