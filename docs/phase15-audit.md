# Phase 15 — Product Audit and Scope Decision

## Audit status

تمت مراجعة بنية Next.js App Router، المسارات العامة والمالكة والإدارية، مكونات البحث والملف العام ومحرر CV وجدول المراجعة، طبقات API والمستودعات، مصادقة المستخدم وAdmin، الإسقاط العام والخصوصية، storage abstraction، SEO، i18n، حالات loading/empty/error، RTL، والـresponsive CSS.

المنصة تعمل حاليًا كبنية متقدمة تجمع موسوعة تحريرية مع ملفات مهنية، لكن بعض الرسائل والرحلات ما تزال تبدو أقرب إلى foundation/editorial prototype من منتج مزدوج واضح للمستخدم الجديد.

## P0 — Critical

لم يظهر خلال التدقيق خلل P0 يستدعي تغييرًا فوريًا في schema أو المصادقة أو production data. حراسة account وAdmin منفصلتان، والإسقاط العام للملفات المهنية server-side، ومسارات mutation محمية بملكية المستخدم وorigin checks وفق البنية الحالية.

## P1 — Important and selected for Phase 15

| المجال | الملاحظة | القرار |
|---|---|---|
| Product identity | Homepage/header copy لا يوضحان بما يكفي اتحاد الموسوعة مع منصة CV المهنية. | تنفيذ تحسين رسائل المنتج والـHero وCTA والـfooter دون اختراع بيانات. |
| Navigation | Header ثابت ولا يميز بوضوح بين anonymous وauthenticated user، رغم وجود user auth. | إضافة حالة user-aware server-side؛ لا إظهار لمسارات Admin في public header. |
| CV editor | المحرر غني لكنه صفحة طويلة؛ لا توجد إشارة unsaved changes أو last saved. | إضافة unsaved indicator، last-saved status، beforeunload guard، وCTA إرشادي آمن دون تغيير API. |
| Completion | Dashboard يعرض نسبة وقائمتين، لكن يمكن جعله checklist عمليًا أكثر. | تحسين عرض completion باستخدام العناصر المكتملة والمتبقية وCTA الموجود. |
| Moderation | جدول Admin لا يملك بحثًا أو status/category/completeness/date sorting. | إضافة client-side filters/sorting على البيانات المحملة، مع إبقاء transitions الحالية وaudit server-side. |
| Public profile | الملف المهني غني، لكن sharing/print minimal والتمييز بين professional/editorial يمكن تقويته. | إضافة copy/share fallback وإبراز profile identity، مع CSS print وتحسين رسائل المصدر. |
| Empty/loading/error | الحالات موجودة في معظم الواجهات، لكن يجب الحفاظ على رسائل مفهومة وعدم عرض أخطاء تقنية. | مراجعة موضعية ورسائل عربية واضحة؛ لا تغيير لعقود API. |

## P2 — Deferred / Requires Approval

تم تأجيل autosave الشبكي، full step-by-step wizard، تغيير schema أو migration، خدمة PDF خارجية، خدمة analytics/tracking، Email provider، semantic search، وFirefox/Safari/accessibility automation. كل منها يحتاج قرارًا أو بيئة أو بيانات خارج النطاق الحالي.

## Architectural decisions

سيتم تنفيذ تحسينات Phase 15 داخل بنية Next.js الحالية باستخدام Server Components حيث يلزم، Client Components للتفاعلات المحلية، وREST routes الحالية. لن يتم إدخال tRPC أو Manus OAuth أو schema migration؛ هذه عناصر لا تنطبق على هذا المستودع.

ستبقى `Editorial People` و`Professional Profiles` منفصلتين lifecycle-wise. لن تُنشأ أو تُعدل أي بيانات Production، ولن تُكشف أو تُقرأ أي secrets. سيتم الحفاظ على projection العام وفلاتر visibility الحالية.

## Phase boundary

Population وPhase 16 وميزات AI والبيانات التجريبية خارج النطاق، وستبقى `NOT STARTED` بعد إغلاق Phase 15.
