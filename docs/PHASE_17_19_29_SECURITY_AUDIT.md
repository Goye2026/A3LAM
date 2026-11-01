# PHASE 17.19.29 — ACCOUNT SECURITY & USER LIFECYCLE

## الحالة

**DECISION: BLOCKED**

تم تنفيذ تدقيق read-only للكود والمخطط المحلي في commit `93c28978023bdb4ac99830e8567e8d1627d47d7a`. لم يتم الاتصال بقاعدة Production، ولم تُنفذ migrations أو DDL/DML أو seed أو تغييرات أسرار أو حسابات.

## 1. Initial Audit Findings

| المجال | الحالة | الدليل | القرار |
|---|---|---|---|
| Ordinary user authentication | IMPLEMENTED | `lib/user/auth.ts`, `/api/auth/login`, `/api/auth/register`, `/api/auth/logout` | يُعاد استخدامه دون دمج مع Admin |
| Password hashing | IMPLEMENTED | `scrypt` مع salt عشوائي و`timingSafeEqual` | صالح كأساس لدورة الاستعادة |
| Ordinary user sessions | IMPLEMENTED | `user_sessions`، token hash، expiry، revoked_at | يلزم ربط reset بإبطال الجلسات |
| Disabled-user enforcement | IMPLEMENTED | `getUserForToken` يرفض `disabled_at` | محفوظ |
| Admin authentication | IMPLEMENTED / LEGACY | `A3LAM_ADMIN_ACCESS_TOKEN` ومسار `/api/admin/auth` | لا يُستبدل ضمن هذه المرحلة |
| Database-backed Admin sessions | IMPLEMENTED | `admin_identities`, `admin_sessions`, RBAC joins | منفصل عن Ordinary User sessions |
| Admin identity creation | PARTIALLY_IMPLEMENTED | إنشاء identity بحالة `invited` ودور صريح | لا توجد دعوة أو تفعيل credentials |
| Admin credential activation | MISSING | `password_hash` nullable، ورفض active عند غيابه | يحتاج lifecycle آمنًا ومزود بريد |
| Ordinary user password recovery | MISSING | لا توجد routes أو UI أو token model | يحتاج schema وprovider وrate limiting |
| Reset token lifecycle | MISSING | لا يوجد token hash/expiry/used state | يحتاج migration مقترحة فقط |
| Admin invitation lifecycle | MISSING | لا يوجد invitation token أو delivery | يحتاج migration وprovider |
| Audit logging | IMPLEMENTED | `audit_logs` ومعاملات الإدارة الحالية | يجب إضافة أحداث reset/invitation لاحقًا |
| RBAC | IMPLEMENTED | `requirePermissionPrincipal` وrole/override policy | يلزم permission صريحة لدورة الدعوات |
| Rate limiting | NOT AVAILABLE | لا يوجد enforcement موزع لمسارات auth الحالية | blocker للتفعيل العام |
| Email provider | NOT CONFIGURED | لا توجد integration أو env vars provider في `.env.example` | blocker للتفعيل الإنتاجي |

## 2. Existing Authentication Architecture

Ordinary Users يستخدمون `a3lam_user_session` و`user_accounts` و`user_sessions`. Admin يستخدمون `a3lam_admin_session` إما في الوضع legacy الموقّع بواسطة `A3LAM_ADMIN_ACCESS_TOKEN` أو عبر `admin_sessions` المرتبطة بـ`admin_identities`. لا يجوز دمج الكوكيز أو الجداول أو reset flows بين النظامين.

توجد حماية same-origin للـmutations، وRBAC server-side، وإبطال جلسات المستخدم عند تعطيل الحساب، وإبطال جلسات Admin عبر المسارات الإدارية. لا يوجد أي مسار يغيّر Admin credentials باستخدام Ordinary User reset أو العكس.

## 3. Password Recovery Implementation

**غير منفذة — BLOCKED.**

التنفيذ الآمن المطلوب مستقبلًا:

1. endpoint طلب reset برد عام ثابت لا يكشف وجود البريد.
2. توليد token عشوائي عالي entropy، وتخزين SHA-256 أو HMAC hash فقط.
3. expiry قصيرة، single-use، و`used_at`/invalidation transactional.
4. تحديث كلمة المرور عبر `hashPassword` الحالي.
5. إبطال كل `user_sessions` عند نجاح reset.
6. rate limiting موزع حسب IP وحسب email fingerprint.
7. audit events بدون password أو raw token أو البريد الكامل في logs.

لا يمكن اعتبار الدورة مكتملة قبل إثبات التسليم الفعلي للبريد من الطلب حتى reset ثم إبطال الجلسات.

## 4. Admin Invitation Implementation

**غير منفذة — BLOCKED.**

الموجود حاليًا هو إنشاء identity بحالة `invited` مع role assignment وتسجيل audit، لكن لا توجد دعوة قابلة للاستخدام أو expiry أو single-use أو credential activation. كما أن تفعيل identity بلا `password_hash` مرفوض داخل `updateAdminIdentity`، وهذا سلوك أمان صحيح ويجب الحفاظ عليه.

