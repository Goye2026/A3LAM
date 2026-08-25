# A3LAM — أعلام

أعلام منصة عربية لاكتشاف الشخصيات وفهم أثرها عبر ملفات منظمة، مصادر واضحة، ومراجعة بشرية قبل النشر. الواجهة الأساسية عربية وRTL، والبنية العامة جاهزة لاستقبال محتوى تحريري حقيقي عند توفير بيئة الاستضافة وقاعدة البيانات.

## الحالة الحالية

المشروع في **Phase 17.7 — Release Preparation Sprint** فوق المراحل السابقة. تتضمن الحالة الحالية Admin Control Center عمليًا، Site Experience hub، نشرًا قائمًا على Vercel، مسارًا موثقًا لـDocker/VPS/PostgreSQL، وحدودًا صريحة لأساس Android. لا تتضمن هذه المرحلة Population أو seed إنتاجيًا أو AI أو semantic search أو analytics أو إعادة بناء Auth/RBAC/Database.

## Toolchain

| المكوّن | الإصدار |
|---|---:|
| Next.js | `16.3.1` |
| React | `19.2.8` |
| TypeScript | `6.0.2` |
| Node.js | `22.13.0` |
| pnpm | `11.21.0` |
| ESLint | `9.39.5` |

الـ lockfile مرجع reproducible. استخدم `pnpm install --frozen-lockfile` في CI وبيئة النشر.

## المتطلبات

للتطوير أو النشر تحتاج إلى Node.js `22.13.0`، وpnpm `11.21.0`، وPostgreSQL متوافق مع البنية الحالية عند تشغيل المسارات العامة المعتمدة على البيانات. لا يحتاج بناء الواجهة وحده إلى PostgreSQL، لكن تشغيل الصفحات الديناميكية وAPI البحث يتطلبان اتصال قاعدة بيانات صالحًا.

في النشر الحقيقي استخدم PostgreSQL مُدارًا أو خدمة PostgreSQL موثوقة، ولا تضع بيانات الاتصال داخل المستودع. القيم المحلية في `.env.example` أمثلة تطوير فقط.

## إعداد البيئة

انسخ ملف البيئة النموذجي محليًا:

```bash
cp .env.example .env.local
```

المتغيرات المدعومة:

| المتغير | مطلوب | الاستخدام |
|---|---:|---|
| `NODE_ENV` | نعم | `development` محليًا و`production` في بيئة النشر. |
| `DATABASE_URL` | نعم لتشغيل البيانات | رابط اتصال PostgreSQL server-only. لا يُرسل إلى المتصفح. |
| `DATABASE_MAX_CONNECTIONS` | لا | الحد الأقصى لاتصالات postgres.js؛ القيمة الافتراضية `5`. |
| `NEXT_PUBLIC_SITE_URL` | مطلوب للنشر العام | origin عام بصيغة HTTPS، مثل `https://example.org`، للـ canonical وsitemap وOpen Graph وJSON-LD. |
| `LOG_LEVEL` | لا | مستوى logging المحلي؛ القيمة النموذجية `info`. |
| `A3LAM_ALLOW_SYNTHETIC_SEED` | لا | يجب تفعيله صراحةً فقط عند تشغيل seed التطويري، ولا يجوز تفعيله في production. |
| `A3LAM_ADMIN_ACCESS_TOKEN` | نعم لتفعيل CMS | سر server-only بطول 32 محرفًا على الأقل لتسجيل دخول المحررين؛ لا تضعه في Git أو client code. |
| `A3LAM_ADMIN_SESSION_TTL_SECONDS` | لا | مدة cookie جلسة Admin الموقعة؛ الافتراضي 8 ساعات والحد الأقصى 7 أيام. |
| `A3LAM_STORAGE_UPLOAD_URL` | لا | endpoint server-only لرفع HTTP PUT؛ إذا غاب يبقى رفع الملفات معطلًا برسالة 503. |
| `A3LAM_STORAGE_PUBLIC_BASE_URL` | لا | origin العام لروابط الملفات التي يعيدها provider الخارجي. |
| `A3LAM_STORAGE_UPLOAD_TOKEN` | لا | token server-only لـ provider التخزين؛ لا يُرسل إلى العميل ولا يُحفظ في Git. |

في التطوير يمكن استخدام:

