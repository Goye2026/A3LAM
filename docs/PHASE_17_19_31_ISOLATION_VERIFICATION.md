# PHASE 17.19.31 — مصفوفة التحقق من العزل

**الحالة قبل التنفيذ:** `PENDING MANUAL PROVISIONING`

**الغرض:** إثبات أن بيئة rehearsal الخاصة بدورة استرداد كلمة المرور ودعوات الإدارة لا تصل إلى موارد Production ولا تعدّلها. لا تُعد هذه الوثيقة دليلًا على أن أي مورد أُنشئ أو أن أي اختبار نُفذ.

## قواعد الإثبات

لا تُسجل نتيجة `PASS` بالاستنتاج أو من إعداد غير قابل للمراجعة. يجب أن يحتوي كل بند على دليل قابل لإعادة الفحص، مثل لقطة من لوحة المزود مع إخفاء الأسرار، أو deployment URL، أو معرف مورد غير سري، أو سجل اختبار لا يتضمن tokens أو كلمات مرور أو connection strings.

تُسجل القيم التالية فقط عندما تكون غير سرية:

- اسم المشروع أو المورد.
- Project ID أو Branch ID أو Server ID أو database name.
- hostname العام لبيئة rehearsal.
- commit/deployment ID.
- timestamp واسم المراجع.

يُمنع تسجيل:

- `DATABASE_URL` أو أي جزء منها.
- Postmark Server Token أو Upstash REST Token.
- كلمات المرور أو raw reset/invitation tokens.
- session cookies أو Authorization headers.
- محتوى رسائل قد يحتوي رابط token خامًا.

## معيار القرار النهائي

- **PASS:** جميع البنود الإلزامية من 1 إلى 10 محققة بدليل مستقل، ولا يوجد بند FAIL.
- **FAIL:** أي دليل يثبت أن مورد rehearsal يطابق Production، أو أن التطبيق يصل إلى Production، أو أن secret غير معزول، أو أن test write وقع على Production.
- **BLOCKED / PENDING:** لم يتوفر الوصول أو الدليل الكافي. لا يُعامل الغياب كـPASS.

لا يجوز بدء migration أو rehearsal stateful قبل أن تكون البنود 1–10 `PASS`.

## مصفوفة التحقق

### 1. هوية قاعدة البيانات

**الهدف:** إثبات أن PostgreSQL هو مورد rehearsal مستقل.

**الإجراء:** من Neon Console افتح مشروع rehearsal ثم **Connect** واختر branch وdatabase وrole الاختبار. قارن Project ID وBranch ID وDatabase name مع سجل Production المتاح للمالك، دون نسخ connection string.

**PASS إذا:** Project ID وBranch ID وDatabase name تخص rehearsal، ولا يوجد تطابق مع Production، ولا تعتمد البيئة على Branch عادي ينسخ بيانات Production دون إثبات Schema-only.

**FAIL إذا:** تطابقت الهوية مع Production، أو تعذر تحديد الهوية، أو ظهر أن الفرع يحتوي بيانات Production غير مصرح بها.

**الدليل:** معرفات غير سرية، لقطة لوحة Neon بعد إخفاء credentials.

**النتيجة:** `PENDING MANUAL PROVISIONING`

**المراجع/التاريخ:** ____________________

### 2. سلامة المخطط والبيانات الابتدائية

**الهدف:** إثبات أن قاعدة rehearsal لا تحتوي بيانات Production حساسة.

**الإجراء:** بعد تفويض مستقل لاحق، استخدم قناة قراءة معتمدة للتحقق من migration history وعدد سجلات الحسابات الاختبارية. لا تُجرى هذه الخطوة من خلال Production ولا تُنفذ في مرحلة إنشاء الوثائق.

**PASS إذا:** القاعدة جديدة أو Schema-only، ولا توجد سجلات Production، وتوجد فقط بيانات اختبار مصرح بها.

**FAIL إذا:** وُجدت بيانات أشخاص أو مستخدمين Production، أو تعذر تمييز مصدر البيانات.

**الدليل:** تقرير metadata/row-count منزوعة الحساسية، دون محتوى شخصي أو secrets.

**النتيجة:** `PENDING MANUAL PROVISIONING`

**المراجع/التاريخ:** ____________________

### 3. Postmark Sandbox

**الهدف:** إثبات أن البريد لا يمكن أن يصل إلى inbox حقيقي.

**الإجراء:** من Postmark افتح **Servers** وتحقق أن Server الاختبار موسوم Sandbox. سجّل Server ID فقط. أرسل لاحقًا رسالة اختبار من التطبيق المعزول بعد تفويض rehearsal.

**PASS إذا:** الخادم Sandbox مستقل، وServer ID مختلف عن أي Live Server، ولا يوجد recipient حقيقي في سيناريو الاختبار. رسائل Sandbox لا تصل إلى recipient فعلي حسب توثيق Postmark.