التنفيذ المستقبلي يجب أن يتطلب:

- صلاحية `admins.manage`، مع منع منح `SUPER_ADMIN` إلا بواسطة `SUPER_ADMIN`.
- invitation token hash فقط، expiry، وrevocation/used state.
- activation endpoint مستقل عن Ordinary User auth.
- password setup يستخدم `hashPassword` ولا يكتب password أو raw token في السجل.
- role assignment صريح ومثبت في audit.
- منع إعادة استخدام الدعوة أو escalation.

## 5. Security Controls

الموجود: scrypt، constant-time comparison، hashed session tokens، expiry، revocation، HttpOnly/SameSite cookies، same-origin checks، server-side RBAC، منع تفعيل Admin بلا credential، وحماية آخر Super Admin.

المفقود قبل التفعيل: distributed rate limiting، generic reset responses، token lifecycle، email delivery، audit event vocabulary لهذه العمليات، وربط reset بإبطال الجلسات في transaction واحدة.

## 6. Email Provider Status

**EMAIL_PROVIDER = NOT_CONFIGURED**

لم يُعثر على Resend أو SendGrid أو SMTP أو mail adapter أو production email environment configuration. لذلك لم يتم إنشاء mock sender، ولم تُعرض روابط reset/invitation، ولم تُطبع أي روابط في logs، ولم تُستخدم روابط localhost.

## 7. Database Changes Required — Proposed Only

لا توجد تغييرات مطبقة. يلزم تصميم migration منفصلة قبل التنفيذ، على الأقل:

- `user_password_reset_tokens`: `id`, `user_id`, `token_hash`, `expires_at`, `used_at`, `created_at`, مع unique hash وفهارس user/expiry.
- `admin_invitations`: `id`, `admin_id`, `token_hash`, `expires_at`, `used_at`, `revoked_at`, `created_at`, مع فهارس admin/expiry.
- يمكن إضافة `auth_security_events` فقط إذا تبيّن أن `audit_logs` الحالي لا يغطي taxonomy المطلوبة؛ الأفضل أولًا إعادة استخدام `audit_logs` دون تخزين أسرار.

المخاطر: migration يجب أن تكون additive وtransactional، ولا يجوز تطبيقها على Production قبل مراجعة provider والنسخ الاحتياطي والتجربة المعزولة والتفويض المنفصل.

## 8. Files Changed

- `docs/PHASE_17_19_29_SECURITY_AUDIT.md`
- `tests/phase17.19.29.test.ts`

لم يتغير runtime code أو schema أو migration registry.

## 9. Tests and Results

اختبارات الحراسة المركزة تتحقق من:

- الفصل بين user/admin cookies والجداول.
- وجود hashing وexpiry وrevocation الحالي.
- رفض تفعيل Admin بلا password hash.
- عدم وجود reset/invitation routes الحالية.
- عدم وجود Email Provider configuration.
- عدم اعتبار إنشاء identity invited تفعيلًا.

سيتم تشغيل `pnpm typecheck` و`pnpm lint` وfocused tests و`pnpm build` على هذا التغيير التوثيقي فقط.

## 10–12. Commit, Deployment, Production Verification

لا يوجد deployment أمني لهذه المرحلة. لا يجوز نشر Password Recovery أو Admin Invitation قبل تهيئة Email Provider وتطبيق migration المعتمدة واختبار lifecycle كامل في بيئة معزولة.

الـProduction deployment السابق لـPhase 17.19.28 يبقى كما هو؛ لم يُعدّل ولم تُنفذ عليه عمليات.

## 13. Data Safety

- Production writes: 0
- Migrations applied: 0
- Manual SQL: 0
- Seed/fake accounts: 0
- Password changes: 0
- Session deletions for testing: 0
- Secrets changed: 0
- Email messages sent: 0

## 14. Remaining Blockers

1. اعتماد Email Provider حقيقي ومهيأ في Production.
2. تصميم ومراجعة migration للتوكنات.
3. rate limiting موزع ومراقب.
4. تنفيذ واختبار reset lifecycle كاملًا.
5. تنفيذ واختبار invitation/activation lifecycle كاملًا.
6. اختبار security negatives وaccount enumeration وsession revocation في قاعدة معزولة.
7. تفويض منفصل لأي Production migration أو deployment أمني.

## 15. Recommended Next Phase

**PHASE 17.19.30 — ISOLATED CREDENTIAL LIFECYCLE DESIGN & REHEARSAL**

ابدأ بتهيئة provider sandbox وقاعدة PostgreSQL معزولة، ثم طبّق migration المقترحة هناك فقط، واختبر reset/invitation end-to-end. لا تُفعّل Production قبل نجاح rehearsal ومراجعة أمنية مستقلة.
