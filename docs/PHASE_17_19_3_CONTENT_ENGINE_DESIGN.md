# PHASE 17.19.3 — Content Engine Design

## 1. القرار

تحتاج Phase 17.19.3 إلى persistence جديدة لأن schema الحالية لا تحتوي على Pages أو Posts أو Tags أو Revisions. سيُضاف migration واحد جديد باسم `0010_phase17_19_3_content_engine.sql`، ويُسجل في manifest بترتيب زمني بعد `0009_phase17_18_4_ai_generation.sql`. هذه migration **CREATE ONLY / NOT APPLIED**؛ لا تُشغل محليًا أو على Production في هذه المرحلة.

لن تُضاف أي جداول WordPress أو PHP runtime. أسماء `cms_pages` و`cms_posts` و`cms_tags` تعبّر عن كيانات A3LAM التحريرية، وتبقى منفصلة عن `people` و`profiles` و`ai_*`.

## 2. الحالة التحريرية

يستخدم المحتوى التحريري العام نوعًا مستقلًا عن `ContentStatus` المستخدم حاليًا للشخصيات والتصنيفات:

| الحالة | المعنى |
| --- | --- |
| `draft` | محتوى محفوظ وغير منشور |
| `review` | محتوى جاهز للمراجعة البشرية |
| `scheduled` | قرار تحريري مؤجل؛ لا يعني وجود worker تلقائي |
| `published` | محتوى متاح للعامة بعد اجتياز publication guard |
| `trashed` | محتوى معزول عن public projection ويمكن استعادته |

الانتقالات المسموحة مركزية في `lib/cms/editorialStatus.ts`:

- `draft → draft | review | trashed`
- `review → draft | review | scheduled | published | trashed`
- `scheduled → draft | scheduled | published | trashed`
- `published → draft | published | trashed`
- `trashed → draft | trashed`

كل endpoint يطبق authentication وRBAC وpayload validation وtransition guard وversion check وaudit. لا يغيّر هذا lifecycle سلوك Person/Profile القائم.

## 3. الجداول additive

### `cms_pages`

تحتوي على `id`, `title`, `slug`, `status`, `content`, `excerpt`, `author_id`, `featured_media_id`, `template`, `seo_title`, `seo_description`, `canonical_url`, `version`, `created_at`, `updated_at`, `published_at`. يرتبط `author_id` بـ`admin_identities` مع `ON DELETE SET NULL`، ويرتبط `featured_media_id` بـ`media_assets` مع `ON DELETE RESTRICT`.

### `cms_posts`

تستخدم البنية نفسها مع `excerpt` إلزامي منطقيًا في validation، وعلاقات categories/tags عبر جداول join. لا ترتبط Posts بتصنيفات Person تلقائيًا؛ إذا أُسندت Category فالعلاقة صريحة في `cms_post_categories`.

### `cms_tags`

تحتوي على `id`, `name`, `slug`, `created_at`, `updated_at`. الاسم والـslug غير فارغين، والـslug فريد.

### العلاقات

`cms_post_categories` و`cms_post_tags` مفاتيحهما المركبة وتستخدمان `ON DELETE CASCADE` من Post، و`ON DELETE RESTRICT` من Category/Tag لتفادي orphan references أو حذف taxonomy مستخدمة. لا توجد علاقة Page ↔ Person/Profile.

### `cms_content_revisions`

تحتوي على `id`, `content_type`, `content_id`, `version`, `status`, `snapshot`, `author_id`, `created_at`, مع uniqueness على `(content_type, content_id, version)`. الحقل `snapshot` JSONB محدود الحجم عبر CHECK. يتم الاحتفاظ بالنسخ بدل overwrite الصامت، ولا تُخزن الأسرار أو raw provider payloads.

## 4. rich text

يُحفظ المحتوى كـJSONB typed document، لا كـHTML خام. grammar الإصدار الأول يدعم `paragraph`, `heading`, `bold`, `italic`, `link`, `ordered_list`, `unordered_list`, `blockquote`, `divider`, `media`, و`table` البسيط. كل node يمر عبر `parseCmsRichTextDocument` مع حدود عددية للنodes والأعماق وأطوال النصوص، وتُرفض `script`, `iframe`, event attributes, javascript/data/vbscript URLs، وHTML غير المعرّف.

