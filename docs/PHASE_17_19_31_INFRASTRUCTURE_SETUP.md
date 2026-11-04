# PHASE 17.19.31 — دليل إعداد البيئة المعزولة

**الحالة:** `READY FOR MANUAL PROVISIONING`

**نطاق هذه الوثيقة:** تخطيط وتجهيز يدوي لبيئة اختبار معزولة لتجربة استرداد كلمة المرور ودعوات الإدارة. لا تثبت هذه الوثيقة أن أي مورد أُنشئ أو اختُبر فعليًا.

## 1. قواعد العزل غير القابلة للتفاوض

يجب أن تكون بيئة rehearsal مستقلة عن Production في قاعدة البيانات، والبريد، ومخزن rate-limit، وعنوان HTTPS، والمتغيرات السرية، وحسابات الاختبار. لا يكفي تغيير اسم الفرع أو عنوان URL إذا ظل التطبيق يستخدم `DATABASE_URL` أو tokens الخاصة بـProduction.

الاختيار المفضل هو **Neon Project جديد** لا Branch من مشروع Production. ينسخ Neon عند إنشاء Branch مخطط وبيانات الفرع الأب، مع أن كل Branch يملك connection string مستقلًا؛ لذلك لا يُستخدم Branch من Production لهذه التجربة إلا إذا كان Schema-only Branch أو كان قد ثبت أن البيانات الحساسة غير موجودة. توثّق Neon أن Schema-only Branch ينشئ المخطط دون بيانات المشروع الأب [1].

لا تُنسخ أي قيمة سرية إلى مستودع Git أو تذكرة أو سجل طرفية. تُسجّل أسماء المتغيرات فقط. تُخزن القيم في Vercel كـSecret، وتُحصر في بيئة rehearsal.

## 2. مصفوفة الموارد المطلوبة

| المورد | الاختيار الإلزامي | الاختيار المفضل | دليل العزل المطلوب |
|---|---|---|---|
| PostgreSQL | مشروع وقاعدة اختبار مستقلة | Neon Project جديد باسم واضح مثل `a3lam-credential-rehearsal` | Project ID وbranch/database مختلفان عن Production، دون بيانات Production |
| تطبيق HTTPS | عنوان لا يطابق Production | Vercel Project منفصل أو Preview deployment مخصص مع متغيرات مستقلة | hostname مستقل وdeployment commit معروف |
| البريد | Postmark Sandbox Server | Server جديد من نوع Sandbox | Server ID وServer Token مختلفان عن Live/Production |
| rate-limit | Redis منفصل | Upstash Redis database جديدة | endpoint/token مستقلان عن أي بيئة أخرى |
| الحسابات | هويات اختبارية فقط | نطاق بريد اختبار مملوك للفريق أو عناوين sandbox موثقة | عدم استخدام بريد أو كلمة مرور Production |
| webhooks | اختيارية للتجربة الأساسية | endpoint HTTPS منفصل على تطبيق rehearsal | URL لا يشير إلى Production ولا يقبل أحداثًا من بيئات أخرى |

## 3. Neon — إنشاء PostgreSQL معزول

### 3.1 الاختيار المفضل: مشروع Neon جديد

