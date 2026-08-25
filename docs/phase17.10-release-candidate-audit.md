# A3LAM — PHASE 17.10

# Release Candidate Audit & Final Population Gate

**Audit date:** 2026-08-26  
**Audited branch:** `main`  
**Audited source SHA:** `34ad02be5e1b00e05c8bb39e12eafb321c566e83`  
**Production alias:** [https://a3-lam.vercel.app](https://a3-lam.vercel.app)  
**Production deployment under read-only verification:** `dpl_2Pd3ygcm5zfQBmFdmk88iga2bgAq`  
**Audit scope:** Release Candidate audit only; Population and Phase 18 were not started.

## Executive Summary

أُجري هذا التدقيق وفق ترتيب Phase 17.10 على النسخة الحالية من A3LAM، مع التحقق من Repository integrity، local validation، migration registry، authentication، authorization/RBAC، Admin Control Center، Site Experience، public website، profiles، search، categories، SEO، privacy/security، error/loading states، RTL/responsive behavior، Production smoke، وportability artifacts.

النتيجة النهائية هي:

> **READY FOR POPULATION**

لم يُثبت أي **Critical Blocker** يؤثر على الأمن أو المصادقة أو التفويض أو الخصوصية أو سلامة البيانات أو سلامة migration registry أو توفر المسارات العامة أو جاهزية مسار Population. القيود الموجودة خارجية أو مؤجلة بطبيعتها، مثل Docker runtime، Android SDK/device/signing، Firefox/Safari، screen readers، قياس WCAG، custom domain، VPS، load testing، وprovider configuration؛ ولا تمنع بدء Population في النسخة الحالية ضمن حدود النشر التحريري المراقب.

لم تُنفذ أي تغييرات إصلاحية في Phase 17.10؛ تم الاكتفاء بالتدقيق والتحقق. كما لم تُنشأ شخصيات أو تصنيفات أو مستخدمون أو Profiles أو ملفات، ولم تُطبق migrations أو تُغير schema أو Production data أو secrets أو providers.

> **Safety boundary:** Population = **NOT STARTED**. Phase 18 = **NOT STARTED**.

## Exact Git SHA

Repository integrity قبل إنشاء هذا التقرير كانت سليمة:

| Check | Result |
|---|---|
| Branch | `main` |
| Audited HEAD | `34ad02be5e1b00e05c8bb39e12eafb321c566e83` |
| `origin/main` | `34ad02be5e1b00e05c8bb39e12eafb321c566e83` |
| `HEAD == origin/main` | PASS |
| Working tree | clean |
| `git diff --check` | PASS |

سيُسجل SHA الخاص بهذا التقرير في Git closeout بعد إضافته، دون reset أو rebase أو force push.

## Production Deployment

آخر deployment Production تم التحقق منه read-only هو `dpl_2Pd3ygcm5zfQBmFdmk88iga2bgAq`، وهو `READY` ومرتبط بالفرع `main` وبـcommit `34ad02be5e1b00e05c8bb39e12eafb321c566e83`. الـalias الحالي هو [https://a3-lam.vercel.app](https://a3-lam.vercel.app). لم يحدث أي Production mutation أثناء هذا التدقيق.

## Local Validation

| Command | Result | Evidence |
|---|---|---|
| `pnpm install --frozen-lockfile` | PASS | Lockfile reproducibility completed successfully |
| `pnpm typecheck` | PASS | `tsc --noEmit` completed successfully |
| `pnpm lint` | PASS | ESLint completed successfully |
| `pnpm test` | PASS | 14 test files, 82 tests passed |
| `pnpm build` | PASS | Next.js 16.3.1 build completed successfully |
| `git diff --check` | PASS | No whitespace errors |

لم تُشغّل `pnpm test:integration` لأن هذا المسار ينفذ migrations وsynthetic seed، وهو محظور صراحة في Phase 17.10. لذلك يصنف كـ**scope/environment limitation** وليس Blocker؛ وقد عُوضت حدود الإنتاج بقراءة migration registry الحالية وProduction GET-only verification.

## Test Count

النتيجة المحلية هي **82 اختبارًا ناجحًا في 14 test files**. تغطي الاختبارات، بحسب الملفات الحالية، domain validation، Arabic search، authentication primitives، privacy projection، Admin input and protection، RBAC، Super Admin protections، migration registry and runner، Site Experience validation، publication gating، public profile projection، وPhase 17.9 regressions.

تتضمن suite اختبارات deterministic مباشرة للمشكلات التي عولجت في Phase 17.9، لكنها لا تدعي أنها بديل عن screen-reader، cross-browser، real-device، load، أو penetration testing.

## Build Result

نجح `pnpm build` باستخدام Next.js `16.3.1` وNode.js `22.13.0` وpnpm `11.21.0`. تم توليد **66 route/page** بنجاح. لم تُجر أي تغييرات على dependency baseline أثناء هذا التدقيق.

## Migration Registry

| Migration | Result |
|---|---|
| `0001_a3lam_core.sql` | APPLIED |
| `0002_a3lam_integrity.sql` | APPLIED |
| `0003_phase13_profiles.sql` | APPLIED |
| `0004_phase17_1_admin_identity.sql` | APPLIED |
| `0005_phase17_2_rbac_management.sql` | APPLIED |
| `0006_phase17_3_site_experience.sql` | APPLIED |
| Expected | 6 |
| Applied | 6 |
| Pending | 0 |
| Unexpected | 0 |
| Inconsistent | 0 |

ظهرت هذه الحالة في Production `/admin/system` عبر الجلسة الإدارية الحالية، كما يطابقها migration registry implementation وrepository manifest. لم يُشغّل migration runner، ولم يُنفذ SQL يدوي أو migration جديدة.

## Auth Audit

### Public User Authentication

المسارات `/register` و`/login` و`/account` متاحة كواجهات عامة. public-user session تستخدم cookie مستقلة باسم `a3lam_user_session`، وتستخدم cookie options من نوع HttpOnly وSameSite Lax وSecure في Production. password hashes لا تُعاد في `UserAccount` العام، والجلسات مرتبطة بسجلات server-side مع expiration وrevocation وdisabled-user checks.

المسار `/account` عرض login presentation في القراءة الحالية ولم يعرض account payload أو session secrets. بقيت دلالة HTTP redirect/status لهذا المسار ملاحظة خارجية؛ لم يُثبت auth bypass، ولا يُعد ذلك Blockerًا ضمن Population gate الحالية.

### Admin Authentication

Admin authentication تستخدم namespace منفصلًا هو `a3lam_admin_session`. صفحات Admin محمية server-side عبر `requireAdminPage`، وAdmin APIs تستخدم `requireAdminAsync` أو `requirePermission`. endpoint الخاص بـAdmin auth محصور في same-origin POST/DELETE وtoken verification؛ لا يوجد bypass test route.

لم يُنشأ حساب أو Admin أو Editor خلال هذه المرحلة، ولم يُستخدم token أو secret في تقرير أو command output.

## RBAC Audit

تمت مراجعة permission model وeffective permissions وserver-side gates. المصفوفة الحالية تعرض أدوار `SUPER_ADMIN` و`ADMIN` و`EDITOR` و`MODERATOR` بحدود صريحة. صلاحيات مثل `system.migrations.execute` و`permissions.assign` و`admins.manage` محجوزة لـ`SUPER_ADMIN` وفق policy الحالية، مع Super Admin last-identity/session protections.

جميع Admin API routes التشغيلية التي جرى جردها تحتوي على guard server-side، بينما `/api/admin/auth` هو login/logout boundary المقصود وليس collection API. صفحات Admin التي لا تستدعي guard مباشرة تعتمد على protected layout وتفوض resource-level permission checks إلى الصفحة أو component المناسب، كما ظهر في settings/Site Experience. لم تُعدّل RBAC matrix ولم تُختبر privilege escalation عدائيًا؛ لذلك تبقى penetration testing limitation وليست Blocker.

## Admin Audit

تمت مراجعة Production Admin session read-only على `/admin` و`/admin/system` و`/admin/users` و`/admin/administrators` و`/admin/editors` و`/admin/roles` و`/admin/permissions` و`/admin/sessions` و`/admin/audit` و`/admin/site` و`/admin/profiles` و`/admin/people/new`.

| Surface | Evidence | Result |
|---|---|---|
| Dashboard | Counters displayed: 9 people, 8 published, 1 draft, 10 categories, 1 user, 1 profile | PASS |
| System | Database/auth/settings/site experience available; media/email require configuration | PASS |
| Migrations | 6 applied, 0 pending, registry consistent | PASS |
| Users | Filterable safe projection; no password hash/session token | PASS |
| Administrators | Explicit invite/credential boundary; 0 identities in current scope | PASS |
| Editors | Explicit Editor-only surface; 0 identities in current scope | PASS |
| Roles/Permissions | Central matrix and no unpersisted override controls | PASS |
| Sessions | Safe filterable projection; 0 active Admin sessions shown | PASS |
| Audit | Filterable log with migration events and no token values | PASS |
| Site Experience | Eight resource links and structured navigation | PASS |
| Profiles | One draft/private profile, no files, private contact hidden | PASS |
| New person | Full editorial form with 10 category checkboxes and Draft/Review/Publish controls | PASS |

لم تُستخدم أي controls تنشئ أو تعدل أو تنشر أو تسحب أو تنفذ migration. أرقام dashboard أعلاه observations للنسخة الحالية وليست counters تنفيذية لهذه المرحلة.

## Public Site Audit

Production core public GETs استجابت بنجاح: `/`، `/api/health`، `/categories`، `/categories/history`، `/search`، `/search?q=أحمد`، `/register`، `/login`، `/account`، `/robots.txt`، و`/sitemap.xml`.

الصفحة الرئيسية عرضت header وhero وCTA وsearch وcategory discovery وfooter. عند تعذر catalog ظهر fallback عربي صريح «تعذر الوصول إلى الكتالوج المنشور الآن.» مع em dash في KPI بدل أرقام صفرية مضللة. صفحة التصنيفات عرضت 10 تصنيفات عامة. صفحة التاريخ عرضت 6 ملفات منشورة فقط، وذكرت أن المحتوى المنشور/المتحقق وحده ظاهر.

## Homepage Audit

لوحظ loader قصير أثناء أول navigation إلى homepage، ثم اكتملت الصفحة في انتظار لاحق ضمن نفس الزيارة. لم يظهر infinite loading أو blank screen بعد اكتمال الطلب. ظهرت العناصر الأساسية: Header، hero، CTA، Search، category discovery، contribution CTA، وFooter. حالة database/catalog unavailable كانت localized وواضحة وآمنة.

تمت مراجعة الأدلة المحلية السابقة على Chromium للأحجام `390×844` و`393×852` و`768×1024` و`1440×900`؛ لم يظهر clipping مرئي في العينات المفحوصة. هذه ليست شهادة device أو WCAG.

## Search Audit

واجهة `/search` حملت Arabic/RTL filters للبحث بالاسم أو المهنة أو المدينة، category، city، وcountry. GET query العربي `q=أحمد` حُفظ في input دون SQL error أو internal error. no-filter state محمي في المصدر من indefinite loading، وAPI search bounds query inputs إلى 120 حرفًا، يعيد empty items دون filters، ويرجع 503 controlled عند unavailable.

Search merges only published editorial people and public published professional profiles، ويعرض summary fields عامة فقط. لا تظهر private email أو phone أو files أو Admin fields أو secrets في projection. لم يُستخدم أي POST/PUT/PATCH/DELETE.

## Public Profile/CV Audit

المسار العام الحقيقي `/person/abd-al-rahman-al-dakhil` حمل profile تحريريًا منشورًا مع biography وcategory history ومصدر Britannica وروابط records منشورة ذات صلة. ظهر title/canonical/Person JSON-LD، ولم تظهر بيانات Profile/CV خاصة أو Admin/session values.

مصدر البيانات المهنية يفرض `status=published` وvisibility `published|unlisted` ووجود الاسم والنبذة والتصنيف المنشور والمصدر المنشور قبل public projection. email وphone لا يظهران إلا مع public flags، والملفات تُصفى إلى `isPublic`. Professional draft الحالي ظهر في Admin كـ`مسودة` و`خاص` مع contact محجوب و0 files، ولم يُنشر أو يُختبر كـpublic record.

لم تُنشأ CV أو Profile جديدة، ولا تُعد هذه المراجعة اعتمادًا لكل سجل فردي.

## Privacy/Security Audit

Production GET body scan لم يجد markers لـ`DATABASE_URL` أو `A3LAM_ADMIN_ACCESS_TOKEN` أو `a3lam_admin_session` أو `a3lam_user_session` أو `passwordHash` أو `PRIVATE_KEY` أو `schema_migrations` أو SQLSTATE أو stack trace أو internal server error أو secret markers في responses المفحوصة. لم تُطبع أو تُغير أي secrets.

Anonymous Admin pages أعادت `307` إلى `/admin/login?next=...`، وAnonymous Admin APIs أعادت `401`. public person/category unknown routes أعادت HTTP `404`. security headers المرصودة على homepage عبر HEAD تضمنت `Permissions-Policy` مقيدة، `strict-origin-when-cross-origin`، HSTS، `X-Content-Type-Options: nosniff`، و`X-Frame-Options: SAMEORIGIN`.

لم يُجر penetration test أو CSP certification. كما لم يُستخدم authorization bypass لأغراض التدقيق.

## SEO Audit

صفحة الشخص المنشور الحقيقية حملت Arabic title، meta description، canonical absolute URL، وPerson JSON-LD marker متسقًا مع المحتوى المرئي. `/robots.txt` و`/sitemap.xml` أعادا HTTP 200. Missing person وmissing category أعادا HTTP 404 حقيقيًا، بعد أن كان missing person سابقًا يعرض rendered 404 مع HTTP 200.

Professional unlisted metadata يستخدم `noindex,nofollow`، بينما public published profile يستخدم index/follow. لم يظهر private contact أو files أو unpublished profile data في SEO/public output المفحوص. custom-domain absolute URL verification وsocial crawler previews مؤجلة.

## Error/Loading Audit

تمت مراجعة Homepage وSearch وCategories وPublic Profile وAdmin Dashboard وAdmin System وUsers وAdministrators وSessions وAudit وSite Experience وProfile Editor. حالات unavailable/empty صريحة، ورسالة database error عامة، وglobal error action يحمل label صريحًا «المحاولة مرة أخرى» / `Try again`. Search no-filter submit لا يترك الواجهة في loading state بلا نهاية.

Production homepage وcategory/person pages أظهرت loader قصيرًا ثم اكتملت. لا توجد ملاحظة حالية تثبت infinite loader أو uncaught Promise أو generic 500 على core route. runtime grouped scan الحالي أظهر group تاريخيًا واحدًا متعلقًا بـPhase 13 migration على deployment سابق، وليس deployment الحالي؛ سُجل كـlimitation لا كدليل zero errors.

## Responsive Audit

| Viewport | Result | Evidence boundary |
|---|---|---|
| 390 × 844 | PASS WITH LIMITATION | Local Chromium capture and visual review |
| 393 × 852 | PASS WITH LIMITATION | Local Chromium capture exists |
| 768 × 1024 | PASS WITH LIMITATION | Local Chromium capture exists |
| 1440 × 900 | PASS WITH LIMITATION | Local Chromium capture and visual review |

RTL content remained contained في العينات، ولم يظهر horizontal clipping مرئي في اللقطات التي تمت مراجعتها. Firefox/Safari/WebKit، real Android/iOS devices، touch semantics، screen readers، وmeasured WCAG 2.2 AA لم تُختبر.

## Portability Audit

### Docker

Dockerfile ثابت على `node:22.13.0-bookworm-slim`، يفعّل pnpm `11.21.0`، يبني production image، يشغل non-root `node`، ويدعم `/api/health` healthcheck. Compose يستخدم PostgreSQL 16 وhealth-gated dependency وinternal network وrequired environment contract. Docker CLI وdocker-compose غير متاحين في البيئة الحالية؛ لذلك Docker runtime/build = **NOT TESTED**.

### VPS

Runbooks الخاصة بـNode/PostgreSQL/reverse proxy/HTTPS/migration/backup/restore موجودة. لم تُprovision أي VPS ولم تُنفذ عملية تشغيل خارجية؛ الحالة **NOT TESTED**.

### Android

Android wrapper foundation يحدد package ID `org.a3lam.app`، HTTPS-only boundary، وعدم تخزين secrets في التطبيق، مع back/deep-link/offline requirements موثقة. Android SDK وGradle وADB وdevice/emulator وsigning key غير متاحة؛ لذلك Android build/device/signing = **NOT TESTED**. لم يُنشأ keystore أو APK/AAB وهمي.

### Domain/Backup/Providers

لا custom domain/DNS/TLS cutover، ولا Production dump/restore، ولا storage/email/monitoring provider configuration. هذه **REQUIRES EXTERNAL CONFIGURATION / NOT TESTED** وليست Blockers لبدء Population التحريري الحالي.

## Production Verification

كل النتائج التالية **GET/HEAD-only أو browser read-only**. لم تُرسل POST أو PUT أو PATCH أو DELETE، ولم تُنفذ migration أو seed أو publication أو revoke أو save.

| Route/check | Result |
|---|---|
| `/` | 200 |
| `/api/health` | 200; body status `ok`, service `a3lam` |
| `/categories` | 200 |
| `/categories/history` | 200 |
| `/search` | 200 |
| `/search?q=أحمد` | 200 |
| `/register` | 200; no account created |
| `/login` | 200 |
| `/account` | 200 presentation; no private payload; redirect/status semantics noted |
| `/robots.txt` | 200 |
| `/sitemap.xml` | 200 |
| `/person/abd-al-rahman-al-dakhil` | 200; title/canonical/Person JSON-LD |
| `/person/does-not-exist` | 404 |
| `/categories/does-not-exist` | 404 |
| Anonymous Admin pages | 307 to internal Admin login |
| Anonymous Admin APIs | 401 |
| Public body leakage scan | No bounded-route matches |
| Homepage HEAD security headers | Present as documented above |
| Authenticated Admin read-only pages | Loaded; no mutation activated |
| Production migration registry | 6 applied, 0 pending, 6 expected, consistent |

The Vercel grouped runtime-error read-only query for the last 24 hours returned one single-occurrence historical `phase13_migration_failed` group on a previous deployment (`dpl_6J2yo3dz1oGQRSLxjeM4ptYZERRW`) with a migrations-path `ENOENT` sample. The current deployment was not listed. This does not certify zero runtime errors, and the historical group is retained as a follow-up limitation rather than a current Population blocker.

## Final Decision Matrix

| Area | Result | Evidence | Blocker? |
|---|---|---|---|
| Repository | PASS | `main`, clean, HEAD equals origin before report creation | No |
| Build | PASS | `pnpm build`, 66 routes/pages | No |
| Tests | PASS | 14 files, 82 tests | No |
| Database | PASS WITH LIMITATION | Production system projection available; no mutation | No |
| Migrations | PASS | 0001–0006 applied, pending 0, unexpected 0, inconsistent 0 | No |
| Authentication | PASS WITH LIMITATION | Separate user/Admin sessions, protected routes, safe projections | No |
| RBAC | PASS WITH LIMITATION | Server-side guards and role matrix; no penetration test | No |
| Admin | PASS | Read-only dashboard, system, users, roles, sessions, audit, site and profiles | No |
| Site Experience | PASS WITH LIMITATION | Published/draft repository isolation and safe fallback; no mutation | No |
| Homepage | PASS | Core elements and unavailable fallback rendered; no infinite loading observed | No |
| Public Profile | PASS WITH LIMITATION | Published editorial profile and privacy projection verified; no full record sweep | No |
| CV | PASS WITH LIMITATION | Draft/private profile isolated and public projection source inspected; no new CV | No |
| Search | PASS WITH LIMITATION | Arabic query, filters, empty/error boundaries, public-only projection | No |
| Categories | PASS | 10 public categories; history page showed 6 published records only | No |
| SEO | PASS WITH LIMITATION | title/description/canonical/Person JSON-LD/robots/sitemap; custom domain deferred | No |
| Privacy | PASS WITH LIMITATION | Public scans and projection rules; no penetration test | No |
| Security | PASS WITH LIMITATION | 307/401 boundaries, headers, no leakage; no external pentest | No |
| Error states | PASS | Loading completes; empty/unavailable/error copy explicit | No |
| Responsive | PASS WITH LIMITATION | Four local Chromium viewport captures | No |
| Production | PASS WITH LIMITATION | Core GET/HEAD smoke and Admin read-only verification | No |
| Docker | NOT TESTED | CLI unavailable | No; external environment |
| Android | NOT TESTED | SDK/Gradle/ADB/device/signing unavailable | No; external environment |
| VPS | NOT TESTED | No external VPS provisioned | No; deferred |

## Blockers

**Critical blockers: 0.** لا توجد مشكلة مثبتة حاليًا تؤثر على security، authentication، authorization، privacy، data integrity، migration integrity، public availability، core navigation، core search، public profile safety، Admin control integrity، Production runtime stability الحالية، أو Population workflow readiness.

تم فحص runtime historical error واحد متعلقًا بdeployment سابق، لكنه لا يثبت فشلًا في deployment الحالي ولا يبرر إيقاف Population. يبقى follow-up operational limitation موثقًا.

## Non-Blockers

العناصر التالية ليست Blockers لبدء Population الحالية: Docker CLI غير المتاح، Android SDK/device/signing، custom domain/DNS/TLS، private VPS، backup/restore drill، external storage/email/monitoring providers، Firefox/Safari/WebKit، screen readers، measured WCAG 2.2 AA، penetration/load testing، strict Vercel Node parity، analytics، AI، وsemantic search.

تُصنف هذه العناصر **NOT TESTED / REQUIRES EXTERNAL CONFIGURATION / DEFERRED** وفق طبيعتها، ولا يجوز عرضها كاختبارات ناجحة لم تُنفذ.

## Deferred Items

تبقى Population نفسها عملية لاحقة تتطلب اعتمادًا تشغيليًا ومراجعة بشرية لكل دفعة. كما تبقى Phase 18، semantic/vector search، AI research assistant، knowledge graph، organizations/books/awards/events encyclopedias، public API expansion، English version، mobile delivery، analytics، payments، provider onboarding، custom-domain cutover، private hosting، backup/restore drill، وstore publishing خارج هذه المرحلة.

## Fixes Performed, If Any

**No fixes were performed in Phase 17.10.** لم يُكتشف Blocker يحتاج إصلاحًا محدودًا وآمنًا. لم يُعدّل source code أو schema أو migrations أو dependencies أو authentication architecture أو RBAC أو Production data أو secrets أو providers. جميع الإصلاحات الستة المؤكدة الخاصة بحالات UX/SEO موثقة في تقرير Phase 17.9، وتمت إعادة ملاحظة سلوكها أثناء هذا التدقيق.

## Data Safety Counters

هذه counters لعمليات Phase 17.10، وليست census لمحتوى قاعدة البيانات التاريخي.

| Counter | Value |
|---|---:|
| New users | 0 |
| New admins | 0 |
| New editors | 0 |
| New people | 0 |
| New categories | 0 |
| New profiles | 0 |
| New CVs | 0 |
| New files | 0 |
| Seed records | 0 |
| Production mutations | 0 |
| Migrations executed | 0 |
| Schema/DDL changes | 0 |
| Secrets changed | 0 |
| Providers changed | 0 |
| Temporary/debug endpoints | 0 |
| Vercel configuration changes | 0 |
| DNS/domain changes | 0 |
| Android signing artifacts | 0 |

## Final GO/NO-GO Decision

# READY FOR POPULATION

النسخة الحالية من A3LAM آمنة ومستقرة وقابلة للبدء بعملية Population التحريرية، شريطة الالتزام بالـworkflow الموجود: إنشاء Draft، مراجعة بشرية للمحتوى والمصادر، انتقال Review، Preview، ثم Published فقط بعد الموافقة. لا يعني هذا القرار اعتماد البيانات تلقائيًا أو تجاوز publication gate أو الخصوصية أو human review.

يجب أن تبدأ Population في مرحلة تشغيلية منفصلة وبدفعات صغيرة، دون تغيير schema أو migrations أو auth/RBAC architecture، مع استمرار عدم إنشاء بيانات وهمية أو مصادر غير موثقة. لا تُعد أي قيود deferred شهادة إطلاق كاملة لكل البيئات.

```text
PHASE 17.10 — FINAL RESULT
Status: READY FOR POPULATION
Critical blockers: 0
Population: NOT STARTED
Phase 18: NOT STARTED
Data mutations: 0
```

## References

[1]: https://github.com/Goye2026/A3LAM/tree/34ad02be5e1b00e05c8bb39e12eafb321c566e83 "A3LAM audited repository baseline"
[2]: https://a3-lam.vercel.app "A3LAM Production alias"
[3]: ../docs/phase17.9-completion-report.md "Phase 17.9 completion report"
[4]: ../docs/release/launch-readiness.md "A3LAM launch-readiness checklist"
[5]: ../tests/phase17.9.test.ts "Phase 17.9 regression tests"
[6]: ../lib/admin/migrationRegistry.ts "Migration registry implementation"
[7]: ../lib/user/profileRepository.ts "Profile publication and privacy projection"
[8]: ../lib/site-experience/repository.ts "Site Experience draft/published repository"
