# A3LAM Media Architecture — Phase 17.16

## Decision

اعتمدت المرحلة نموذجًا من كيانين منفصلين:

1. **media_assets**: metadata وstorage reference وحقوق الاستخدام والحالة. لا يحتوي binary bytes أو secrets.
2. **person_media**: attachment/usage يربط asset بالشخصية التحريرية، مع `usage_type` و`is_primary`.

هذا الفصل يسمح بإعادة استخدام asset مستقبلًا في Person أو Homepage أو Category دون duplication، ويجعل detach مختلفًا عن حذف asset.

## Database model

### `media_assets`

| الحقل | الغرض |
|---|---|
| `id` | معرف داخلي ثابت |
| `provider` | provider-neutral identifier مثل `external` أو `self_hosted` |
| `storage_key` | المفتاح الداخلي للـobject؛ لا يظهر في public projection |
| `public_url` | رابط delivery العام بعد التحقق |
| `original_name` | اسم الملف الأصلي بعد normalization |
| `mime_type` / `extension` | نوع الملف وامتداده |
| `size_bytes` | الحجم مع check موجب |
| `width` / `height` | dimensions للصور؛ nullable للأنواع المستقبلية |
| `alt_text` | النص البديل |
| `source_url` | مصدر الصورة عند توفره، HTTP/HTTPS فقط |
| `attribution` | attribution المطلوب |
| `license` | license أو بيان الحقوق |
| `status` | `ready` أو `archived` |
| `visibility` | `private` أو `public` |
| `created_by` / `updated_by` | actor references إلى Admin identity مع `ON DELETE SET NULL` |
| `created_at` / `updated_at` | UTC timestamps |

### `person_media`

يرتبط بـ`people` و`media_assets` مع `ON DELETE RESTRICT` على asset حتى لا يؤدي حذف شخص إلى حذف asset قابل لإعادة الاستخدام. يدعم `usage_type=portrait` الآن و`secondary` مستقبلًا، وunique partial index يمنع أكثر من primary portrait واحدة لكل Person. توجد unique relation على `(person_id, media_asset_id, usage_type)` لمنع duplicate attachment.

## Compatibility

تبقى `people.image_url` موجودة backward-compatible. عند وجود primary `person_media` جاهز وعام، يصبح هو canonical public portrait. عند غياب migration أو attachment، يستمر النظام باستخدام `people.image_url` الآمن فقط. هذا يمنع كسر public pages أثناء بقاء migration 0007 PENDING في Production.

## Provider contract

سيتم توسيع abstraction الحالية بدل إنشاء abstraction ثانية لتدعم:

- `putObject`
- `deleteObject`
- `headObject`
- `publicUrl`
- typed configuration status

Domain code لا يعرف S3 أو Vercel أو Cloudinary. provider الحالي يعتمد env variables الموجودة بالفعل، ولا تُضاف أسرار حقيقية أو buckets في هذه المرحلة.

## Publication and privacy

لا يظهر asset للعامة إلا إذا تحققت الشروط التالية معًا: الشخص منشور، attachment primary، asset status `ready`، visibility `public`، وpublic URL صالح HTTP/HTTPS. لا يخرج `storage_key` أو provider credential أو audit metadata أو private URL إلى public JSON أو Search.

## Delete safety

Remove من Person يعني detach فقط. حذف asset من Library مسموح فقط عندما لا توجد attachments، ولا توجد references published. إذا كان asset مستخدمًا، تُرجع العملية conflict ويجب detach أولًا. لا يتم حذف object الفيزيائي تلقائيًا عند detach لأن ownership قد تكون مشتركة؛ حذف object يستلزم provider configured وasset unused.

## Migration policy

الاسم المقترح: `0007_phase17_16_media_architecture.sql`. هي additive وtransactional وبدون seed أو fake records أو DROP/TRUNCATE. يضاف اسمها إلى manifest كي تظهر `PENDING`، لكن لا يشغل code deploy migration تلقائيًا، ولا تطبق على Production في Phase 17.16.

## Provider states

الواجهة تفرق بين `configured` و`not_configured` و`invalid_configuration`، بينما operation failures تعاد كـ`unavailable` أو `error` برسائل عربية غير حساسة. لا تعرض UI نجاحًا زائفًا أو URL وهميًا عندما provider غير مهيأ.

## Portability

Metadata محفوظة في PostgreSQL. Binary objects محفوظة في provider الخارجي عبر storage key/public URL. Backup database لا يغطي binary objects؛ لذلك يلزم backup مستقل للـobject storage ومطابقة keys قبل restore. نقل provider يتطلب export للـobjects، تحديث provider configuration، ثم verification للـpublic URLs. لا ينفذ Phase 17.16 backup/restore فعليًا أو credential rotation.