ينفذ مالك البنية الخطوات الآتية من [Neon Console](https://console.neon.tech):

1. افتح **Projects** ثم اختر **New Project**.
2. أنشئ مشروعًا جديدًا باسم واضح، مثل `a3lam-credential-rehearsal`، وفي المنطقة الأقرب إلى بيئة الاختبار.
3. أنشئ قاعدة بيانات وrole للاختبار فقط. لا تستخدم اسم مشروع Production أو role Production.
4. اترك الفرع الافتراضي الجديد هو فرع rehearsal، أو أنشئ فرعًا داخله باسم مثل `rehearsal-credential-lifecycle`.
5. من **Connect** اختر branch الاختبار، role الاختبار، وdatabase الاختبار، ثم انسخ connection string إلى مدير أسرار آمن فقط. لا تضعه في التقرير أو Git.
6. احتفظ بالآتي كبيانات تعريف غير سرية: Neon Project ID، Branch ID، Database name، والمنطقة. لا تسجل كلمة المرور أو connection string.

### 3.2 بديل مشروط: Branch معزول

لا يُسمح باستخدام Branch من مشروع Production إلا بعد اختيار **Schema-only branching** أو إثبات مكتوب بأن الفرع لا يحتوي بيانات Production حساسة. فرع Neon العادي يرث المخطط والبيانات من الفرع الأب [1]. إذا لم يتوفر Schema-only Branch أو لم يمكن إثبات خلو البيانات، استخدم مشروعًا جديدًا بدلًا منه.

### 3.3 إعدادات التطبيق

أضف في Vercel rehearsal فقط:

```text
DATABASE_URL=<قيمة اتصال Neon الخاصة ببيئة rehearsal فقط>
```

لا تعدّل `DATABASE_URL` الخاصة بـProduction. لا تُنشر قيمة `DATABASE_URL` في client bundle، ولا في logs، ولا في روابط الاختبار. يوضح دليل Neon أن الربط اليدوي مع Vercel يتم من **Project → Settings → Environment Variables**، وأن التغيير لا يسري على deployment سابق حتى يُعاد نشره [2].

قبل تشغيل migration لاحقًا، يجب أن يراجع المسؤول يدويًا أن الاتصال يشير إلى Project وBranch وDatabase الخاصة بـrehearsal. تطبيق migration ليس جزءًا من هذه المرحلة.

## 4. Postmark — Sandbox Server منفصل

من [Postmark](https://account.postmarkapp.com):

1. افتح **Servers** ثم اختر **Create Server**.
2. سمِّ الخادم باسم يوضح الغرض، مثل `A3LAM Credential Rehearsal`.
3. اختر **Sandbox** عند إنشاء الخادم، وليس Live. نوع الخادم لا يمكن تغييره بعد الإنشاء [3].
4. أنشئ أو استخدم sender identity اختبارية غير إنتاجية، مع عدم استخدام sender Production إلا إذا كانت سياسة Postmark تسمح بذلك وبعد مراجعة المالك.
5. من إعدادات الخادم افتح **API Tokens** وأنشئ/انسخ Server Token إلى مدير الأسرار فقط.
6. لا تستخدم هذا token في المتصفح أو في متغير يبدأ بـ`NEXT_PUBLIC_`.

Postmark Sandbox لا يرسل الرسائل إلى recipient حقيقي؛ تُعالج الرسائل وتظهر في واجهة Postmark وواجهات API/webhooks، لكنها تُرسل إلى black hole. كما أن رسائل Sandbox تُحتسب ضمن حجم الإرسال الشهري [3]. لذلك لا تُستخدم عناوين أشخاص حقيقيين في الاختبار.

المتغيرات المقترحة، بالقيم المعزولة فقط:

```text
POSTMARK_SERVER_TOKEN=<Sandbox Server Token>
POSTMARK_FROM_EMAIL=<sender identity الاختبارية>
POSTMARK_MESSAGE_STREAM=<Message Stream الخاص بالاختبار، إن كان التطبيق يستخدمه>
```

للاختبارات التي تتحقق من صحة payload فقط دون إرسال رسالة، يسمح Postmark باستخدام القيمة الثابتة `POSTMARK_API_TEST` في ترويسة `X-Postmark-Server-Token` [4]. لا تُخلط هذه القيمة مع Server Token الحقيقي ولا تُستخدم لإثبات دورة البريد الكاملة.

### Webhooks — إعداد اختياري مضبوط

لا يلزم webhook لإثبات إنشاء reset/invitation token إذا كان harness يقرأ رسالة Sandbox بالطريقة المعتمدة. إذا لزم اختبار delivery أو bounce:

1. جهّز أولًا عنوان HTTPS مستقلًا لبيئة rehearsal.
2. من Postmark افتح **Server → Message Stream → Webhooks → Add webhook**.
3. استخدم URL خاصًا بـrehearsal فقط.
4. فعّل الحدث المطلوب فقط، مثل Delivery أو Bounce.
5. استخدم آلية التحقق والحماية المعتمدة في التطبيق، وسجّل event ID فقط، مع منع تكرار المعالجة.
6. لا توجه webhook إلى `https://a3-lam.vercel.app` أو أي Production hostname.

توضح Postmark أن webhook هو طلب HTTP POST إلى تطبيقك عند وقوع الحدث، وتوفر توثيقًا منفصلًا للتحقق والحماية وأحداث التسليم والارتداد [5].

## 5. Upstash — مخزن rate-limit منفصل

من [Upstash Console](https://console.upstash.com/redis):

1. اختر **Create Database**.
2. أنشئ Redis database جديدة باسم مثل `a3lam-credential-rehearsal-ratelimit`.
3. لا تشارك هذه database مع Production حتى لا تختلط counters أو سياسات الحظر.
4. احتفظ بالـREST URL والـREST Token في مدير الأسرار فقط.
5. إذا استُخدم تكامل Vercel، اربطه بمشروع rehearsal فقط. أما إذا كان الربط يدويًا، أضف المتغيرات في **Vercel Project → Settings → Environment Variables** لبيئة rehearsal فقط.

المتغيرات المطلوبة لـ`Redis.fromEnv()` هي:

```text
UPSTASH_REDIS_REST_URL=<REST URL الخاصة بقاعدة rehearsal>
UPSTASH_REDIS_REST_TOKEN=<REST Token الخاصة بقاعدة rehearsal>
```

يوضح توثيق Upstash أن `@upstash/ratelimit` يستخدم `Redis.fromEnv()`، وأن هذين المتغيرين مطلوبان، كما يوصي باستخدام prefix لتجنب تصادم المفاتيح عند مشاركة قاعدة واحدة [6]. في هذه الخطة لا تُشارك القاعدة أصلًا؛ ومع ذلك يجب أن يكون prefix الخاص بالتجربة واضحًا مثل `a3lam:rehearsal:credential:`.

يجب اختبار rate limiting على الأقل باستخدام identifier مبني من IP وnormalized-email fingerprint، مع عدم تخزين البريد الخام في key أو logs. لا يُعتمد على in-memory limiter في deployment متعدد النسخ.

## 6. عنوان HTTPS وبيئة Vercel المعزولة

الاختيار المفضل هو إنشاء Vercel Project منفصل مخصص لـrehearsal، مثل `a3lam-credential-rehearsal`، وربطه بفرع اختبار لا يساوي Production branch. عند إعداد **Project → Settings → Environment Variables**، أضف المتغيرات المعزولة التالية فقط:

```text
APP_BASE_URL=<HTTPS hostname الخاص بالتجربة>
DATABASE_URL=<Neon rehearsal connection string>
POSTMARK_SERVER_TOKEN=<Postmark Sandbox token>
POSTMARK_FROM_EMAIL=<sender الاختباري>
POSTMARK_MESSAGE_STREAM=<stream الاختباري، إن لزم>
UPSTASH_REDIS_REST_URL=<Upstash rehearsal URL>
UPSTASH_REDIS_REST_TOKEN=<Upstash rehearsal token>
SESSION_COOKIE_NAME=<اسم cookie خاص بالتجربة>
PASSWORD_RESET_BASE_URL=<رابط reset على rehearsal، إن كان التطبيق يفصله>
ADMIN_INVITATION_BASE_URL=<رابط invitation على rehearsal، إن كان التطبيق يفصله>
POSTMARK_WEBHOOK_SECRET=<سر webhook الخاص بالتجربة، إن كان التطبيق يستخدمه>
```

استخدم **Preview** أو **Custom Environment** المناسبة للتجربة، ولا تختَر Production لهذه القيم. توضح Vercel أن المتغيرات تُحدد لكل Environment، وأن تعديلها لا يطبق على deployments السابقة إلا بعد deployment جديد [7].

إذا استُخدم Preview بدل مشروع منفصل، يجب أن يثبت المسؤول أن Preview لا يرث أي متغير Production حساس باسم مختلف أو fallback، وأن جميع routes الخاصة بالتجربة تستخدم `APP_BASE_URL` المعزول. المشروع المنفصل هو الخيار الأكثر أمانًا لتقليل احتمال binding غير مقصود.

## 7. حسابات الاختبار والهويات

أنشئ حسابات اختبارية فقط بعد اكتمال العزل:

- `test-user-01`: حساب مستخدم عادي ببريد اختبار لا يخص شخصًا حقيقيًا.
- `test-admin-01`: هوية إدارية اختبارية بدور منخفض الصلاحية لاختبار invitation.
- `test-editor-01`: هوية اختبارية اختيارية لمراجعة حدود الدور.
- `test-expired-01`: حساب أو دعوة تُستخدم لاختبار expiry، دون إعادة استخدام حساب Production.

المطلوب أن تكون كلمات المرور مولدة عشوائيًا ومدارة خارج Git. لا تستخدم بريد مالك المشروع أو حسابًا إداريًا Production. لا تُنشأ أي من هذه الحسابات في Production ضمن هذه المرحلة.

## 8. Callback URLs وwebhooks

يجب تسجيل العناوين التالية كقيم اختبارية فقط عند الحاجة:

```text
APP_BASE_URL=https://<rehearsal-host>
PASSWORD_RESET_URL=https://<rehearsal-host>/reset-password
ADMIN_INVITATION_URL=https://<rehearsal-host>/admin/invitations/accept
POSTMARK_WEBHOOK_URL=https://<rehearsal-host>/api/webhooks/postmark
```

المسارات النهائية يجب مطابقتها مع routes الفعلية في الكود قبل التسجيل. لا تُضاف أي callback إلى مزود خارجي قبل التأكد من أن hostname لا يشير إلى Production.

## 9. ترتيب التنفيذ اليدوي المقترح

1. إنشاء Neon Project الجديد وتسجيل معرفاته غير السرية.
2. إنشاء Postmark Sandbox Server وتسجيل Server ID فقط.
3. إنشاء Upstash Redis database جديدة وتسجيل database name فقط.
4. إنشاء Vercel rehearsal project أو Preview target منفصل.
5. إضافة المتغيرات المعزولة كـSecrets، كل متغير في Environment الصحيح.
6. نشر deployment اختبار لا يحتوي على أي Production binding.
7. تنفيذ [وثيقة التحقق](./PHASE_17_19_31_ISOLATION_VERIFICATION.md) كاملة.
8. بعد PASS فقط، يُطلب تفويض مستقل لتطبيق migration المقترحة على Neon rehearsal.
9. لا تُنفذ Password Reset أو Admin Invitation rehearsal قبل نجاح migration والتحقق من routes الفعلية.

## 10. ما هو إلزامي وما هو اختياري

**إلزامي قبل أي rehearsal:** Neon Project منفصل أو Schema-only Branch مثبت العزل، Postmark Sandbox Server، Upstash Redis منفصل، HTTPS hostname مستقل، متغيرات منفصلة، حسابات اختبار، وسجل تحقق PASS.

**اختياري:** Postmark Delivery/Bounce webhook، Vercel Custom Environment بدل Project مستقل، Message Stream منفصل إذا كان runtime يدعمه، وbranch cleanup تلقائي. لا يجعل الخيار الاختياري البيئة آمنة إذا فشل أي شرط إلزامي.

## 11. الحالة الحالية وحدود هذه الوثيقة

لم تُنشأ أي بنية تحتية ضمن هذه المرحلة. لم تُستخدم Production credentials، ولم تُشغّل migrations أو SQL، ولم تُعدّل Vercel أو Neon أو Postmark أو Upstash، ولم يُنشر runtime code. هذه الوثيقة جاهزة للتنفيذ اليدوي فقط.

## المراجع

[1]: https://neon.tech/docs/get-started-with-neon/workflow-primer "Neon Database Branching Workflow Primer"
[2]: https://neon.tech/docs/guides/vercel-manual "Neon Manual Vercel Connection"
[3]: https://postmarkapp.com/developer/user-guide/sandbox-mode/server-sandbox-mode "Postmark Server Sandbox Mode"
[4]: https://postmarkapp.com/developer/api/overview "Postmark API Overview and Authentication"
[5]: https://postmarkapp.com/developer/webhooks/webhooks-overview "Postmark Webhooks Overview"
[6]: https://upstash.com/docs/redis/sdks/ratelimit-ts/gettingstarted "Upstash Ratelimit TypeScript Getting Started"
[7]: https://vercel.com/docs/environment-variables "Vercel Environment Variables"
