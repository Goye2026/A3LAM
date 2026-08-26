# Phase 17.18 — Architecture Audit

**المشروع:** A3LAM | أعلام  
**التاريخ:** 26 أغسطس 2026  
**النطاق:** Final Release Candidate hardening فقط؛ لا Population ولا Media provisioning ولا migrations ولا Production writes.

## Executive Summary

تمت مراجعة الحالة المرجعية بعد Phase 17.17 على الفرع `main`، مع التركيز على publication boundaries، public/private projections، Admin authorization، search privacy/performance، Media URL validation، SEO، error handling، وLaunch Control. وُجدت أربع فجوات قابلة للإصلاح داخل المستودع، وتم إغلاقها دون تغيير schema أو lifecycle أو external configuration.

## Findings and Fixes

| ID | Severity | Finding | Root cause | Fix | Verification |
|---|---|---|---|---|---|
| F-01 | P1 | مسار `PUT /api/admin/people/[id]` كان يطبق permission gate دون فحص same-origin، بخلاف `PATCH` وبقية مسارات Admin mutation. | عدم اتساق في ترتيب guards داخل route handler. | أضيف `requireAdminAsync` ثم `isSameOriginMutation` قبل قراءة body أو استدعاء update. | `pnpm typecheck`, `pnpm lint`, `pnpm test`, source review؛ لم تُنفذ mutation في Production. |
| F-02 | P1 | `PublicProfile` كان يمرر بعض روابط الصورة والمصدر والملفات وportfolio وsocial وverification إلى public page/JSON-LD دون إعادة sanitize عند projection. | الاعتماد على input validation فقط، مع عدم حماية legacy/inconsistent rows عند public projection. | أضيف `getSafePublicUrl` مركزي؛ projection يعيد روابط HTTP/HTTPS آمنة فقط، يسقط الروابط غير الآمنة، ويمنع source غير الآمن من public validity. | `tests/phase13.test.ts`؛ local suite؛ Production public smoke/privacy scan. |
| F-03 | P2 | public editorial search كان يعيد كل الصفوف المطابقة قبل hydration، بما قد يسبب تحميلًا غير bounded. | غياب LIMIT في الاستعلام النهائي. | أضيف `PUBLIC_SEARCH_LIMIT = 100` إلى الاستعلام النهائي مع إبقاء privacy/publication filters. | typecheck/lint/tests/build؛ لا load test خارجي. |
| F-04 | P2 | Site Experience `safeUrl` كان يقبل HTTP URLs تحتوي userinfo credentials. | parser يكتفي بالـscheme ولا يعيد استخدام public URL policy. | رُبط parser بـ`getSafePublicUrl` مع الإبقاء على relative internal paths. | `tests/admin.test.ts`؛ local suite؛ لا Production config mutation. |
| F-05 | P2 | missing public entities يجب أن تبقى fail-closed حتى لا تتحول أخطاء existence check إلى public pass-through. | proxy كان يعيد `NextResponse.next()` في catch ويستخدم rewrite للـ404. | أصبحت استجابة missing direct 404، وأصبح catch الخاص بوجود public entity fail-closed. | `tests/phase17.9.test.ts`؛ Production valid-slug missing person/category smoke = 404. |

## Architectural Decisions

لم تُنشأ منظومة auth أو RBAC جديدة. استُخدمت session boundary الحالية، و`isSameOriginMutation`، وpermission vocabulary الحالي. ولم يُعدّل schema أو migration registry أو Media provider أو publication lifecycle. بقيت دورة الشخصيات `Draft → Review → Published` كما هي، وبقيت Media provider-neutral وpending migration كما كانت.

## Non-findings

تمت مراجعة public search route وdatabase repository وsitemap وSEO helper وAdmin permission patterns. لم تُثبت فجوة جديدة في publication filtering أو anonymous Admin boundaries أو sitemap filtering تستلزم تغييرًا إضافيًا. لم تُنفذ تغييرات شكلية أو اختبارات عددية بلا gap حقيقي.

## Limitations

لم تُنفذ Docker/VPS، Android، screen reader، measured WCAG 2.2 AA، Firefox، Safari/WebKit، exact external viewport matrix، production backup/restore drill، Media upload، provider provisioning، migration 0007، أو load testing. هذه العناصر بقيت خارج البيئة أو خارج النطاق المصرح به، وتم تصنيفها `NOT TESTED` أو `REQUIRES CONFIGURATION` بدل تحويلها إلى PASS.
