# A3LAM — PHASE 17.18.11
## AI Profile Builder UX & Editorial Experience

**تاريخ التنفيذ:** 27 أغسطس 2026
**النطاق:** `/admin/ai` والمكونات المرتبطة مباشرة به فقط
**القرار:** `PASS WITH LIMITATIONS`

> هذه المرحلة تطور تجربة Editorial AI Workspace ولا تفعّل AI في Production. جميع المسارات الإنتاجية بقيت read-only، والنهاية المسموح بها هي `DRAFT`.

---

## 1. Executive Summary

تم تحويل مساحة العمل الحالية إلى تجربة تحريرية أوضح ومتصلة بدل كونها مجموعة مؤشرات تقنية منفصلة. أصبح لدى المحرر مؤشر تقدم فعلي، ومسار من سبع خطوات، واختيار واضح لنمط المسودة، ومراجعة facts مع detail panel للمصدر والدليل والقيم الأصلية والمراجعة، وملخص قابل للقراءة للمسودة والادعاءات، وحد نهائي صريح يحفظ محليًا فقط ولا ينشئ Person/Profile ولا ينشر.

استخدم التنفيذ existing contracts وdeterministic synthetic demo وMock Provider المحلي فقط. لا يوجد provider حقيقي، ولا upload أو persistence أو OCR أو queue worker حقيقي في هذه المرحلة.

---

## 2. Product Goal

الهدف هو أن يشعر المحرر بأن A3LAM AI **مساعد تحريري لتحويل مصدر إلى مسودة قابلة للمراجعة**، وليس لوحة تقنية لاختبار AI. التعقيد التقني غير الضروري مخفي، بينما تبقى provenance وconfidence وclassification وreview status وحدود النشر ظاهرة في اللحظة المناسبة.

الواجهة لا تصف الناتج بأنه حقيقة موثقة؛ بل تميّز بين extracted/source-backed وneeds verification وconflict وblocked، وتعرض أن المسودة خاصة وبحالة DRAFT.

---

## 3. User Journey

المسار المنفذ هو:

`Start → Document → Extraction → Facts → Generation → Draft → Claims → Review`

تظهر الخطوات في stepper قابل للتنقل، مع progress bar حقيقي محسوب من الخطوة الحالية من أصل سبع خطوات. الخطوة التالية تظهر للمحرر، وحالة الخطوة تعرض Pass أو Needs verification بحسب الحالة الفعلية، دون progress أو latency أو confidence وهمية.

الانتقال إلى generation يتطلب fact واحدًا مقبولًا أو معدلًا على الأقل. generation نفسه محلي deterministic ويشغل `runEditorialDemo`؛ لا ينفذ network call. المسار النهائي يثبت `DRAFT` ولا يحتوي على publish action.

---

## 4. UX Architecture

يتكون workspace من hero واضح، boundary callout، sandbox notice، progress summary، stepper، ومحتوى متغير بحسب المرحلة. توجد readiness matrix خارج هذا المكون في `/admin/ai` وتعرض حالة الاعتماديات الحقيقية، بينما تعرض مساحة العمل المحلية فقط حالات demo المعلّمة.

| الطبقة | المسؤولية |
|---|---|
| Entry/hero | شرح الهدف والنطاق المحلي والحد النهائي |
| Progress | الخطوة الحالية، النسبة المحسوبة، والإجراء التالي |
| Stepper | تنقل keyboard-friendly بين Document/Extraction/Facts/Generation/Draft/Claims/Review |
| Main panel | محتوى المرحلة الحالية مع actions محددة |
| Evidence/detail | مصدر ودليل وقيم ومراجعة دون إخفاء provenance |
| Final actions | حفظ محلي، متابعة مراجعة، رجوع؛ بلا نشر |
| Readiness side context | يعرض configuration-required وdisabled من contract الحقيقي |

---

## 5. Information Architecture

### Document

اختيار ملف محلي أو تشغيل العرض الاصطناعي المعزول. تظهر supported formats وproduction-disabled notice وحالة الملف.

### Extraction

ملخص language/processing/sections/paragraphs، قائمة الأقسام، النص المستخرج في مساحة private، وملاحظات OCR/DOCX.

### Facts

بطاقات facts مع field/value/source/confidence/classification/evidence/status/actions، وبجانبها detail panel للمعلومة المختارة.

### Generation

