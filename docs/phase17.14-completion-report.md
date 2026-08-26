# A3LAM — Phase 17.14 Completion Report

**العنوان:** Controlled Population Pilot & Editorial Workflow Validation

**التاريخ:** 26 أغسطس 2026

**بيئة التنفيذ:** Production CMS عبر الواجهة الرسمية في `https://a3-lam.vercel.app`، مع استخدام جلسة Admin المصادق عليها. جميع فحوص الجمهور والبحث والتصنيف وsitemap كانت طلبات GET فقط.

## القرار التنفيذي

> **PILOT PASSED WITH LIMITATIONS — لا توجد موافقة ضمنية على Population واسعة.**

نجح Pilot المحدود في إدخال **3 شخصيات حقيقية موثقة**، وإتمام دورة `Draft → Review → Protected Preview → Published` لكل سجل عبر عناصر CMS الرسمية، ثم التحقق من ظهورها في صفحات الأشخاص والبحث والتصنيفات وsitemap وبيانات SEO العامة. بقيت القيود التشغيلية غير الحرجة موثقة: مزود الوسائط غير مهيأ، ولذلك لم تُرفع صور؛ كما لم تُحفظ سجلات التعليم أو الأحداث الزمنية الاختيارية عندما لم تستوفِ واجهة CMS الحالية متطلبات مرجع آمن أو تاريخ يومي دقيق.

هذا القرار **لا يفتح** Population شاملة، ولا bulk import، ولا Phase 17.15، ولا Phase 18، ولا Android/VPS/DNS، ولا migrations أو schema changes. يتوقف التنفيذ هنا، وأي توسع لاحق يحتاج طلبًا منفصلًا وموافقة صريحة.

## نطاق Pilot والنتيجة

اختُير حجم Pilot من ثلاثة سجلات فقط لتغطية ثلاثة أنماط تحريرية: سجل أدبي حديث متعدد المصادر، سجل ثقافي يتطلب تمثيل عدم اليقين، وسجل علمي تاريخي ذي تواريخ تقريبية. لم تكن هناك حاجة لإنشاء تصنيف جديد؛ كانت التصنيفات الثلاثة موجودة ومنشورة قبل بدء الإدخال.

| السجل | slug | التصنيف | Production ID | الحالة النهائية | المصادر المحفوظة | الصورة |
|---|---|---|---|---|---:|---|
| نجيب محفوظ / Naguib Mahfouz | `naguib-mahfouz` | الأدب / `literature` | `30b65d97-e7d5-4673-9b0b-4b6d61e5101d` | Published | 2 | لم تُرفع؛ التخزين غير مهيأ |
| أم كلثوم / Umm Kulthum | `umm-kulthum` | الفن / `arts` | `1df99220-1a22-4768-9b55-5fa877b8379a` | Published | 1 | لم تُرفع؛ التخزين غير مهيأ |
| ابن الهيثم / Ibn al-Haytham | `ibn-al-haytham` | العلوم والتكنولوجيا / `science-technology` | `9d31ab3f-34ad-4c1b-aff8-bcaef2e5474f` | Published | 1 | لم تُرفع؛ التخزين غير مهيأ |

## المسار التحريري الفعلي

أُنشئ كل سجل باستخدام زر **حفظ كمسودة** الرسمي. قبل الانتقال إلى Review، جرى فتح الرابط العام والبحث العام وصفحة التصنيف للتأكد من عزل Draft؛ فكانت صفحة الشخص 404، ونتيجة البحث فارغة، ولم يظهر السجل في التصنيف. بعد ذلك أُرسل كل سجل عبر **إرسال للمراجعة**، وفُتحت المعاينة المحمية الرسمية، ثم نُفذ **نشر** من صفحة CMS. لم تُستخدم SQL، ولا seed، ولا import، ولا endpoint غير موثق، ولا mutation خارج مسار CMS الرسمي.

| المرحلة | نجيب محفوظ | أم كلثوم | ابن الهيثم |
|---|---|---|---|
| Draft | ناجح | ناجح | ناجح |
| Draft isolation قبل النشر | 404 / بحث فارغ / التصنيف غائب | 404 / بحث فارغ / التصنيف غائب | 404 / بحث فارغ / التصنيف غائب |
| Review | ناجح | ناجح | ناجح |
| Protected Preview | ناجح | ناجح | ناجح |
| Published | ناجح | ناجح | ناجح |
| Public page بعد النشر | ناجح | ناجح | ناجح |

## البيانات والتحرير

### نجيب محفوظ

