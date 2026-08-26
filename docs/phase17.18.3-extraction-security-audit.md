# A3LAM — Phase 17.18.3 Extraction Security Audit

## Scope and decision

هذا التدقيق يغطي محرك استخراج المستندات المحلي فقط. المستند مصدر خاص غير موثوق، وكل ناتج extraction يظل extraction-ready وreview-required. لا توجد في هذه المرحلة أي مكالمة AI، ولا provider خارجي، ولا Production upload أو processing أو migration أو automatic Person/Profile creation أو publication.

> **Extract first. Preserve provenance. Review facts. Generate later. Publish last.**

## Trust boundaries

يبدأ الحد الأمني عند `validateAiDocument()`، قبل أي parser. التحقق يعتمد على اسم الملف والامتداد وMIME وmagic signature والحجم، لكنه لا يثق بأي قيمة من browser وحدها. بعد ذلك يمر bytes إلى adapter خاص بالنوع، ثم إلى normalization، language/section classification، وcandidate facts in-memory. لا تمرر خدمة الاستخراج محتوى المستند إلى tools أو shell أو system prompts.

جميع نتائج الاستخراج private-by-default. لا توجد public route أو search projection أو sitemap أو OG/JSON-LD projection للوثائق أو النص المستخرج أو evidence. Admin API الحالية server-side authenticated وpermission-checked، وProduction POST ما زال hard-blocked عندما تكون storage/queue غير مهيأة.

## Resource limits

| Resource | Limit | Enforcement |
|---|---:|---|
| Input document | 10MB | validation قبل parser |
| Extracted text | 8MB | normalized text assertion |
| PDF pages | 100 | page object count |
| DOCX entry count | 200 | archive metadata filter |
| DOCX decompressed total | 8MB | archive metadata filter |
| DOCX individual entry | 2MB | archive metadata filter |
| DOCX compression ratio | 200:1 | archive metadata filter |
| Paragraph count | 5,000 | DOCX traversal limit |
| Table cells | 500 | DOCX traversal limit |
| Evidence excerpt | 500 chars | existing facts validation |

لا توجد decompression غير محدودة مقصودة في adapter DOCX؛ يتم فحص archive metadata ويُستخرج `word/document.xml` فقط. لا توجد temporary extraction paths أو arbitrary shell execution.

## TXT controls

TXT يستخدم UTF-8 fatal decoding، وإزالة BOM، وNFKC، وCRLF-to-LF، وcontrol-character filtering، وwhitespace/paragraph normalization. الملفات الفارغة وwhitespace-only وmalformed encoding وHTML-like payloads وnull bytes والملفات التي تتجاوز الحد تُرفض. لا يُنفذ أي markup أو URL أو JavaScript داخل النص.

## PDF controls

PDF adapter pure-JS ومحدود النطاق. يتحقق من `%PDF-` و`%%EOF` وبنية page objects، ويفك ASCII85/Flate streams بحد stream، ويقرأ text operators فقط. `disable` network behavior غير موجود في هذا adapter؛ لا يستدعي URLs أو fonts أو native binaries أو shell. PDF الذي لا يحتوي text layer يخرج `OCR_REQUIRED`، ولا يدّعي OCR. malformed PDF يخرج `PARSER_FAILURE`، وتجاوز page/stream limits يخرج `RESOURCE_LIMIT`.

هذا parser لا يدعم كل تعقيدات PDF؛ لذلك لا يجوز تفسير غياب نص مستخرج كحقيقة عن محتوى المستند، ويجب التعامل مع partial/unsupported outcomes كمخرجات تحتاج مراجعة.

## DOCX archive and XML controls

DOCX يعامل كـZIP غير موثوق. تُرفض المسارات المطلقة ومسارات `..` وأسماء entries الطويلة والcompression methods غير المدعومة ونسب الضغط المشبوهة وحجوم entry/archive التي تتجاوز الحدود. يقتصر الاستخراج على `word/document.xml`، ولا تُفك أو تُنفذ macros أو images أو embedded objects.