**FAIL إذا:** كان الخادم Live، أو استُخدم token لخادم Production، أو ظهر تسليم إلى inbox حقيقي.

**الدليل:** Server type وServer ID، ونتيجة رسالة اختبار منزوعة token.

**النتيجة:** `PENDING MANUAL PROVISIONING`

**المراجع/التاريخ:** ____________________

### 4. عزل Upstash rate-limit

**الهدف:** إثبات أن counters الخاصة بالتجربة لا تُكتب في Redis Production.

**الإجراء:** من Upstash Console سجّل database name وendpoint identity غير السريين. شغّل لاحقًا اختبار rate limit في rehearsal فقط، وتحقق من ظهور counters في database الاختبار دون عرض token.

**PASS إذا:** database مستقلة، وURL/endpoint لا يطابق Production، وcounters تظهر في المورد الاختباري فقط.

**FAIL إذا:** اشتركت البيئتان في نفس database دون namespace موثق، أو لم يمكن تحديد المورد الذي استقبل الكتابة.

**الدليل:** database name، سجلات rate-limit منزوعة السر، ووقت الاختبار.

**النتيجة:** `PENDING MANUAL PROVISIONING`

**المراجع/التاريخ:** ____________________

### 5. عزل Vercel والـHTTPS

**الهدف:** إثبات أن التطبيق يعمل على hostname وdeployment منفصلين.

**الإجراء:** افتح مشروع rehearsal في Vercel، ثم **Settings → Environment Variables**. راجع أن المتغيرات المعزولة مربوطة بـPreview أو Custom Environment أو المشروع المنفصل، لا بـProduction. سجّل deployment URL وcommit SHA فقط.

**PASS إذا:** hostname مستقل، وdeployment لا يستخدم Production environment variables، وتوجد deployment metadata قابلة للمراجعة.

**FAIL إذا:** hostname هو Production، أو متغير rehearsal موجود في Production، أو لا يمكن تمييز deployment.

**الدليل:** URL، deployment ID، commit SHA، ولقطة إعدادات بعد إخفاء القيم.

**النتيجة:** `PENDING MANUAL PROVISIONING`

**المراجع/التاريخ:** ____________________

### 6. فحص أسماء المتغيرات وقيمها دون كشفها

**الهدف:** إثبات اكتمال الربط دون قراءة الأسرار.

**الإجراء:** راجع وجود الأسماء الآتية في Environment الصحيحة، مع إبقاء القيم مخفية:

```text
DATABASE_URL
POSTMARK_SERVER_TOKEN
POSTMARK_FROM_EMAIL
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
APP_BASE_URL
SESSION_COOKIE_NAME
PASSWORD_RESET_BASE_URL
ADMIN_INVITATION_BASE_URL
```

أضف `POSTMARK_MESSAGE_STREAM` و`POSTMARK_WEBHOOK_SECRET` فقط إذا كان runtime يحتاجهما.

**PASS إذا:** كل secret موجود في rehearsal فقط، ولا توجد قيمة Production في target environment، ولا يظهر أي secret في build output أو client bundle.

**FAIL إذا:** secret مفقود، أو reused، أو exposed client-side، أو مرتبط ببيئة Production.

**الدليل:** أسماء المتغيرات وEnvironment scope فقط.

**النتيجة:** `PENDING MANUAL PROVISIONING`

**المراجع/التاريخ:** ____________________

### 7. عزل الحسابات والهويات

**الهدف:** منع استخدام مستخدم أو مدير Production في الاختبار.

**الإجراء:** أنشئ بعد نجاح البنود السابقة حسابات `test-user-01` و`test-admin-01` ومرجعًا اختياريًا لـ`test-editor-01`. استخدم عناوين اختبارية وكلمات مرور مولدة خارج Git.

**PASS إذا:** كل الحسابات جديدة وموسومة للاختبار، ولا توجد جلسة أو cookie من Production، ويمكن حذفها أو تعطيلها دون أثر على Production.

**FAIL إذا:** استُخدم بريد أو دور أو session Production، أو تعذر إثبات استقلال الحسابات.

**الدليل:** معرفات داخلية منزوعة الحساسية، دون البريد الكامل أو كلمات المرور أو cookies.

**النتيجة:** `PENDING MANUAL PROVISIONING`

**المراجع/التاريخ:** ____________________

### 8. عزل الروابط والـwebhooks

**الهدف:** منع reset/invitation links أو Postmark events من الوصول إلى Production.

**الإجراء:** تحقق أن روابط البريد تشير إلى rehearsal hostname وأن webhook، إن فُعل، يشير إلى rehearsal API فقط. افحص DNS/URL النهائي دون إرسال بيانات حساسة.

