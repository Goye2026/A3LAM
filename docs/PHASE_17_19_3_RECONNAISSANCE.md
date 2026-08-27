# PHASE 17.19.3 — Reconnaissance and Architecture Decision

## الحالة

هذا المستند يسجل تدقيقًا تمهيديًا قبل تنفيذ Phase 17.19.3. نطاق العمل محصور في بناء **Editorial Content Engine** داخل مشروع A3LAM الحالي. لا يتضمن هذا المستند أو المرحلة تشغيل migrations أو استخدام Production Database أو إنشاء محتوى Production أو استدعاء أي AI/provider.

| العنصر | الحالة الفعلية |
| --- | --- |
| المشروع | Next.js App Router + React + TypeScript + Drizzle + PostgreSQL-compatible schema |
| الفرع | `main` |
| baseline قبل المرحلة | `40b2a314116d36172a762ce925686723e4866ed7` |
| parity قبل المرحلة | `HEAD = origin/main`، وworking tree نظيف |
| Phase 17.19.1/17.19.2 | منفذتان ومرفق بهما تقارير الإغلاق السابقة |
| Production أثناء المرحلة | GET/HEAD فقط |
| migrations | قراءة وتصميم additive فقط؛ لا تطبيق |

## نتائج التدقيق

### المعمارية الموجودة وإعادة الاستخدام

يحتوي المشروع بالفعل على Admin Shell وAdmin IA وContent/Theme registries وSiteFrame وRBAC server-side. لذلك لن تنشئ Phase 17.19.3 نظام تنقل أو Theme أو Content Registry منافسًا. ستكون التوسعات في الوحدات الموجودة داخل `lib/cms/*` و`components/a3lam/*`، مع إبقاء الحماية في `lib/admin/*` وعقود الطلبات في `app/api/admin/*`.

المجال الحالي للشخصيات منفصل عن Profile والمستخدمين. Person يعتمد على `people` والعلاقات التابعة له، بينما Profile يعتمد على `profiles` وعلاقاته وحالته الخاصة. لا يجوز تحويل أي منهما إلى Post عام، ولا يجوز أن يؤدي CMS publish إلى إنشاء Person أو Profile أو تحويل AI Draft إلى أي منهما.[1] [2]

### persistence الحالية

يوجد جدول `categories` قائم ومستخدم من Person/Profile، مع `ON DELETE RESTRICT` على العلاقات. توجد جداول `media_assets` و`person_media`، كما يوجد `audit_logs`. لا توجد في schema الحالية جداول `pages` أو `posts` أو `tags` أو علاقات taxonomy للمقالات أو revisions أو autosave.[3]

| capability | الدعم الحالي | قرار Phase 17.19.3 |
| --- | --- | --- |
| Person | فعلي، domain-specific، مع editor وlifecycle خاص | إعادة استخدام بلا دمج |
| Profile | فعلي، domain-specific، مع publication firewall خاص | إعادة استخدام بلا دمج |
| Category | persistence وCRUD إداري موجودان | إعادة الاستخدام؛ لا استبدال |
| Media | list/grid/archive وmetadata موجودة | إضافة picker/assignment فقط إن أمكن بأمان |
| Page | غير موجودة persistence | migration additive مطلوبة |
| Post/Article | غير موجودة persistence | migration additive مطلوبة |
| Tag | غير موجودة persistence | migration additive مطلوبة |
| Revision/Autosave | غير موجودة persistence | revision foundation؛ autosave contract أو persistence آمنة فقط |
| Scheduled worker | غير مثبت | `scheduled` editorial state فقط، بلا ادعاء تنفيذ تلقائي |
| AI | persistence وحدود جاهزة، Production disabled | لا استدعاءات ولا publication bypass |

### lifecycle وRBAC الحاليان

الحالة الحالية العامة للمجال هي `draft | review | published | archived` في `lib/domain/a3lam`، بينما Profile يملك lifecycle مختلفًا. كما أن `lib/data/adminRepository.ts` يحتوي انتقالات Person محددة، ولا يمكن توسيعها بصورة صامتة لتصبح lifecycle عامة لكل الكيانات.[4]

توجد أدوار `SUPER_ADMIN` و`ADMIN` و`EDITOR` و`MODERATOR` وصلاحيات canonical في `lib/admin/types.ts`. صلاحيات المحتوى العام الجديد غير موجودة حتى الآن، ولذلك لا ينبغي اختراع permission strings داخل الواجهة فقط. قرار المرحلة هو إضافة صلاحيات CMS عامة إلى القائمة canonical مع إبقاء إدارة Person/Profile على صلاحياتها الحالية، ثم ربط endpoints بها server-side. إذا تعذر توسيع الدور دون تعديل migration الحالية، يبقى mapping واضحًا ومحدودًا إلى الصلاحيات القائمة، ولا تعتمد الحماية على إخفاء الأزرار.[5]

