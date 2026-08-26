# A3LAM — Phase 17.17 Architecture Audit

**التاريخ:** 26 أغسطس 2026
**الفرع:** `main`
**HEAD:** `2102cc9d8d141e26a498827b9be5f67596c6eef8`
**origin/main:** `2102cc9d8d141e26a498827b9be5f67596c6eef8`
**Working tree:** clean

## Baseline verification

المستودع الحالي هو تطبيق Next.js App Router مخصص، وليس قالب Vite/tRPC العام. يعتمد على PostgreSQL وDrizzle، ويستخدم App Router وServer Components وServer-side repository access. لا توجد تغييرات محلية قبل بدء Phase 17.17، و`HEAD == origin/main` عند نقطة التدقيق.

يوجد في المستودع migration manifest من 0001 إلى 0007، ويظل `0007_phase17_16_media_architecture.sql` additive ومرتبطًا بـMedia foundation. Production status الموثق في أدلة Phase 17.16 هو 6 migrations applied و1 pending من أصل 7؛ ستتم إعادة التحقق منه بعد التنفيذ عبر GET/HEAD فقط، ولن تطبق هذه المرحلة أي migration.

## Existing architecture to reuse

| Domain | Existing implementation | Phase 17.17 decision |
|---|---|---|
| System health | `lib/admin/systemHealth.ts` aggregates database, auth, storage, email, migrations, site experience, and media states | Extend/orchestrate; do not create a second health system |
| Migration registry | `lib/admin/migrationRegistry.ts` returns expected/applied/pending/unexpected and detects inconsistency | Reuse `getMigrationRegistryStatus`; expose derived counts without execution controls |
| Admin summary | `adminRepository.getControlCenterSummary()` already aggregates People, Categories, Users, Profiles, Admin identities, Editors, Sessions, and recent audit | Reuse for launch counters |
| People data | `adminRepository.listPeople()`, `getEditorData()`, and existing domain validation | Add a pure readiness evaluator and a read-only aggregate, without changing records |
| Publication rules | `validatePerson()` and `validatePublishedRecord()` enforce current server-side constraints | Readiness is advisory/evaluative; lifecycle remains unchanged |
| RBAC | `getAdminPageAccess`, `hasEffectiveAdminPermission`, and `system.read` | Protect Launch Control server-side with existing `system.read`; no new bypass or role model |
| Admin navigation | `AdminShell` conditionally renders permission-aware links | Add `/admin/launch` only when `system.read` is available |
| Media | `getSystemHealthSnapshot` and Media repository/provider states | Show architecture/provider/schema/upload/delivery separately; never claim upload ready when provider is missing |
| Public projection | `databaseRepository` and public safe URL/Published-only projection | Use existing routes and read-only smoke checks; no public model change unless required |
| Audit | `adminRepository.listAuditLogs()` and existing audit schema | Read audit only; GET dashboard does not create audit records |
| Localization | `lib/i18n/messages.ts` with Arabic/English message contracts | Add localized labels; no hard-coded reusable UI copy |

## Confirmed gaps

لا يوجد typed launch status vocabulary موحد؛ system health يملك availability vocabulary أضيق ومخصصًا لصفحة System. لا يوجد route مستقل `/admin/launch` ولا read model يجمع كل readiness domains في payload واحد. لا يوجد pure editorial readiness engine مستقل للشخصيات التحريرية؛ الموجود سابقًا في Phase 17.13 هو presentation readiness مشتق داخل surfaces وليس contract مركزيًا قابلًا للاختبار.

لا يوجد عرض مركزي منفصل للـautomatic/manual/external ownership لكل readiness item، ولا checklist تشغيلية غير قابلة للتجاوز تجمع evidence والحالة. كما أن People list لا تعرض readiness indicators عامة مستقلة عن lifecycle، ولا يوجد public-check orchestration داخل Admin Launch Control.

## Safety constraints confirmed

سيبقى Launch Control read-only. لن تُضاف أزرار أو endpoints لتنفيذ migration أو upload أو delete أو backup/restore أو provisioning أو deploy. لن تُنشأ بيانات Production، ولن تُعدّل People أو Categories أو Profiles أو Users أو Media. لا تُعرض `DATABASE_URL` أو credentials أو tokens أو storage keys أو stack traces أو migration secrets.

إذا كان domain غير متاح، فشلُه لن يسقط الصفحة كاملة؛ سيظهر status مستقل مثل `NOT_TESTED` أو `REQUIRES_CONFIGURATION` أو `BLOCKED` مع evidence وowner/next step. لا يُستخدم `READY` بلا evidence، ولا يتحول `NOT_TESTED` أو `REQUIRES_CONFIGURATION` إلى PASS.

## Architectural direction

سيُضاف module domain مستقل للـLaunch status وperson readiness، ثم read model server-side يستعمل `Promise.allSettled` أو equivalent آمنًا لجمع domains بشكل مستقل، ثم Server Component route `/admin/launch` محمي بـ`system.read` و`robots: noindex`. ستبقى API اختيارية فقط إذا لم يكن Server Component كافيًا؛ لا حاجة متوقعة إلى mutation أو endpoint تنفيذ.

سيكون Quality Gate deterministic وside-effect free وHTTP/UI independent. سيقيس required fields وrecommended fields وsource presence/URL validity وpublication state وcategory/publication relationships وmedia validity، لكنه لن يدعي historical truth ولن يجعل portrait optional شرطًا للنشر. التحذير التحريري منفصل عن blocker الأمني أو invalid public projection.

## Stop conditions

إذا كشف التدقيق اللاحق migration registry inconsistent، أو missing 0001–0006، أو RBAC bypass، أو public privacy leakage، أو احتاج التنفيذ إلى Production DDL/DML أو secrets أو Vercel/DNS/provider changes، فسيُسجل ذلك ويتوقف التنفيذ بدل الالتفاف عليه.