استُخدمت صفحة نجيب محفوظ الرسمية لدى Nobel Prize Outreach، إلى جانب صفحة Encyclopaedia Britannica، لإسناد الهوية، القاهرة، التاريخين، المسار الأدبي، جائزة نوبل، والمسار الحكومي/الثقافي.[1] [2] أُدخلت السيرة بصياغة عربية أصلية، وحُفظ مصدران بموثوقية مرتفعة. لم يُحفظ سجل التعليم الاختياري لأن واجهة CMS تطلب معرّف مصدر داخليًا صالحًا ولم يكن من الآمن تحويل URL خام إلى مرجع غير موثق. كما لم يُحفظ حدث زمني لأن المعلومة المتاحة كانت على مستوى السنة بينما حقل الحدث يتطلب تاريخًا يوميًا دقيقًا.

### أم كلثوم

اُستخدمت صفحة Britannica الخاصة بأم كلثوم مصدرًا موثوقًا، مع استخدام تاريخ الميلاد المسجّل في المصدر `1904-05-04`، وإبقاء صياغة السيرة صريحة في وجود تضارب في السجلات المبكرة وعدم اليقين حول التاريخ.[3] أُدخل تاريخ الوفاة `1975-02-03` ومكانا الميلاد والوفاة بصياغة محافظة، ولم تُضف صورة أو تعليم أو timeline غير مسند.

### ابن الهيثم

اُستخدمت صفحة Britannica الخاصة بابن الهيثم لإسناد البصرة والقاهرة والأعمال العلمية في البصريات والرياضيات والفلك.[4] تُرك حقلا الميلاد والوفاة فارغين عمدًا؛ لم تُحوّل الصياغات التقريبية مثل `c. 965` و`c. 1040` إلى تواريخ ISO زائفة. عُرضت الفترة التقريبية في السيرة المنظمة بصياغة واضحة، مع عدم إدخال أحداث زمنية أو تعليم غير موثق.

## العدادات الفعلية

| المؤشر | قبل Pilot | تغيّر Phase 17.14 | بعد Pilot |
|---|---:|---:|---:|
| People total | 9 | +3 | 12 |
| Published People | 8 | +3 | 11 |
| Draft People | 1 | 0 | 1 |
| Review People | 0 | 0 | 0 |
| Archived People | 0 | 0 | 0 |
| People created | 9 existing | **3** | 12 total |
| Draft → Review transitions | 0 | **3** | 3 Pilot transitions |
| Review → Published transitions | 0 | **3** | 3 Pilot transitions |
| Persisted source records for Pilot | 0 | **4** | 4 |
| Categories created | 0 | **0** | 10 existing |
| Images uploaded | 0 | **0** | 0 |
| Education rows persisted for Pilot | 0 | **0** | 0 |
| Timeline rows persisted for Pilot | 0 | **0** | 0 |
| Deletes | 0 | **0** | 0 |
| Profiles created/updated | 0 | **0** | 0 |
| Users/admins/editors created | 0 | **0** | unchanged |

لم يتم احتساب المحاولات المحلية الفاشلة قبل الحفظ كسجلات إنتاجية؛ محاولة نجيب محفوظ الأولى فشلت في التحقق قبل الإنشاء بسبب صف التعليم الاختياري، ثم أزيل الصف من الواجهة الرسمية، ونجح الحفظ التالي. لا يوجد دليل على إنشاء سجل مكرر أو مصدر يتيم من المحاولة الفاشلة.

## التحقق العام والبحث والتصنيفات

نجحت الصفحات العامة الثلاثة بروابطها الثابتة. البحث العربي المطابق أعاد سجلًا واحدًا لكل شخصية، والبحث اللاتيني الجزئي أعاد السجل المتوقع؛ وفي حالة `Ibn` أعاد نتائج Ibn المنشورة الأخرى أيضًا، وهو سلوك بحث جزئي متوقع وليس تطابقًا دقيقًا فقط. التصنيفات العامة أظهرت: الأدب **1** بعد نجيب محفوظ، الفن **1** بعد أم كلثوم، والعلوم والتكنولوجيا **3** بعد ابن الهيثم، مع بقاء السجلات غير المنشورة خارج projection العام.