```env
NODE_ENV=development
DATABASE_URL=postgres://a3lam:a3lam@localhost:5432/a3lam
DATABASE_MAX_CONNECTIONS=5
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

في الإنتاج، عيّن `NODE_ENV=production`، ووفّر `DATABASE_URL` و`NEXT_PUBLIC_SITE_URL` و`A3LAM_ADMIN_ACCESS_TOKEN` من secret/configuration storage الخاص بمضيفك. يجب أن يكون رمز CMS عشوائيًا وطويلًا، ولا يُعاد استخدامه أو إرساله إلى المتصفح أو وضعه في Git. لا تستخدم `localhost` كعنوان عام للإنتاج ولا تضع كلمة مرور حقيقية في Git.

## قاعدة البيانات والمigrations

المسار العام هو:

```text
Next.js route/API → personService → PersonRepository → databaseRepository → PostgreSQL
```

الـ database client موجود في `lib/db/client.ts` ويُستخدم من طبقة الخادم فقط. ملفات SQL موجودة في `drizzle/migrations`. يقوم `scripts/db-migrate.mjs` بتطبيق الملفات المرتبة مرة واحدة داخل معاملات، ويسجل الإصدارات في `schema_migrations`.

لتجهيز قاعدة تطوير أو قاعدة نشر فارغة، بعد توفير `DATABASE_URL`:

```bash
pnpm db:migrate
```

لا يعتمد كود الإنتاج على seed التطويري. الاستعلامات العامة تستمر في فرض `status = 'published'` والتحقق من أن التصنيفات والمصادر المرتبطة منشورة، لذلك لا تُعرض سجلات `draft` أو `review` أو `archived`.

## Synthetic development seed

الـ seed الحالي مخصص للتطوير واختبار واجهة القراءة فقط. يحتوي على سجلات اصطناعية واضحة، ولا يمثل أشخاصًا حقيقيين أو شخصيات تاريخية أو محتوى إنتاجيًا. لا تشغله على قاعدة بيانات الإنتاج.

يتطلب التشغيل تفعيلًا صريحًا:

```bash
A3LAM_ALLOW_SYNTHETIC_SEED=true NODE_ENV=development pnpm db:seed
```

يفشل script دون `A3LAM_ALLOW_SYNTHETIC_SEED=true`، ويرفض التشغيل عندما تكون `NODE_ENV=production`. لا تستخدم هذا الأمر لاستيراد المحتوى التحريري الحقيقي.

## Portability and release handoff

توجد إجراءات التشغيل خارج Vercel في `docs/deployment/`، وتشمل Docker Compose وVPS وPostgreSQL والبيئة وdomain وbackup/restore وtroubleshooting. قائمة الجاهزية الموضوعية موجودة في `docs/release/launch-readiness.md`. أساس Android وحدوده الأمنية موثق في `android/README.md`، ولا تُعد نتائج Android أو Docker build ناجحة دون تشغيلها في بيئتها الفعلية.

## التشغيل المحلي

بعد إعداد البيئة وتطبيق migrations:

```bash
pnpm dev
```

يفتح الخادم المحلي عادةً على `http://localhost:3000`. تشغيل المسارات المعتمدة على PostgreSQL يتطلب أن تكون قاعدة البيانات متاحة.

## Build وproduction start

تحقق من التثبيت القابل لإعادة الإنتاج ثم أنشئ build الإنتاج:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

شغّل build الإنتاج:

```bash
pnpm start
```

قبل التشغيل العام، عيّن `NEXT_PUBLIC_SITE_URL` إلى origin HTTPS الفعلي. عند غيابه يستخدم التطبيق fallback محليًا `http://localhost:3000` للتطوير فقط.

## SEO والنشر العام

تستخدم الصفحات العامة canonical وOpen Graph من خلال `NEXT_PUBLIC_SITE_URL` عندما يكون مضبوطًا، مع fallback محلي واضح. المسارات `/robots.txt` و`/sitemap.xml` مشتقة من المسارات العامة والفئات والملفات المنشورة. لا يضاف `/search` إلى sitemap لأنه `noindex`، كما تُستبعد `/api/` من robots.

تحتوي صفحات الملفات المنشورة على Person JSON-LD مبني على المحتوى الظاهر فقط. الملفات غير المنشورة أو غير الصالحة لا تُفهرس ولا تكشف metadata داخلية. ملفات `unlisted` قابلة للرابط المباشر مع `noindex` ولا تدخل search أو category أو sitemap؛ ملفات `private` تعيد 404. تستخدم مسارات not-found الديناميكية boundary المتدفقة في Next.js؛ لذلك قد تعرض صفحة 404 مع status HTTP `200` في بعض الاستجابات المتدفقة، مع بقاء `noindex` وعدم كشف المحتوى.

## مسارات CMS الداخلية

