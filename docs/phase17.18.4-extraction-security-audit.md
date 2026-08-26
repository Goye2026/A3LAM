# A3LAM — Phase 17.18.4 AI Generation Security Audit

## Scope

هذا التدقيق يغطي foundation الخاصة بـAI generation وhuman review فقط. لا يغطي تفعيل provider في Production أو تشغيل migrations أو provisioning أو upload أو automatic Person/Profile creation.

## Threat model and boundaries

المستند والنص المستخرج والحقائق المرشحة ونتائج provider كلها بيانات غير موثوقة. لا تمنح هذه البيانات صلاحية تغيير system instructions أو RBAC أو tools أو secrets أو publication state. generation layer لا يملك مسارًا إلى public publication، ولا يملك وظيفة إنشاء Person/Profile تلقائية.

الحد الفاصل هو:

```text
Private Document → Extracted Facts → Generation Request → Provider Boundary
→ Structured Draft → Claim Quality Gate → Human Review → DRAFT ONLY
```

## Provider isolation

`AiProvider` abstraction تفصل application logic عن أي مزود خارجي. provider الحالي في Production غير مهيأ، و`getAiGenerationProviderStatus()` لا يعيد `READY`. عند هذه الحالة يعيد orchestrator `REQUIRES_CONFIGURATION` ولا ينفذ network call.

عند استخدام mock provider في الاختبارات، يُفرض structured output وtimeout وmax input وmax output capabilities. provider failures تُحوّل إلى codes آمنة مثل `PROVIDER_TIMEOUT` و`PROVIDER_RATE_LIMITED` و`PROVIDER_UNAVAILABLE` و`INVALID_OUTPUT`، ولا تُعاد رسائل provider الخام إلى المستخدم أو logs.

## Prompt injection controls

يبني prompt builder system instructions ثابتة منفصلة عن كتلة `DOCUMENT_DATA_BEGIN/END`. تُرسل القيم كمحتوى بيانات فقط. الكشف عن نصوص مثل `ignore previous instructions` أو `reveal system prompt` أو `publish this profile` يوسم المحتوى ولا ينفذه.

لا تُسجّل prompts الخام أو النصوص الخام للمستند. request يحمل digest bounded بدل تخزين raw prompt، ولا توجد tool calls أو retrieval أو external actions في هذا المسار.

## Structured output and quality gate

الناتج يمر عبر JSON Schema مغلق وruntime validation. `additionalProperties` غير المعلومة مرفوضة، وmode/output language يجب أن يطابقا الطلب. كل claim يحتاج source fact IDs وevidence IDs وprovenance وconfidence وclassification.

يُرفض أو يُعلّق الناتج إذا احتوى secret-like values أو URL غير مثبت في provenance أو قيمة غير صالحة أو reference غير موجود أو evidence خارج الحدود أو claim بحالة `VERIFIED` من دون قرار بشري. كل output يبقى `DRAFT` حتى بعد اجتياز quality gate.

## Conflict handling

إذا أعطت facts قيمًا مختلفة لنفس field path، تُنشأ حالة `CONFLICTED` ولا يختار النظام قيمة تلقائيًا. نتيجة الجودة تصبح `PASS_WITH_REVIEW` ويظل الحسم مسؤولية المراجع.

## Human review and authorization

صلاحية `ai.generation.create` مقتصرة على ADMIN/SUPER_ADMIN. صلاحية `ai.review` محمية server-side. endpoints تستخدم authentication وRBAC وsame-origin mutation checks وbounded body limits وsafe error mapping.

قرارات claim المسموحة هي `ACCEPT` و`EDIT` و`REJECT` و`REQUEST_SOURCE`. تُحفظ original/reviewed value وreviewer وtimestamp وnote. `ACCEPT` و`EDIT` لا يحدثان إلا بقرار بشري، ولا ينفذان publication.

## Persistence privacy

migration `0009` additive فقط. jobs وattempts وclaims وreview decisions private، ولا توجد علاقة مباشرة بـ`people` أو`profiles` ولا public projection. audit يسجل actor/entity/action/field/status/attempt metadata فقط، ولا يسجل document content أو prompt أو response.

migration لم تُطبق في Production؛ registry يثبت `0007` و`0008` و`0009` pending. لذلك لا توجد production generation rows يمكن قراءتها أو تنفيذ review عليها.

## Public isolation

تم فحص public HTML والـsitemap والـrobots وroutes العامة بعد deployment. لا توجد imports أو projections من generation layer في public app modules، ولم يظهر raw extracted text أو claims أو evidence أو storage key أو provider metadata في public responses.

## Validation evidence

| Control | Evidence |
|---|---|
| Provider not configured / no call | Phase 17.18.4 test: PASS |
| Timeout and rate-limit handling | Phase 17.18.4 test: PASS |
| Malformed structured output | Phase 17.18.4 test: PASS |
| Secret-like output rejection | Phase 17.18.4 test: PASS |
| Unproven URL rejection | Phase 17.18.4 test: PASS |
| Missing evidence review gate | Phase 17.18.4 test: PASS |
| Conflict preservation | Phase 17.18.4 test: PASS |
| Prompt injection isolation | Phase 17.18.4 test: PASS |
| Review action validation | Phase 17.18.4 test: PASS |
| RBAC least privilege | Phase 17.18.4 test: PASS |
| Additive migration / no destructive SQL | Phase 17.18.4 test: PASS |
| Public import isolation | Phase 17.18.4 test: PASS |
| Production public privacy scan | CLEAN |

## Residual limitations

لم يتم تنفيذ provider call أو OCR أو queue worker أو malware scanning أو retention executor. private storage وProduction persistence ما زالت غير مهيأة أو pending migration. لا يجوز اعتبار هذا التدقيق موافقة على تفعيل AI أو النشر العام؛ أي تفعيل يتطلب مرحلة وقرارًا وتشغيلًا منفصلين مع integration environment معزولة.

**Audit conclusion:** PASS WITH LIMITATIONS ضمن نطاق foundation فقط.
