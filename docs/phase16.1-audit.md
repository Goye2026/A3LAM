# تقرير تدقيق Phase 16.1 — دورة الملف المهني والجاهزية

**التاريخ:** 2026-08-25

## النطاق والقيود

يقتصر هذا التدقيق على دورة الملف المهني للمستخدم، الجاهزية للإدخال الحقيقي لاحقًا، وأمن الإسقاط العام. لم تُنشأ حسابات أو ملفات أو بيانات تجريبية، ولم تُعدّل قاعدة البيانات أو المخطط أو محتوى Production. لا توجد حاجة مبدئية إلى migration.

## المعمارية الحالية

التطبيق Next.js App Router مع REST route handlers، وPostgreSQL عبر postgres.js وDrizzle، ومصادقة مستخدم مستقلة عن مصادقة Admin، ومستودع server-side للملفات المهنية، وإسقاط عام privacy-safe. ستُحافَظ هذه المعمارية دون إدخال tRPC أو OAuth أو طبقة مصادقة موازية.

## ما هو موجود ومُعتمد

| المجال | نتيجة التدقيق |
|---|---|
| التسجيل وتسجيل الدخول | مسارات server-side موجودة، تحقق من المدخلات، كلمات المرور scrypt، جلسات opaque hashed، وcookie HttpOnly مستقلة. |
| تسجيل الخروج | إبطال جلسة المستخدم ومسح cookie موجودان، مع حماية same-origin للطلبات mutation. |
| ملكية الملف | GET/PUT للملف ورفع الملفات يتحققان من جلسة المستخدم ومن الملف المملوك له. |
| حفظ المسودة | `action=save` يحفظ الحالة `draft` عبر endpoint محمي. |
| الإرسال للمراجعة | `action=submit` يتحقق من متطلبات النشر ثم يحفظ الحالة `pending_review`. المستخدم لا يستطيع النشر مباشرة. |
| مراجعة Admin | واجهة detail وجدول moderation ومسار transitions وسجل audit موجودة. الانتقالات الحالية تحافظ على العقد: draft→pending_review، pending_review→draft/published، published→archived، archived→draft. |
| الخصوصية | البريد والهاتف لا يظهران إلا عند تفعيل flags، والملفات العامة فقط تدخل الإسقاط العام، ولا تُضمّن بيانات الاتصال المباشر في JSON-LD المهني. |
| المعاينة | معاينة owner-only وnoindex موجودة، وتعرض حالات الملفات Public/Private بوضوح. |
| portfolio | CRUD ضمن الحفظ الكلي، ترتيب حتمي، بطاقات عامة responsive، واستخدام `coverUrl` الموجود دون migration. |
| البحث والـSEO | البحث العام يستعمل الإسقاطات المنشورة فقط، مع منع draft/pending/archived والبيانات الخاصة؛ sitemap والصفحات العامة ملتزمة ببوابة النشر الحالية. |
| التخزين | الرفع server-side فقط عبر provider خارجي، مع فحص MIME/extension/magic bytes/الحجم؛ لا يوجد filesystem fallback أو تخزين bytes في PostgreSQL. |
| completion وunsaved state | قائمة إكمال إرشادية، حالة حفظ، beforeunload guard، ورسائل success/error موجودة. |

## الفجوات الحقيقية القابلة للإصلاح دون migration

### 1. فقدان وجهة `next` بعد تسجيل الدخول أو التسجيل

الصفحات المحمية تنشئ redirect مثل `/login?next=/account/profile`، لكن صفحات auth لا تقرأ query parameter، و`UserAuthForm` يعيد التوجيه دائمًا إلى `/account` أو `/account?welcome=1`. هذا يقطع دورة المستخدم عند دخوله من رابط محمي، ويمكن إصلاحه بإضافة وجهة داخلية آمنة فقط، دون تغيير session أو auth architecture ودون السماح بـ open redirect.

### 2. فقدان حالة الخطأ في حفظ الملف

دالة الحفظ في `ProfileEditor` لا تضع طلب الشبكة داخل `try/finally`. عند فشل fetch أو JSON parsing، قد يبقى زر الحفظ في حالة busy ولا تظهر رسالة خطأ. هذا gap جاهزية حقيقي، وسيُعالج داخل المكوّن نفسه مع الحفاظ على endpoint والعقد الحاليين.

### 3. تحسين قابلية الوصول لحالة الإرسال

يمكن إضافة `aria-busy` وحالة تعطيل واضحة للحاوية/الأزرار عند الحفظ، مع الحفاظ على النصوص الحالية. هذا تحسين صغير مرتبط مباشرة باستقرار دورة الحفظ وإمكانية استخدامها بقارئ الشاشة، وليس نظامًا موازيًا.

## عناصر راجعت ولم تكن فجوات في هذا النطاق

لا توجد حاجة إلى إعادة بناء editor أو preview أو Admin moderation. حفظ الملف يعيد إدخال العلاقات التابعة بصورة transaction، ويتحقق من category IDs وsource ownership وslug collision. كما أن public projection يطبق gate server-side ولا يعتمد على CSS أو إخفاء الواجهة.

## عناصر مؤجلة صراحة

| العنصر | سبب التأجيل |
|---|---|
| صورة غلاف أولى للملف | غير ممثلة في `profiles` أو upload contract الحالي؛ تتطلب schema/API expansion. |
| role مستقل لكل portfolio item | schema الحالي يدعم `workType` فقط؛ إضافة role تتطلب migration غير مصرح بها. |
| visibility/date/year/order مستقل لكل عمل | غير ممثل في جدول portfolio الحالي؛ لا يُخترع عبر UI وهمي. الترتيب الحالي deterministic فقط. |
| ملفات مرتبطة بكل عمل | لا توجد relation في schema؛ تبقى خارج هذا النطاق. |
| autosave API | غير مصرح به ويتطلب contract/rate-limit وسلوكًا تشغيليًا جديدًا. |
| contact form وبنية Email Provider | لا توجد خدمة بريد أو persistence/rate limiting معتمدة. CTA الحالي privacy-safe فقط. |
| PDF generation | خارج النطاق. |
| AI/semantic search/analytics/QR | خارج النطاق ولا يجوز الادعاء بأنها operational. |
| external E2E account/session | يتطلب حسابًا حقيقيًا وجلسة يزوّد بها مالك المشروع؛ لا تُنشأ حسابات اختبار. |

## قرار التنفيذ

سننفذ فقط: حفظ `next` الداخلي الآمن بعد auth، معالجة أخطاء الحفظ مع إعادة ضبط busy state، وتحسين `aria-busy`/feedback، ثم نضيف اختبارات مركزة ونوثق نتائج التحقق. إذا ظهر احتياج إلى migration أو تغيير secrets أو auth أو privacy أو lifecycle، فسيتم التوقف والإبلاغ بدل الالتفاف.
