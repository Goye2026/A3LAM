# A3LAM — Phase 17.14 Population Pilot Audit

**تاريخ التدقيق:** 26 أغسطس 2026

**النطاق:** ثلاثة سجلات People جديدة فقط في Production CMS. لا يشمل هذا السجل أي Population أخرى أو أي سجل موجود قبل Pilot.

## قاعدة التدقيق

هذا السجل يفرّق بين **mutation إنتاجي فعلي** وبين فحص GET أو معاينة محمية. جميع mutations أدناه نُفذت من أزرار CMS الرسمية في جلسة Admin المصادق عليها. لم تُستخدم SQL، ولم تُرسل POST/PATCH مباشرة، ولم تُستخدم seed/import أو migration أو schema change.

## سجل mutations

| # | السجل | العملية | الأداة/المسار | النتيجة |
|---:|---|---|---|---|
| 1 | نجيب محفوظ | إنشاء Person مع المصدرين وحفظ Draft | `/admin/people/new` → `حفظ كمسودة` | تم إنشاء `naguib-mahfouz` |
| 2 | نجيب محفوظ | Draft → Review | صفحة تحرير السجل → `إرسال للمراجعة` | تم |
| 3 | نجيب محفوظ | Review → Published | صفحة تحرير السجل → `نشر` | تم |
| 4 | أم كلثوم | إنشاء Person مع مصدر واحد وحفظ Draft | `/admin/people/new` → `حفظ كمسودة` | تم إنشاء `umm-kulthum` |
| 5 | أم كلثوم | Draft → Review | صفحة تحرير السجل → `إرسال للمراجعة` | تم |
| 6 | أم كلثوم | Review → Published | صفحة تحرير السجل → `نشر` | تم |
| 7 | ابن الهيثم | إنشاء Person مع مصدر واحد وحفظ Draft | `/admin/people/new` → `حفظ كمسودة` | تم إنشاء `ibn-al-haytham` |
| 8 | ابن الهيثم | Draft → Review | صفحة تحرير السجل → `إرسال للمراجعة` | تم |
| 9 | ابن الهيثم | Review → Published | صفحة تحرير السجل → `نشر` | تم |

**العداد النهائي للـmutations:** `3` People created، `3` Draft→Review، `3` Review→Published، `0` categories created، `0` images uploaded، `0` deletes، `0` profiles، `0` users/admins/editors.

## مصفوفة السجلات

| الاسم | slug | الفئة | المصدر/الحالة | التواريخ | التعليم | Timeline | الصورة | URL عام |
|---|---|---|---|---|---|---|---|---|
| نجيب محفوظ | `naguib-mahfouz` | الأدب / `literature` | Nobel official + Britannica، كلاهما High | `1911-12-11`، `2006-08-30` | تُرك فارغًا بعد فشل تحقق مرجع المصدر في الصف الاختياري | تُرك فارغًا لأن المصدر المتاح سنة فقط وحقل CMS يومي | فارغ؛ media provider غير مهيأ | `/person/naguib-mahfouz` |
| أم كلثوم | `umm-kulthum` | الفن / `arts` | Britannica، High | الميلاد المسجّل `1904-05-04` مع صياغة عدم يقين؛ الوفاة `1975-02-03` | فارغ | فارغ | فارغ؛ media provider غير مهيأ | `/person/umm-kulthum` |
| ابن الهيثم | `ibn-al-haytham` | العلوم والتكنولوجيا / `science-technology` | Britannica، Institution + High | حقلا التاريخ فارغان؛ التقريب بقي في prose فقط | فارغ | فارغ | فارغ؛ media provider غير مهيأ | `/person/ibn-al-haytham` |

## فحوص ما قبل النشر لكل سجل

أُجري بعد إنشاء كل Draft فحص عام قبل أي Review. كانت النتيجة لكل السجلات الثلاثة: رابط الشخص العام `404`، ونتيجة البحث العربي `{"items":[]}`، والسجل غير موجود في صفحة التصنيف العامة. هذه النتيجة تثبت publication isolation حتى مرحلة Draft.

بعد الانتقال إلى Review، فُتحت المعاينة الرسمية المحمية. عرضت المعاينة حالة **قيد المراجعة**، والتصنيف، والاسم، والسيرة، والمصدر، ولم تكن الصفحة متاحة من public URL. لم يُنفذ النشر إلا بعد قراءة المعاينة.

## فحوص ما بعد النشر

| الفحص | نجيب محفوظ | أم كلثوم | ابن الهيثم |
|---|---|---|---|
| الصفحة العامة | 200 وPublished | 200 وPublished | 200 وPublished |
| البحث العربي المطابق | سجل واحد | سجل واحد | سجل واحد |
| البحث اللاتيني الجزئي | `Naguib` → السجل | `Umm` → السجل | `Ibn` → السجل مع سجلات Ibn منشورة أخرى |
| التصنيف العام | الأدب count 1 | الفن count 1 | العلوم والتكنولوجيا count 3 |
| رابط البطاقة | `/person/naguib-mahfouz` | `/person/umm-kulthum` | `/person/ibn-al-haytham` |
| sitemap | موجود | موجود | موجود |
| الصورة | null/غائبة | null/غائبة | null/غائبة |
| بيانات خاصة أو داخلية | غير ظاهرة | غير ظاهرة | غير ظاهرة |

## فحص الخصوصية والإسقاط العام

