# A3LAM — Phase 13 Architecture Decision Record

## الحالة والنطاق

تضيف Phase 13 ملفات شخصية مهنية عامة وحسابات مستخدمين فوق البنية الحالية، مع إيقاف Editorial Population وعدم إدخال شخصيات جديدة. تبقى السجلات التاريخية الحالية في جداول `people` دون حذف أو تغيير في روابطها، بينما تُخزّن الملفات المهنية في كيان مستقل مرتبط بحساب المستخدم، ثم تُعرض عبر المسار العام نفسه `/person/[slug]` من خلال إسقاط عام موحّد.

## الفصل الأمني بين Admin وUser

تبقى مصادقة المحرر الحالية المعتمدة على `A3LAM_ADMIN_ACCESS_TOKEN` مستقلة بالكامل. حسابات المستخدمين تستخدم جدول `user_accounts` وجدول `user_sessions` وcookie منفصلة `a3lam_user_session`. لا تُقرأ قيمة رمز Admin من مسارات التسجيل أو الدخول، ولا تُستخدم صلاحيات الواجهة كطبقة حماية؛ كل مسار حساب أو ملف يتحقق من جلسة المستخدم server-side.

## نموذج البيانات

يُضاف جدول `user_accounts` للبريد المطبّع، الاسم، hash كلمة المرور، والدور. يُضاف `user_sessions` لجلسات قصيرة العمر مع hash للرمز، انتهاء، وإبطال اختياري. يُضاف `profiles` بملكية user account وslug ثابت وحالة `draft|pending_review|published|archived` وvisibility `private|unlisted|published`، مع حقول CV الأساسية. تُفصل العلاقات في جداول `profile_experiences`, `profile_educations`, `profile_skills`, `profile_certifications`, `profile_languages`, `profile_portfolio_items`, `profile_social_links`, و`profile_files`. لكل ملف مصدر مهني مستقل في `profile_source_records` حتى لا تختلط دورة نشره مع مصادر CMS التحريرية. تُحفظ بايتات الملفات خارج PostgreSQL؛ تُخزّن metadata ومفتاح storage فقط.

## بوابة النشر والإسقاط العام

الحالة الافتراضية للملف `draft` والظهور `private`. لا يُعرض الملف في البحث أو التصنيفات أو sitemap إلا عندما تكون الحالة `published` والرؤية `published` ويجتاز الاسم وslug والنبذة والمصدر المهني والتحقق من العلاقات. `unlisted` يمكن فتحه بالرابط عند معرفة slug، لكنه لا يدخل في الاكتشاف أو sitemap ويستخدم `noindex`. `private` لا يعرض صفحة عامة. تُعرض بيانات الاتصال فقط عند تفعيل `emailPublic` أو `phonePublic` صراحة، ولا تدخل email أو phone الخاصة في search أو metadata أو JSON-LD.

## دورة المستخدم والمحرر

يستطيع المستخدم إنشاء وتعديل ملفه في `draft`، ثم إرساله إلى `pending_review`. لا يستطيع المستخدم تعيين `published` مباشرة. يستطيع Admin اعتماد الملف أو رفضه وإعادته إلى draft أو نشره أو أرشفته. يحتفظ Admin lifecycle الحالي للسجلات التحريرية القديمة كما هو، مع إضافة مسارات مستقلة لملفات المستخدمين.

## التخزين

يستخدم التطبيق abstraction server-side في `lib/storage/provider.ts`. في حالة إعداد provider HTTP PUT متوافق مع التخزين الخارجي تُرفع الملفات عبر route خادمي بعد فحص الحجم، MIME، الامتداد، magic bytes، واسم تخزين مولّد من server. عند غياب الإعداد يعيد المسار `503` برسالة إعداد واضحة ولا يدّعي نجاح الرفع. لا تقبل الامتدادات التنفيذية أو HTML أو SVG غير الموثوق.

## التوافق وSEO

تستمر السجلات القديمة في الظهور عبر الإسقاط التاريخي الحالي، لكن صفحة الشخص العامة تُخفي birth/death وtimeline في واجهة CV الجديدة. تُضاف branch مهنية للملفات الجديدة، مع `Person` JSON-LD مبني على الحقول المرئية فقط. تبقى `/sitemap.xml` وsearch منشورة فقط وفق بوابة profile، ولا تنكشف الملفات أو بيانات الاتصال الخاصة.

## قرار التنفيذ

يُستخدم Next.js App Router الحالي وPostgreSQL/Drizzle الحاليان، مع route handlers server-side وReact client forms. لا تُضاف خدمة بريد أو password reset في هذه المرحلة. لا تُنشأ بيانات مستخدمين أو ملفات تجريبية في Production. تُنشأ migration جديدة مرتبة ولا تُعدّل migrations القديمة.

## التدقيق وحالة التطبيق

تُسجل انتقالات moderation لملفات المستخدمين في `audit_logs` مع actor type، الكيان، الحقل، القيمة السابقة والجديدة، والإجراء. Migration Phase 13 موجودة كملف مرتب `0003_phase13_profiles.sql` ولم تُطبّق في هذه الجلسة لأن `DATABASE_URL` غير متاح محليًا؛ لا توجد أي كتابة مباشرة إلى قاعدة Production ولا أي seed اصطناعي.