XML يُفك UTF-8 fatal، ويُرفض إذا احتوى `DOCTYPE` أو `ENTITY`. لا توجد external entity resolution أو network fetch. يستخرج adapter paragraphs وtext runs وtable-cell text فقط، وتبقى hyperlinks وrelationships بيانات غير منفذة.

## External reference and prompt-injection boundary

أي URL أو أمر أو نص مثل `Ignore previous instructions` داخل CV هو **DOCUMENT CONTENT** فقط. محرك الاستخراج لا ينفذ النص ولا يفسره كتعليمات نظام ولا يمرره إلى provider أو tool. لا توجد AI inference أصلًا في Phase 17.18.3، لكن الحد موثق ليستمر في المراحل اللاحقة.

## Structured output and provenance

كل `DocumentExtractionResult` يحمل status وmetadata وnormalized text وcharacter count وpage count إن توفر وboundaries وwarnings وlanguage وsections وparserVersion وextractionVersion وchecksum وprovenance وcandidateFacts. candidate facts لا تُعتمد كحقائق تحريرية؛ كل منها `NEEDS_VERIFICATION` مع confidence وevidence وdocument checksum وsection وcharacter offsets.

candidate facts الحالية deterministic ومحدودة إلى contact patterns الواضحة مثل email وwebsite وphone. لا يوجد heuristic يخلق اسمًا أو وظيفة أو تعليمًا أو سيرة. لا تُنشأ Person أو Profile ولا تُنشر أي نتيجة.

## Error taxonomy and logging

الأخطاء typed ومصنفة إلى `UNSUPPORTED_TYPE` و`INVALID_FILE` و`EMPTY_DOCUMENT` و`FILE_TOO_LARGE` و`EXTRACTED_TEXT_TOO_LARGE` و`PDF_TEXT_UNAVAILABLE` و`OCR_REQUIRED` و`DOCX_INVALID` و`DOCX_UNSAFE_ARCHIVE` و`PARSER_FAILURE` و`NORMALIZATION_FAILURE` و`TIMEOUT` و`RESOURCE_LIMIT` و`UNAVAILABLE` و`MALFORMED_DOCUMENT`. لا تُرسل stack traces أو raw document/evidence إلى المستخدم أو application logs؛ response mapping العام يستخدم safe error envelope.

## Test evidence

الاختبارات المضافة في `tests/phase17.18.3.test.ts` مرّت بـ`5/5`. تغطي fixtures صناعية غير حساسة لـArabic/English/mixed TXT، BOM وCRLF وcontrols وempty/whitespace/malformed/oversized input، multi-page text PDF، empty/OCR-required PDF، malformed PDF، normal DOCX، tables، malformed DOCX، suspicious compression، وpath traversal. كما تتحقق من language وsections وcandidate facts وprovenance وparser versions.

الاختبارات الكاملة مرّت بـ`20` test files و`127` tests. لم يُشغّل `pnpm test:integration` لأنه يمرر migration وseed، ولم يُستخدم Production DATABASE_URL.

## Production safety audit

| Control | Observed result |
|---|---|
| Production writes | 0 |
| Production uploads | 0 |
| Production documents/jobs | 0 |
| AI/provider calls | 0 |
| Migrations executed | 0 |
| Secrets/providers changed | 0 |
| Public AI exposure | NONE |
| Admin unauthenticated API | 401 |
| Admin unauthenticated pages | 307 |
| Public privacy scan | CLEAN |

Production migration registry بقي كما هو: `0007` و`0008` pending. لم تُشغّل migration أو SQL أو storage provisioning أو queue worker.

## Residual limitations

هذا audit لا يثبت أن كل PDF dialect أو كل DOCX edge case قابل للاستخراج. parser bounded ومتعمد أن يرفض أو يبلّغ عن الحالات غير المفهومة. لا توجد OCR أو malware scanner أو retention executor أو queue worker أو private storage provider. قبل تفعيل Production ingestion يجب إضافة isolated integration tests وmalware scanning وrate limiting وoperational deletion/retention controls، دون تسجيل المحتوى الحساس.