`direction` في المستند مستقل عن اتجاه Admin Shell، وقيمه `rtl | ltr | auto`. الرابط الداخلي يجب أن يبدأ بمسار آمن داخل الموقع، والرابط الخارجي يمر عبر `getSafePublicUrl` و`isSafeMenuHref`.

## 5. slug/permalink

`lib/cms/slug.ts` يطبع Unicode عبر NFKC، يحول الفراغات إلى شرطات، يخفض الأحرف اللاتينية، يقبل أحرف Unicode والأرقام والشرطات، ويرفض traversal والشرطات المتكررة والقيم الطويلة أو الفارغة. تحفظ uniqueness في قاعدة البيانات، ويُرفض التصادم قبل persistence. المسارات `/admin`, `/api`, `/search`, `/categories`, `/person`, `/profile`, `/robots.txt`, `/sitemap.xml` وغيرها من internal routes محجوزة ولا يمكن استخدامها كـslug.

## 6. preview والـpublic projection

المعاينة admin-only، noindex/nofollow، ولا تظهر في sitemap أو public search أو OG أو JSON-LD. تستخدم نسخة محددة من content عبر `version`، ولا تغيّر status. routes المعاينة تقع تحت `/admin/content/.../preview` وتستخدم `requireAdminPage` وpermission read.

public Page/Post routes تعرض `published` فقط، وتتحقق من سلامة المحتوى قبل render. عند غياب جداول migration أو تعذر dependency، تعيد public routes `notFound()` أو fallback آمنًا ولا تعرض draft أو raw database errors.

## 7. API contracts

تتبع endpoints نمط `lib/admin/http.ts` و`isSameOriginMutation`:

| المسار | الوظيفة | الحماية |
| --- | --- | --- |
| `/api/admin/cms/pages` | list/create | `content.read` أو `content.create` |
| `/api/admin/cms/pages/[id]` | read/update | `content.read` أو `content.update` |
| `/api/admin/cms/pages/[id]/status` | transition | permission حسب الانتقال |
| `/api/admin/cms/posts` | list/create | `content.read` أو `content.create` |
| `/api/admin/cms/posts/[id]` | read/update | `content.read` أو `content.update` |
| `/api/admin/cms/posts/[id]/status` | transition | permission حسب الانتقال |
| `/api/admin/cms/tags` | list/create/update | `taxonomy.read/create/update` |

لا تُعرض endpoints أو أزرار لا تملك backend contract. عند عدم تطبيق `0010` تعيد endpoints حالة dependency-unavailable آمنة بدل fake success.

## 8. RBAC

تُضاف permissions canonical التالية إلى type/registry والمigration الجديدة فقط: `content.read`, `content.create`, `content.update`, `content.review`, `content.publish`, `content.schedule`, `content.trash`, `taxonomy.read`, `taxonomy.create`, `taxonomy.update`. لا يُضاف role جديد. يملك SUPER_ADMIN وADMIN الصلاحيات حسب mapping الحالي، ويُمنح EDITOR صلاحيات authoring/review دون publish إذا كانت السياسة الحالية تمنع ذلك. تبقى صلاحيات Person/Profile مستقلة.

## 9. autosave وconcurrency

لا يُدّعى وجود autosave server-side ما لم تتوفر بنية آمنة. الواجهة قد تعرض local recovery contract فقط، مع عدم تسميته Saved. كل save يحمل `expectedVersion`، ويُرفض stale write بـconflict مع الحفاظ على النسخة الحالية. كل publish/review/trash يكتب audit مختصرًا دون body كامل.

## 10. migration safety

لا تعديل للمigrations `0001`–`0009`، ولا تشغيل `scripts/db-migrate.mjs`، ولا استخدام `DATABASE_URL`، ولا seed أو DML. ستُفحص migration الجديدة نصيًا وcompile-time فقط، وتبقى حالة التقرير `CREATED / NOT APPLIED`.

## 11. حدود المرحلة

لا تتضمن المرحلة Production content creation أو authenticated browser walkthrough أو scheduling worker أو real media provider أو AI/OCR/provider calls. أي عنصر غير مهيأ يظهر `REQUIRES_CONFIGURATION` أو `NOT_AVAILABLE`. بعد validation وdeployment read-only لا تبدأ Phase 17.19.4 أو Phase 17.20 أو Phase 18 أو Population أو Production AI activation.
