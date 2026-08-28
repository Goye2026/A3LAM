# PHASE 17.19.9 — ROOT CAUSE

## Decision

**BLOCKED — REQUIRES EXPLICIT AUTHORIZATION**.

توقف التنفيذ الوظيفي عند أول blocker يتطلب Production schema/migration. لم تُنفذ أي migration أو database write أو seed أو upload أو AI/provider call.

## 1. Symptom

الصفحة الرئيسية في Production تعرض shell وhero، لكن catalog metrics تظهر `—`، وقسم featured وقسم categories يعرضان `تعذر الوصول إلى الكتالوج المنشور الآن.` ولا تظهر Person cards. كما أن `/person/ibn-khaldun` لا يعرض السجل العام في anonymous check، بل يصل إلى error state برسالة `500 / أعلام`.

## 2. Affected routes

المسارات المتأثرة أو المرتبطة بالأعراض هي `/`، `/person/[slug]`، `/search`، `/api/search`، ومسارات catalog التي تعتمد على PostgreSQL. `/api/categories` بقي reachable وأعاد categories منشورة، ما يثبت أن بعض core reads تعمل ولا يثبت أن Person pipeline سليمة.

## 3. First known bad commit

أول commit موثق غيّر homepage من مصدر local repository إلى مصدر PostgreSQL الحقيقي هو:

`5c74590b2d641e2254caa22fe22e58777e0e015a` — `feat: implement phase 05 production data foundation`.

في هذا commit تحولت `personService` من `localRepository` إلى `databaseRepository`، وتحولت `app/page.tsx` إلى async runtime read عبر `listCategories()` و`listPublishedPeople()`. وقبل ذلك كانت الصفحة تعرض data من local sample repository؛ تلك البيانات لم تكن مصدر Production حقيقيًا. لذلك هذا commit هو أول known behavioral boundary الذي أزال العرض المحلي، وليس دليلًا على أن commit نفسه حذف سجلات Production.

## 4. Exact source locations

المسار الحالي في `app/page.tsx:108-151` ينفذ `personService.listCategories()` و`personService.listPublishedPeople()` داخل `Promise.all`، ويحوّل أي exception أو timeout إلى `dataUnavailable = true`.

`lib/services/personService.ts:5-20` يوجه القراءات إلى `databaseRepository`.

`lib/data/databaseRepository.ts:243-261` يقرأ categories/people من PostgreSQL، ويطبق `validatePublishedRecord` على كل hydrated person قبل إرجاعه.

`app/person/[slug]/page.tsx:29-37, 52-68` يقرأ Profile أولًا ثم editorial Person، ويستدعي media lookup لمسار portrait.

`lib/media/repository.ts:158-165` ينفذ query على `person_media` و`media_assets`.

## 5. Root cause

الـruntime evidence الحاسم من Vercel يبين أن Production يرفع PostgreSQL error code `42P01`:

> `relation "person_media" does not exist`

والـquery الفاشل هو lookup اختياري للصورة الشخصية من `person_media` و`media_assets`. هذه الجداول يعرّفها `drizzle/migrations/0007_phase17_16_media_architecture.sql`، لكن migration لم تُنفذ ضمن هذه المرحلة لأن العقد يمنع migrations وProduction database access. لذلك public person rendering يتأثر بوجود media integration يعتمد على relation غير موجودة في Production.

في المقابل، homepage failure نفسها تُظهر caught `dataUnavailable`، ولا يمكن إثبات أن سببها هو غياب Person rows أو status فقط دون Production database/schema inspection. المصدر يثبت أنها تعتمد على PostgreSQL وpublication validation، وVercel evidence يثبت schema mismatch في media path؛ لا يجوز تحويل ذلك إلى claim غير مثبت عن عدد السجلات.

## 6. Why previous tests missed it

الاختبارات المحلية deterministic وcontract-focused، ولم تستخدم Production PostgreSQL أو isolation تطابق schema الحقيقية. `pnpm test:integration` غير مسموح لأنه يشغل migration/seed/real database behavior. كما أن previous tests تحققت من وجود guards/contracts، لا من full public runtime against the actual Production schema. ولذلك مرّت tests رغم أن `person_media` غير موجودة في Production.

## 7. Fix

لم يُطبق fix source أو schema لأن إصلاح blocker يتطلب واحدًا من الآتي: تطبيق `0007_phase17_16_media_architecture.sql` على Production، أو تفويض صريح لتغيير public media lookup/compatibility behavior بعد تحديد contract بديل. كلا المسارين خارج التفويض الحالي عند اكتشاف stop condition. لا workaround أو fake data أو fallback إلى local sample تم إدخاله.

## 8. Regression test

أُضيف `tests/phase17.19.9.test.ts` كاختبارات focused غير معتمدة على قاعدة البيانات. وهي تثبت أن homepage يستخدم server repository الحقيقي، وأن projection يتضمن `id/name/slug/status/image`، وأن search bounded وpublished-only، وأن theme frame يحتوي catalog، وأن Person/Profile pipelines منفصلة، وأن media migration boundary وCMS unavailable contracts صادقة. هذه الاختبارات لا تثبت إصلاح Production runtime، ولا تُخفي blocker أو تستبدل database evidence.

## 9. Production verification

Anonymous GET/HEAD evidence على `https://a3-lam.vercel.app`:

| Check | Result |
|---|---|
| `/` | 200 transport؛ rendered unavailable catalog and no person cards |
| `/person/ibn-khaldun` | 200 transport؛ rendered 500/error state |
| `/categories` | 200 transport |
| `/search` | 200 transport |
| `/api/categories` | 200 with published categories |
| `/api/search?q=ibn-khaldun` | 503 |
| Vercel runtime errors | `relation "person_media" does not exist` on `/person/[slug]` |
| public response privacy scan | CLEAN |

No POST/PUT/PATCH/DELETE, migration, seed, upload, provider call, or database write was performed.

## 10. Remaining limitation

The exact Production row counts and migration registry are **NOT OBSERVABLE** under the current safety boundary. Homepage cannot be declared restored, and CMS cannot be declared fully functional, until an authorized isolated schema/runtime diagnostic or explicitly authorized Production migration path is available.

**BLOCKED — REQUIRES EXPLICIT AUTHORIZATION.**