| التحقق | نجيب محفوظ | أم كلثوم | ابن الهيثم |
|---|---|---|---|
| Public person URL | 200 | 200 | 200 |
| Exact Arabic search | سجل واحد | سجل واحد | سجل واحد |
| Partial Latin search | `Naguib` يعيد السجل | `Umm` يعيد السجل | `Ibn` يعيد السجل مع نتائج Ibn منشورة أخرى |
| Category page | `/categories/literature` count 1 | `/categories/arts` count 1 | `/categories/science-technology` count 3 |
| Image in public projection | null/غائب | null/غائب | null/غائب |
| Internal ID/session/audit/private data | غير ظاهر | غير ظاهر | غير ظاهر |

## Sitemap وSEO

يتضمن `https://a3-lam.vercel.app/sitemap.xml` روابط السجلات الثلاثة المنشورة: `naguib-mahfouz` و`umm-kulthum` و`ibn-al-haytham`، ولا يتضمن رابطًا لمسودة Pilot غير منشورة. فحص HTML المحفوظ للصفحات الثلاث وجد عنوانًا فريدًا، ووصفًا مطابقًا للمحتوى المرئي، وcanonical صحيحًا، وOpen Graph title/description/url، وكتلة Schema.org `Person` واحدة لكل صفحة، متوافقة مع الاسم والوصف والرابط والمهنة الظاهرة.[5]

## التحقق الاستجابي في Chromium

شُغّل Chromium headless على الصفحات العامة الثلاث، بالمقاسات `390×844` و`393×852` و`768×1024` و`1440×900`، وحُفظت 12 لقطة شاشة. أظهرت المراجعة البصرية contact sheet عدم وجود انهيار واضح في header أو البطاقات أو النصوص أو الترتيب العام، مع بقاء RTL واتجاهات المحتوى قابلة للقراءة في المقاسات الصغيرة والكبيرة. الدليل الداعم موجود في [contact sheet المقاسات](evidence/phase17.14/pilot_viewports_contact_sheet.jpg).

هذا يثبت فحص Chromium بهذه المقاسات فقط. لا يُقدَّم هذا التقرير كدليل على Firefox أو Safari/WebKit أو screen reader أو WCAG measured contrast؛ تلك ليست ضمن الأدلة المنفذة في هذا Pilot.

## القيود والملاحظات

أبلغت Production أن مزود الوسائط يحتاج إلى إعداد، ولذلك لم تُرفع صور ولم تُستخدم صور بديلة أو روابط صور غير مرخصة. كما بقي contact email provider غير مهيأ، لكنه غير مطلوب لدورة People التحريرية المحدودة. لم تُجرَ أي تغييرات كود أو schema أو migration أو إعدادات Vercel/DNS/secrets، ولم يُشغّل migration runner أو `pnpm test:integration`.

لا توجد مشكلة P0 أو P1 في الخصوصية أو RBAC أو عزل النشر أو التكرار أو تمثيل المصادر. لا توجد تغييرات إصلاحية Production مطلوبة. القيد الوحيد المؤثر على التوسع هو أن Pilot أثبت المسار التحريري لثلاثة سجلات فقط، وليس كفاءة Population أو bulk workflow.

## Git وDeployment closeout

كان baseline الكودي قبل Pilot على `main` عند `478f0a4c4cae117302b4271878aacaf3b01e2dd1`، وكان working tree نظيفًا ومتساويًا مع `origin/main`. لم يتغير الكود أو dependencies أو lockfile أو migrations أو schema، ولم يُطلق deployment جديد؛ Production code بقي على نفس baseline، بينما اقتصرت التغييرات على المحتوى المسموح به داخل Production CMS. سيُذكر SHA النهائي لتوثيق هذا التقرير نفسه في رسالة التسليم بعد commit واحد عادي ودفعه إلى `main`.

## الإيقاف الإلزامي

يتوقف Phase 17.14 هنا. لا يبدأ أي إدخال إضافي، ولا bulk import، ولا Population واسعة، ولا Phase 17.15، ولا Phase 18، ولا Android، ولا VPS، ولا DNS، ولا migration أو schema work، إلا بطلب منفصل وصريح.

## References

[1]: https://www.nobelprize.org/prizes/literature/1988/mahfouz/biographical/ "Nobel Prize Outreach — Naguib Mahfouz biographical"
[2]: https://www.britannica.com/biography/Naguib-Mahfouz "Encyclopaedia Britannica — Naguib Mahfouz"
[3]: https://www.britannica.com/biography/Umm-Kulthum-Egyptian-musician "Encyclopaedia Britannica — Umm Kulthum"
[4]: https://www.britannica.com/biography/Ibn-al-Haytham "Encyclopaedia Britannica — Ibn al-Haytham"
[5]: https://a3-lam.vercel.app/sitemap.xml "A3LAM Production sitemap"
