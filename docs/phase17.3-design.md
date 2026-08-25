# A3LAM — Phase 17.3 Site Experience Design

## Decision

ستستخدم Phase 17.3 جدولًا واحدًا مقيّدًا اسمه `site_experience_configs` بدل endpoint يقبل arbitrary configuration blob. يحتوي كل صف على `resource` من قائمة ثابتة، و`draft` و`published` JSONB، وحقول actor/time للتعديل والنشر. JSONB هنا ليس عقد API عامًا؛ كل مورد يمر عبر discriminated typed parser مستقل قبل القراءة أو الكتابة.

هذا الاختيار يقلل عدد الجداول مع إبقاء حدود الموارد واضحة، ويسمح بإضافة موارد مستقبلية دون خلطها في payload واحد. لا تُخزن الأسرار أو HTML/CSS/JS أو tokens داخل أي configuration resource.

## Resources

| Resource | Public consumer | Draft/Publish | Main permissions |
|---|---|---:|---|
| `settings` | site defaults | نعم | `settings.read`, `settings.manage` |
| `identity` | header/footer/metadata | نعم | `appearance.read`, `appearance.update` |
| `appearance` | safe visual tokens | نعم | `appearance.read`, `appearance.update` |
| `homepage` | homepage sections | نعم | `homepage.read`, `homepage.update`, `homepage.publish` |
| `navigation` | header/footer links | نعم | `navigation.read`, `navigation.update` |
| `footer` | footer content | نعم | `footer.read`, `footer.update` |
| `seo` | metadata/robots defaults | نعم | `seo.read`, `seo.update` |
| `profile_presentation` | platform profile defaults | نعم | `profile_presentation.read`, `profile_presentation.update` |

## Safety rules

القراءة العامة تستخدم `published` فقط. غياب الجدول أو الصف أو وجود payload غير صالح يعيد default آمنًا ولا يمنع الصفحة من rendering. قراءة draft وpreview محمية بـAdmin auth و`noindex`. جميع الروابط تمر عبر URL allow-list؛ لا يقبل النظام `javascript:`, `data:`, `vbscript:`, أو HTML خام. مخرجات audit تسجل resource/action وmetadata محدودة ولا تسجل payload كاملًا.

`profile_presentation` يحدد platform defaults فقط. لا يكتب إلى `profiles.visibility`, `email_public`, `phone_public` أو أي preference يملكها المستخدم. Media في هذه المرحلة provider-aware foundation فقط؛ لا يوجد fake upload ولا filesystem/database bytes/base64 fallback.

## Workflow

`GET` يعرض draft وpublished بعد validation. `PATCH` ينفذ authentication ثم permission ثم validation ثم transactional upsert ثم audit. `POST /publish` يتطلب permission نشر مستقلة، ينقل draft إلى published داخل transaction، ويسجل audit. لا يغيّر فتح المحرر التجربة العامة.

## Migration state

المخطط المقترح هو `0006_phase17_3_site_experience.sql` بعد فحص migrations الحالية. ستبقى migration **CREATED / NOT APPLIED** محليًا وProduction. قبل تطبيقها يجب الحصول على موافقة صريحة مستقلة، مع تقرير tables/rollback/data risk منفصل.