**PASS إذا:** لا يوجد رابط يحتوي Production hostname، وwebhook URL مستقل، ولا يقبل endpoint أحداثًا من بيئة أخرى دون تحقق.

**FAIL إذا:** أي رابط reset/invitation أو webhook يشير إلى Production، أو لا توجد حماية من cross-environment event injection.

**الدليل:** hostname والمسارات العامة فقط، مع إخفاء أي token في الرابط.

**النتيجة:** `PENDING MANUAL PROVISIONING`

**المراجع/التاريخ:** ____________________

### 9. اختبار حاجز القراءة والكتابة

**الهدف:** إثبات أن عمليات rehearsal لا تصل إلى Production.

**الإجراء:** بعد تفويض rehearsal، أنشئ/استهلك token اختبار في البيئة المعزولة فقط. راقب سجل القاعدة المعزولة وسجل Production read-only إن كان متاحًا للمالك. لا تنفذ أي كتابة على Production بغرض الاختبار.

**PASS إذا:** تظهر كل التغييرات المتوقعة في القاعدة المعزولة فقط، ولا يظهر أي تغيير في Production، ولا توجد استدعاءات runtime إلى Production hostname أو database.

**FAIL إذا:** ظهر أي insert/update/delete أو session change أو email send في Production، أو تعذر فصل السجلين.

**الدليل:** IDs اختبارية، timestamps، وسجلات redacted من البيئتين.

**النتيجة:** `PENDING MANUAL PROVISIONING`

**المراجع/التاريخ:** ____________________

### 10. اختبار التسرب في logs وbundles

**الهدف:** إثبات عدم ظهور secrets أو raw tokens.

**الإجراء:** راجع Vercel Function logs وbrowser Network وbuild artifacts للـrehearsal. ابحث فقط عن أسماء أنماط التسرب بعد تنقيح النتائج، ولا تنسخ القيم المطابقة.

**PASS إذا:** لا تظهر `DATABASE_URL` أو token أو password أو raw reset/invitation token أو session cookie في logs أو client bundle أو URL history.

**FAIL إذا:** ظهر أي secret أو raw token أو password في قناة غير server-only.

**الدليل:** نتيجة بحث redacted، timestamp، deployment ID.

**النتيجة:** `PENDING MANUAL PROVISIONING`

**المراجع/التاريخ:** ____________________

## بوابة الإيقاف

يجب التوقف فورًا وعدم تطبيق migration أو إنشاء حسابات أو تنفيذ rehearsal إذا حدث واحد من الآتي:

- لا يمكن تحديد Project/Branch/Database المستهدف.
- لا يمكن إثبات أن Postmark Server من نوع Sandbox.
- لا يمكن إثبات أن Upstash Redis منفصل.
- لا يمكن فصل Vercel environment عن Production.
- ظهر secret أو raw token في logs أو browser.
- ظهرت أي كتابة أو رسالة أو جلسة مرتبطة بـProduction.
- طلبت خطوة ما قراءة أو طباعة secret.

## نموذج اعتماد المراجعة

```text
Environment: ______________________________
Neon Project ID / Branch ID: ______________
Postmark Server ID: _______________________
Upstash Database name: ____________________
Rehearsal hostname: _______________________
Deployment ID / commit SHA: ______________

Mandatory checks passed: ______ / 10
Any FAIL: YES / NO
Any unverified item: YES / NO
Production resource modified: YES / NO
Secrets exposed: YES / NO

Final decision: PASS / FAIL / BLOCKED
Reviewer: _________________________________
Date (UTC): _______________________________
Notes: ____________________________________
```

## الحالة الحالية

هذه الوثيقة لم تُستخدم لإجراء تحقق فعلي. لا توجد بنية تحتية مُنشأة أو متغيرات مُراجعة أو migrations مُطبقة ضمن Phase 17.19.31 حتى تاريخ إعدادها. لذلك تبقى جميع البنود `PENDING MANUAL PROVISIONING` إلى أن يقدم المالك أدلة فعلية ضمن بيئة معزولة.

## المراجع

[1]: https://neon.tech/docs/get-started-with-neon/workflow-primer "Neon Database Branching Workflow Primer"
[2]: https://neon.tech/docs/guides/vercel-manual "Neon Manual Vercel Connection"
[3]: https://postmarkapp.com/developer/user-guide/sandbox-mode/server-sandbox-mode "Postmark Server Sandbox Mode"
[4]: https://postmarkapp.com/developer/api/overview "Postmark API Overview and Authentication"
[5]: https://postmarkapp.com/developer/webhooks/webhooks-overview "Postmark Webhooks Overview"
[6]: https://upstash.com/docs/redis/sdks/ratelimit-ts/gettingstarted "Upstash Ratelimit TypeScript Getting Started"
[7]: https://vercel.com/docs/environment-variables "Vercel Environment Variables"