| المسار | الغرض |
|---|---|
| `/admin/login` | تسجيل دخول المحرر عبر رمز وصول server-only؛ لا يُفهرس. |
| `/admin` | لوحة مؤشرات حالات السجلات، محمية بجلسة HttpOnly موقعة. |
| `/admin/people` | قائمة الشخصيات مع البحث والتصفية والإجراءات التحريرية. |
| `/admin/people/new` | إنشاء مسودة شخصية. |
| `/admin/people/[id]` | تحرير الشخصية والمصادر والتعليم والمسار الزمني. |
| `/admin/people/[id]/preview` | معاينة محمية لا تظهر للعامة قبل النشر. |
| `/api/admin/auth` | POST للدخول وDELETE للخروج؛ بقية `/api/admin/*` تتطلب جلسة صالحة. |
| `/admin/profiles` | مراجعة ملفات المستخدمين وإجراءات الموافقة والإرجاع والأرشفة. |

كل mutation في CMS يتحقق server-side من الجلسة، ويفحص payload، ويعيد أخطاء عامة دون SQL أو stack trace. مصادقة المستخدمين مستقلة عن Admin: `/register` و`/login` ينشئان جلسات DB opaque موقعة بالـ hash داخل `user_sessions`، ولا يُعاد استخدام `A3LAM_ADMIN_ACCESS_TOKEN`.

## المسارات العامة

| المسار | الغرض |
|---|---|
| `/` | الصفحة الرئيسية والاكتشاف |
| `/search` | البحث في السجلات المنشورة |
| `/categories` | فهرس المجالات |
| `/categories/[slug]` | ملفات مجال منشور |
| `/person/[slug]` | ملف شخصي منشور؛ يعرض CV مهنيًا لملفات المستخدم العامة مع fallback آمن للسجلات التحريرية القديمة. |
| `/register` | إنشاء حساب مستخدم مستقل. |
| `/login` | تسجيل دخول المستخدم. |
| `/account` | حساب المستخدم وحالة الملف. |
| `/account/profile` | إنشاء أو تعديل ملف CV وحفظه أو إرساله للمراجعة. |
| `/account/profile/preview` | معاينة خاصة للمستخدم فقط. |
| `/about` | عن أعلام |
| `/contact` | التواصل التحريري الحالي |
| `/privacy` | مبادئ الخصوصية الحالية |
| `/robots.txt` | تعليمات محركات البحث |
| `/sitemap.xml` | خريطة المسارات القابلة للفهرسة |
| `/icon.svg` | favicon |
| `/api/health` | health probe |
| `/api/search` | public search API محدود؛ يشمل الأشخاص التحريريين وملفات CV العامة فقط. |
| `/api/auth/register` و`/api/auth/login` و`/api/auth/logout` و`/api/auth/me` | مصادقة المستخدم المستقلة وجلسة opaque server-side. |
| `/api/account/profile` | قراءة أو حفظ ملف المستخدم أو إرساله للمراجعة؛ الملكية server-side. |
| `/api/account/profile/files` | رفع ملف آمن إلى provider خارجي اختياري؛ يعيد 503 عند غياب الإعداد. |
| `/api/admin/profiles` و`/api/admin/profiles/[id]` | قائمة وmoderation لملفات المستخدمين بحراسة Admin الحالية. |
| `/api/categories` | قائمة التصنيفات المنشورة لمحرر CV. |

## API والأمان الأساسي

يتحقق `/api/search` من طول المدخلات ويقصها إلى حد آمن، ويتعامل مع البحث الفارغ بنتيجة ثابتة، ويعيد projection عامًا محدودًا لا يحتوي internal database IDs أو category IDs أو biography أو source metadata. عند فشل الخدمة يعيد استجابة `503` عامة دون SQL أو stack trace.

تستخدم الاستجابة العامة headers تمنع MIME sniffing وclickjacking غير المقصود، وتضبط Referrer Policy وPermissions Policy، ويُفعّل HSTS في production. الروابط الخارجية للمصادر تستخدم `noopener noreferrer`. لا توجد أسرار أو بيانات اعتماد داخل client code أو المستودع.

## التحقق الخفيف

الأوامر الأساسية:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

اختبار PostgreSQL التكاملـي اختياري ويتطلب قاعدة بيانات متاحة، ويستخدم seed اصطناعيًا بتفعيل صريح ضمن بيئة غير production:

```bash
# Load DATABASE_URL from an untracked .env.local or protected shell environment.
A3LAM_ALLOW_SYNTHETIC_SEED=true NODE_ENV=development \
pnpm test:integration
```

## حدود الإصدار

لا يتضمن هذا الإصدار contributions أو verification workflows أو comments أو payments أو analytics أو semantic search أو تعدد اللغات. يتضمن CMS الداخلي دورة legacy منفصلة، وحسابات مستخدمين أساسية مع ملف واحد لكل حساب. رفع الملفات الخارجي اختياري ويتطلب provider مهيأ؛ لا يوجد fallback filesystem ولا تُحفظ bytes في PostgreSQL. لا تُنشأ حسابات أو ملفات اصطناعية في Production، ويجب أن يمر النشر عبر Admin والمصدر المهني وبوابة الحالة.