اختيار output mode واللغة، بوابة sources/privacy/provider، ثم تشغيل local deterministic draft.

### Draft

عرض خاص يميز mode واللغة والclaims، ويعرض source coverage وunresolved وrejected.

### Claims

مقارنة source fact بالgenerated claim، مع provenance وconfidence وstatus.

### Review

Quality indicators، claim review controls، source coverage breakdown، ورسالة final boundary مع Save local draft وContinue review وBack.

---

## 6. Document Input

يدعم uploader الأنواع `PDF` و`DOCX` و`TXT` وفق capabilities القائمة. يوضح الحد الأقصى والحالة المحلية ومعلومة الخصوصية. اختيار الملف المحلي يحدّث رسالة صريحة تقول إن الملف لا يُرفع ولا يُعالج في هذا العرض؛ التشغيل المتاح هو synthetic isolated demo فقط.

حالات uploader المدعومة هي `IDLE` و`UPLOADING` و`EXTRACTING` و`READY_FOR_REVIEW` و`FAILED`. تظهر حالة مستقلة color-independent، وتظهر progress فقط إذا مررها workflow فعليًا، وتظهر Retry فقط مع failure callback. لا توجد نسبة أو عملية مصطنعة في workspace.

Production upload يبقى `DISABLED` و`REQUIRES_CONFIGURATION`.

---

## 7. Extraction UX

تعرض شاشة extraction اسم الملف والصيغة واللغة وحالة المعالجة وعدد الأقسام والفقرات، ثم تجمع section list مع النص المستخرج. النص private داخل Admin-only workspace، وتوضح الملاحظات أن PDF بلا text layer يحتاج OCR وأن DOCX يخضع لحدود الأرشيف والجدول والفقرة.

لا تدّعي الواجهة تنفيذ OCR. إذا كانت الحالة `OCR_REQUIRED` في contract، فهي حالة تحتاج تجهيزًا منفصلًا ولا تتحول إلى نص مزعوم.

---

## 8. Fact Review

تظهر facts في بطاقات responsive بدل جدول ضيق على الهاتف. كل بطاقة تعرض:

| الحقل | المعنى |
|---|---|
| Field/Value | الحقل والقيمة المستخرجة |
| Source | اسم المصدر أو المستند |
| Confidence | مستوى الثقة كما ورد في العقد |
| Classification | EXTRACTED أو NEEDS_VERIFICATION ونحوها |
| Evidence | المقطع الداعم |
| Status | Pending/Accepted/Edited/Rejected/Source Requested |
| Actions | Accept/Edit/Reject/Request Source |

عند تحديد fact يفتح detail panel accessible يعرض `Original Value` و`Reviewed Value` و`Reviewer` و`Decision` ومكان المصدر والدليل. لا يتم اختصار provenance إلى badge فقط.

---

## 9. Generation UX

يتيح workflow اختيار خمسة modes: Professional CV، Professional Profile، A3LAM Person Draft، Biography، وSEO Draft. تم تحويل الاختيار من select وحيد إلى cards radio semantic ذات selected state وglyph زخرفي وdescription قصيرة. يظل select اللغة واضحًا ويدعم العربية والإنجليزية وثنائي اللغة ولغة المصدر.

قبل التوليد تظهر بوابة صريحة للمصادر والخصوصية وحالة Mock Provider. لا يظهر fake token count أو latency أو percentage أو AI confidence. عند provider غير مهيأ، تستخدم واجهة Admin الحالية `AI Provider Requires Configuration` ولا توحي بأن Production generation يعمل.

---

## 10. Draft UX

تعرض المسودة داخل بطاقة private preview مع mode واللغة وقائمة claims وحالة كل claim. أضيف breakdown deterministic لـsource coverage وunresolved وrejected بدل score رقمي غير مثبت.

تظهر رسالة صريحة بأن الناتج صياغة مولدة تحتاج مراجعة، وأن المسودة خاصة ولم تنشر. لا تعرض الواجهة Person أو Profile ككيان منشأ، ولا تستخدم public route أو search أو sitemap.

---

## 11. Claim Review

تظهر claims في مقارنة بين `Source Fact` و`Generated Claim`. كل claim يعرض field والقيمة والحالة والثقة وفتح provenance/evidence. إجراءات Accept وEdit وReject وRequest Source واضحة، وتبقى القيم غير المحسومة أو المتعارضة تحت المراجعة.