فُحصت الصفحات العامة الثلاثة والناتج المرئي من Search. لم تظهر معرّفات Production الداخلية، أو بيانات الجلسة، أو tokens، أو audit data، أو حقول Admin، أو contact data خاصة، أو مصدر صورة غير معلن. أظهر Search `image:null` للسجلين اللذين فُحص ناتجهما مباشرة، ولم تعرض الصفحات أي صورة للسجلات الثلاثة.

## فحص SEO

فحص HTML المحفوظ للصفحات الثلاث وجد لكل سجل `title` فريدًا، و`description` مطابقًا للنبذة المرئية، و`og:title` و`og:description` و`og:url`، و`canonical` يطابق URL الثابت، وكتلة JSON-LD واحدة من نوع `Person`. لم يُدرج JSON-LD حقائق غير ظاهرة في الصفحة؛ أسماء الأشخاص والأوصاف والروابط والمهن كلها كانت مرئية في المحتوى العام.

| slug | title | canonical | JSON-LD |
|---|---|---|---|
| `naguib-mahfouz` | `نجيب محفوظ | أعلام` | `/person/naguib-mahfouz` | Person |
| `umm-kulthum` | `أم كلثوم | أعلام` | `/person/umm-kulthum` | Person |
| `ibn-al-haytham` | `ابن الهيثم | أعلام` | `/person/ibn-al-haytham` | Person |

## فحص Chromium بالمقاسات المطلوبة

استُخدم Chromium headless الحقيقي مع `--window-size` و`--virtual-time-budget` على الصفحات العامة الثلاث، وحُفظت لقطة لكل combination من السجل والمقاس. إجمالي الأدلة **12 لقطة**، موزعة على المقاسات `390×844` و`393×852` و`768×1024` و`1440×900`. أظهر الفحص البصري للـcontact sheet أن RTL، header، اسم السجل، category badge، النصوص، والمصدر بقيت ضمن تخطيط قابل للقراءة دون قصّ أو انهيار واضح.

الدليل المرئي: [pilot viewport contact sheet](evidence/phase17.14/pilot_viewports_contact_sheet.jpg).

هذا الفحص لا يساوي تحقق Firefox أو Safari/WebKit، ولا يساوي فحص screen reader أو measured WCAG contrast. لا تُسجل هذه البنود كـPASS في هذا التقرير.

## المصادر المستخدمة

| السجل | المصادر | ملاحظات تحريرية |
|---|---|---|
| نجيب محفوظ | [Nobel biography][1]، [Britannica][2] | مصدر رسمي ومصدر موسوعي؛ التعليم والـtimeline الاختياريان لم يُحفظا لعدم استيفاء مرجع CMS الآمن أو دقة التاريخ المطلوبة |
| أم كلثوم | [Britannica][3] | المصدر نفسه ينبه إلى تضارب السجلات المبكرة؛ انعكس ذلك صراحة في السيرة |
| ابن الهيثم | [Britannica][4] | التواريخ التقريبية لم تُحوّل إلى حقول exact؛ عُرض التقريب في النص فقط |

## أخطاء أو محاولات فاشلة

حدثت محاولة حفظ أولى لسجل نجيب محفوظ قبل Pilot النهائي، وفشل التحقق لأن صف التعليم الاختياري لم يحمل معرّف مصدر صالحًا. أزيل الصف من واجهة CMS، ولم يُستكمل أو يُستبدل ببيانات مخمّنة، ثم نجح حفظ المسودة عبر الزر الرسمي. لا توجد أدلة على إنشاء سجل أو source غير مقصود من المحاولة الفاشلة.

لم تظهر أخطاء P0/P1 في العزل أو الخصوصية أو RBAC أو duplicate slug أو source representation. لذلك لم يُجرَ fast-fix في Production، ولم تتغير ملفات الكود.

## حالة Git وProduction

قبل Pilot كان الفرع `main` نظيفًا عند `478f0a4c4cae117302b4271878aacaf3b01e2dd1` ومتساويًا مع `origin/main`. لم تتغير source files أو `package.json` أو `pnpm-lock.yaml` أو schema أو migrations أو secrets أو Vercel settings. لم يُطلق deployment جديد؛ النشر الإنتاجي للكود بقي baseline نفسه. تُضاف هذه الوثيقة وتقرير الإكمال فقط كتوثيق محلي في commit عادي منفصل، ويُذكر SHA النهائي في رسالة التسليم.

## القرار والحدود الإلزامية

القرار: **PILOT PASSED WITH LIMITATIONS**. المسار التحريري الأساسي صالح لثلاثة سجلات حقيقية موثقة، مع نجاح عزل النشر والبحث والتصنيف وSEO في Chromium. لا يوجد تفويض بتجاوز سقف Pilot أو بدء Population. يجب أن تبقى الخطوات التالية متوقفة: population واسعة، bulk import، Phase 17.15، Phase 18، Android، VPS، DNS، migrations، schema redesign، وإعداد media provider. أي استئناف يتطلب طلبًا منفصلًا.

## References

[1]: https://www.nobelprize.org/prizes/literature/1988/mahfouz/biographical/ "Nobel Prize Outreach — Naguib Mahfouz biographical"
[2]: https://www.britannica.com/biography/Naguib-Mahfouz "Encyclopaedia Britannica — Naguib Mahfouz"
[3]: https://www.britannica.com/biography/Umm-Kulthum-Egyptian-musician "Encyclopaedia Britannica — Umm Kulthum"
[4]: https://www.britannica.com/biography/Ibn-al-Haytham "Encyclopaedia Britannica — Ibn al-Haytham"