### API والحماية

النمط الحالي للـadmin API هو: استخراج principal، فحص permission، فرض same-origin على mutations، parsing/validation server-side، delegation إلى repository، ثم تحويل الأخطاء إلى رسائل آمنة عبر `adminErrorResponse`. ستتبع Pages/Posts/Tags/Revisions النمط ذاته. لن تعاد raw database errors إلى العميل، ولن تسجل الأجسام الكاملة للمحتوى أو الأسرار في audit/logs.[6]

### المحرر والمعاينة والوسائط

`AdminPersonForm` محرر domain-specific غني ولا يجوز إعادة بنائه كمحرر Post عام. ستُبنى طبقة editor جديدة لمحتوى Page/Post فقط إذا أمكن عزلها عن Person/Profile، مع نموذج بيانات typed واتجاه محتوى مستقل عن اتجاه shell. يجب أن تكون rich text محفوظة بصيغة آمنة ومحدودة؛ لا يكفي client-side sanitization.

معاينة المحتوى الجديد ستكون admin-only، noindex، غير موجودة في sitemap/search/OG/JSON-LD، مرتبطة بإصدار محدد، ولا تغيّر status. إذا لم تتوفر آلية token آمنة داخل العقود الحالية، ستُنفذ preview داخل admin route محمي مع عدم إنشاء public preview bypass.

Media Library الحالية لا توفر بعد picker أو featured-media contract لـPage/Post. لذلك سيعرض النظام capability فعلية فقط، ولن يضيف upload أو provider call. أي media assignment يجب أن يتحقق من `media.read`/`media.manage` ومن visibility/status قبل الحفظ.[7]

## القرار المعماري

بما أن Phase 17.19.3 تطلب Pages وPosts وTags وRevisions فعلية، وبما أن هذه الجداول غير موجودة، فإن config-only architecture لا تحقق Definition of Done. سيتم إنشاء **migration additive واحدة**، مرتبة بعد `0009_phase17_18_4_ai_generation.sql`، تشمل الحد الأدنى الآتي:

1. `cms_pages` و`cms_posts` ببيانات title/slug/status/content/excerpt/author/featured media/template/timestamps/publishedAt/version.
2. `cms_tags` و`cms_post_categories` و`cms_post_tags` مع uniqueness وforeign keys وorphan prevention.
3. `cms_content_revisions` مرتبطة بنوع المحتوى ومعرّفه، مع version وstatus وauthor وsnapshot metadata.
4. قيود CHECK للأحوال والأحجام والقيم غير الفارغة، وفهارس للقوائم والـstatus والـslug والتواريخ.
5. `ON DELETE RESTRICT` للـmedia/taxonomy التي قد تكسر المراجع، و`ON DELETE CASCADE` للعلاقات التابعة التي لا معنى لها دون أصلها.

ستكون migration **CREATE ONLY / NOT APPLIED** في هذه المرحلة. لن تُشغل migration runner، ولن تُستخدم `DATABASE_URL`، ولن تُجرى أي DDL أو DML على Production. إذا أثبتت validation المحلية أن schema typed لا تتوافق مع database compatibility الحالية، يتوقف التنفيذ قبل أي تطبيق ويُوثق blocker.

## حدود صريحة

لا تشمل المرحلة إنشاء أو نشر محتوى Production، ولا تشغيل scheduling worker، ولا AI/provider/OCR، ولا upload جديدًا، ولا إعادة بناء Person/Profile، ولا تعديل migrations `0001`–`0009`، ولا تغيير Secrets أو Vercel أو DNS. أي capability غير مهيأة ستظهر كـ`REQUIRES_CONFIGURATION` أو `NOT_AVAILABLE`، ولن تظهر counters غير مستخرجة فعليًا.

## مراجع التدقيق

[1]: `lib/db/schema.ts` — جداول people/profiles والعلاقات.
[2]: `lib/user/profileRepository.ts` و`lib/data/databaseRepository.ts` — public projection وpublication firewall.
[3]: `lib/db/schema.ts` و`lib/db/migrations/manifest.mjs` — persistence وmigration ordering الحالية.
[4]: `lib/admin/records.ts` و`lib/data/adminRepository.ts` — validation وlifecycle الحالية.
[5]: `lib/admin/types.ts` و`lib/admin/rbac.ts` — الأدوار والصلاحيات canonical.
[6]: `lib/admin/http.ts` و`app/api/admin/people/[id]/route.ts` — نمط الحماية والأخطاء والـsame-origin.
[7]: `lib/media/repository.ts` و`components/a3lam/MediaLibraryClient.tsx` — حدود Media Library الحالية.

**قرار التدقيق:** الانتقال إلى مرحلة تصميم العقود ثم تنفيذ migration additive غير مطبقة، مع عدم بدء أي مرحلة لاحقة.