لا يؤدي Accept إلى publication. حتى بعد قبول claims، تبقى النتيجة DRAFT-only.

---

## 12. Editorial Review

تجمع الشاشة النهائية quality indicators لـidentity، sources، evidence، conflicts، claims، completeness، privacy، وpublication. الحالة لا تستخدم score وهميًا؛ بل `PASS` أو `WARNING` أو `BLOCKED` لكل indicator.

يظهر summary لعدد facts المغطاة، facts/claims غير المحسومة، claims المرفوضة، وfacts المعدلة. الإجراءات النهائية هي:

- **Save as local draft:** يثبت local-only state ولا يستدعي persistence Production.
- **Continue review:** الرجوع إلى claims.
- **Back:** الرجوع إلى claims.

لا يوجد Publish أو Create Person أو Create Profile أو Publish to A3LAM.

---

## 13. Publication Firewall

التنفيذ يثبت عبر UX وcode أن المسار لا يحتوي على publication bypass. لا توجد handlers أو buttons لإنشاء Person/Profile أو النشر، وfinal boundary يعرض صراحة: `Local save only · no Person/Profile creation · no publication`.

`AI_PUBLICATION_ENABLED` hard-false في production contract، و`AI Production Processing` وupload/generation gates بقيت مغلقة. جميع claims accepted لا تغير هذه الحدود.

---

## 14. Responsive UX

أضيفت قواعد responsive للمسار والمكونات المرتبطة به فقط:

| viewport | سلوك التصميم المستهدف |
|---|---|
| 390×844 | stepper قابل للتمرير، mode cards عمودية، facts/detail/actions عمودية، بلا overflow أفقي |
| 393×852 | نفس compact mobile behavior مع action buttons قابلة للالتفاف |
| 768×1024 | grids ثنائية عند الإمكان وdetail panel ثنائي الأعمدة |
| 1440×900 | hero/workflow summary/grid كاملة مع كثافة تحريرية متوازنة |

على الهاتف تتحول fact detail إلى single-column، وتلتف final actions، وتصبح mode cards عمودية. أضيف `overflow-x: clip` في global foundation الموجود أصلًا، ولم تتم إضافة animation ثقيلة؛ كما أضيف `prefers-reduced-motion`.

**ملاحظة evidence:** لم تتوفر جلسة Admin محلية لتنفيذ visual browser walkthrough داخل workspace؛ route المحلي أعاد redirect إلى Admin login لأن حماية مساحة التحرير غير مهيأة. لذلك لا ندّعي PASS بصريًا لهذه viewports.

---

## 15. Accessibility

التنفيذ يستخدم semantic `fieldset/legend` لاختيار mode، radio inputs، buttons حقيقية، `aria-current="step"` في stepper، `aria-pressed` لتحديد fact، progressbar بقيم min/max/now، `role="status"` للإشعارات والحالات، و`role="alert"` للأخطاء والتعارضات.

تم الحفاظ على focus-visible states العامة وإضافة focus state للـmode/fact controls، مع status لا يعتمد على اللون وحده. توجد labels لـfile input وclaim edit controls. تم دعم reduced motion.

لم تُجرَ مراجعة screen reader فعلية أو قياس contrast آلي/يدوي في هذه المرحلة؛ الحالة `NOT TESTED` وليست WCAG 2.2 AA PASS.

---

## 16. Security

لم تتغير authentication أو RBAC أو CSRF semantics. workspace يظل تحت `getAdminPageAccess("ai.documents.read")`، وتبقى mutations Production خلف server-side permission and same-origin guards.

اختبارات Phase 17.18.11 تحققت من private admin route، غياب public imports للـworkspace، غياب publication actions، وعدم إدخال AI content في public route source. لم تُقرأ أو تُغير secrets، ولم تُستخدم Production `DATABASE_URL`، ولم تُنفذ migration أو provider call.

---

## 17. Privacy

الـworkspace local-only demo يعرض synthetic fixture معلّمة `SANDBOX · Synthetic data only`. اختيار ملف من الجهاز لا يعالجه ولا يرفعه. النص المستخرج والfacts والclaims وprompts والprovider state تبقى ضمن Admin/private surface، ولا تدخل public HTML/API/search/sitemap/OG/JSON-LD.

