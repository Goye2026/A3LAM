# A3LAM — Phase 17.15 Media Audit

**التاريخ:** 26 أغسطس 2026

## ملخص التدقيق

توجد في المشروع abstraction تخزين خارجية قابلة لإعادة الاستخدام، لكنها غير مهيأة في البيئة الحالية. كما يوجد upload pipeline للملفات المهنية فقط. أما صورة الشخصية التحريرية فتمثل حاليًا كرابط نصي `people.image_url`، ولذلك لا يوجد مسار upload آمن مكتمل للـPeople في هذه المرحلة.

النتيجة: **Media provider requires configuration** و**SCHEMA GAP — MEDIA PERSISTENCE**. لم تُنفذ أي media mutation في Production.

## المكونات الحالية

| المكون | المسار | النتيجة |
|---|---|---|
| Storage abstraction | `lib/storage/provider.ts` | `getStorageStatus()` و`putObject()` server-side؛ Bearer token لا يظهر في response |
| Upload validation | `lib/storage/validation.ts` | امتدادات portrait: jpg/jpeg/png/webp؛ الحد 5 MiB؛ MIME/signature/filename checks |
| Profile upload route | `app/api/account/profile/files/route.ts` | same-origin، auth، profile ownership، multipart، controlled key، metadata persistence |
| Profile file persistence | `lib/db/schema.ts:489-508` | `profile_files` مع `storageKey/url/mimeType/extension/sizeBytes/fileType/isPublic` |
| Editorial Person media | `lib/db/schema.ts:24-50` | `image_url` نصي nullable فقط؛ لا association media table |
| Admin media page | `app/admin/(protected)/media/page.tsx` | status/count informational فقط؛ لا upload/replace/delete |
| Public portrait | `components/a3lam/PersonPortrait.tsx` | safe URL helper، lazy loading، `alt`، initials fallback عند غياب/فشل الصورة |
| Public metadata | `app/person/[slug]/page.tsx` | image يضاف إلى OG/JSON-LD فقط إذا كان رابطًا عامًا صالحًا والشخص منشورًا |

## Provider configuration

فُحصت المتغيرات المطلوبة دون طباعة أي قيمة:

| المتغير | النتيجة |
|---|---|
| `A3LAM_STORAGE_UPLOAD_URL` | configured=false |
| `A3LAM_STORAGE_PUBLIC_BASE_URL` | configured=false |
| `A3LAM_STORAGE_UPLOAD_TOKEN` | configured=false |

لم تُستخدم credentials بديلة، ولم تُنشأ أسرار، ولم تُكتب values في logs أو repository. صفحة Production `/admin/media` تعرض `يتطلب إعدادًا` وعداد الملفات `0`.

## Validation

قبل Phase 17.15 كان parser يتعامل مع image كـtext محدود الطول. أضيف الآن `getSafePublicImageUrl()`، ويستخدمه parser وSearch وcatalog وPersonPortrait وSEO. القاعدة الحالية هي:

1. القيمة الفارغة تتحول إلى `null/fallback`.
2. الرابط يجب أن يكون صالحًا باستخدام `URL`.
3. البروتوكول المسموح هو `http:` أو `https:` فقط.
4. `javascript:` و`data:` و`file:` و`vbscript:` لا تُقبل في parser ولا تُعرض في public projection.
5. لا يتم التعامل مع URL كمسار تخزين أو filename.

توجد اختبارات regression تقبل رابط HTTPS عامًا وترفض `javascript:`، بالإضافة إلى اختبارات Phase 13 القائمة للتوقيعات والامتدادات والأسماء غير الآمنة للملفات المهنية.

## Storage naming وownership

المسار المهني القائم يستخدم identifier عشوائيًا مضبوطًا تحت `profiles/<user>/<profile>/<type>-<uuid>.<ext>`. لم يُمدد هذا المسار إلى People لأن `profile_files` يحمل foreign key إلى `profiles`. إعادة استخدامه للشخصيات التحريرية ستخلط ownership boundaries، ولذلك لم تُنفذ.

## Public/private boundary

الـPerson public projection لا يقرأ إلا `getPublishedPersonBySlug`. Search يقرأ الأشخاص المنشورين فقط، ويعرض safe public image URL أو `null`. OG وJSON-LD لا يضيفان image إلا من نفس الرابط العام الآمن. لا يوجد في public output storage token أو storage key داخلي أو `DATABASE_URL` أو session token أو private media URL.

الـProfile files تبقى ضمن profile visibility و`isPublic` semantics الحالية، لكن لم يُجرَ عليها أي تغيير أو mutation في Phase 17.15.

## Fallback وaccessibility

عند غياب الصورة أو فشل تحميلها، يعرض `PersonPortrait` initials fallback مع `role="img"` و`aria-label`، بينما الصورة الحقيقية تستخدم `alt` مشتقًا من اسم الشخص و`loading="lazy"` و`decoding="async"`. لم تُنشأ صورة وهمية توحي بأنها portrait حقيقية.

## القيود الأمنية المتبقية

لأن provider غير مهيأ، لم تُختبر رحلة `Select → Validate → Preview → Upload → Verify → Persist → Render` للـPeople. كما أن validation الحالية للملفات المهنية لا تتضمن فحص أبعاد image مستقلًا؛ لم تُضف مكتبة معالجة صور أو schema change لتغطية ذلك في هذه المرحلة. لا يوجد delete/replace للـPeople media يمكن تقييمه، وبالتالي لم تُنفذ semantics حذف تدميري.

## توقف التدقيق

لا توجد P0/P1 مرصودة في التغييرات المنفذة. لكن عدم وجود provider وPerson media persistence يمنع إعلان Media Ready، ولذلك يبقى القرار **MEDIA BLOCKED — POPULATION BLOCKED**.