Production GET-only privacy scan للمسارات العامة والمحميّة أعاد `CLEAN` بعد deployment. لا توجد counters أو progress زائفة تعرض نشاطًا إنتاجيًا.

---

## 18. Validation

| الأمر | النتيجة |
|---|---|
| `pnpm install --frozen-lockfile` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS |
| `pnpm test` | PASS — 28 files / 207 tests |
| `pnpm vitest run tests/phase17.18.11.test.ts` | PASS — 5/5 |
| `pnpm build` | PASS — 71/71 pages |
| `git diff --check` | PASS |
| `pnpm test:integration` | NOT RUN — يتطلب migrations/DB ولا توجد isolated DB مثبتة |

لم تُضف dependencies جديدة. اختبارات UX هي contract/source tests محددة وليست snapshot tests شكلية.

---

## 19. Production Smoke

deployment الناتج عن implementation commit هو `dpl_Apk2sLRxqxb7xarhTWutTg4p1YQH`، وحالته `READY`، ومصدره GitHub `main` على commit `e3d10b4b328a5d1c163b85b5970cc2ff6d244488`.

| المسار | الطريقة | المتوقع | الفعلي |
|---|---|---:|---:|
| `/` | GET | 200 | 200 |
| `/api/health` | GET | 200 | 200 |
| `/categories` | GET | 200 | 200 |
| `/search` | GET | 200 | 200 |
| `/robots.txt` | GET | 200 | 200 |
| `/sitemap.xml` | GET | 200 | 200 |
| missing route | GET | 404 | 404 |
| `/admin` | GET | 307 | 307 |
| `/admin/ai` | GET | 307 | 307 |
| `/api/admin/ai/readiness` | GET | 401 | 401 |
| `/api/admin/ai/documents` | GET | 401 | 401 |

تم استخدام GET فقط في Production. لم تُنفذ POST أو PUT أو PATCH أو DELETE أو upload أو generation أو review أو claim أو publication.

---

## 20. Limitations

القيود المثبتة هي:

1. لا توجد isolated DB مؤكدة، ولذلك لم تُشغّل migrations أو integration tests ولم تُختبر revoked DB sessions وpersistent permission overrides.
2. provider/storage/scanner/queue/worker/OCR/retention/cost/observability production dependencies غير مهيأة أو غير مفعلة.
3. visual walkthrough داخل `/admin/ai` لم يكتمل لأن local admin protection غير مهيأة؛ Chromium أثبت redirect إلى login فقط، لا صحة workspace بعد login.
4. Firefox وSafari/WebKit وscreen-reader لم تُختبر.
5. لم يُجرَ measured WCAG 2.2 AA contrast test أو Core Web Vitals measurement.
6. production smoke يثبت HTTP/privacy boundaries فقط، ولا يثبت صحة محتوى Admin بعد authentication.
7. local Save Draft هو local state/demo notification وليس Production persistence.

لا يوجد من هذه القيود ما يبرر ادعاء activation. ولا يوجد في الاختبارات الحالية publication bypass أو public privacy leakage أو unsafe provider call.

---

## 21. Final Decision

**Decision: `PASS WITH LIMITATIONS`**

المنتج اجتاز نطاق UX المنفذ والاختبارات الآمنة والبناء وProduction GET-only smoke، لكن external browser/accessibility evidence وreal infrastructure وpersistence غير مكتملة. لذلك القرار ليس `PASS` كاملًا، ولا authorization لتفعيل Production AI.

---

## Boundary

| الحالة | القيمة |
|---|---|
| Production AI | `DISABLED` |
| Production Upload | `DISABLED` |
| Automatic Person/Profile Creation | `DISABLED` |
| Publication | `DISABLED` |
| Population | `NOT STARTED` |
| Phase 17.18.12 | `NOT STARTED` |
| Phase 17.19 | `NOT STARTED` |
| Phase 18 | `NOT STARTED` |

**STOP AFTER PHASE 17.18.11.**

## Evidence References

- [Phase 17.18.11 UX test evidence](./phase17.18.11-ux-test-evidence.md)
- [Workspace component](../components/a3lam/ai/A3lamEditorialWorkspace.tsx)
- [Uploader component](../components/a3lam/ai/A3lamDocumentUploader.tsx)
- [UX contract tests](../tests/phase17.18.11.test.ts)
- [Production activation gate](./phase17.18.10-final-ai-activation-gate.md)
