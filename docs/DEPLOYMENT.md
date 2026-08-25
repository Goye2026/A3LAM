# A3LAM — Deployment Guide

هذا الدليل يشرح تشغيل الإصدار الحالي على Vercel أو على استضافة خاصة. لا ينفذ أي خطوة تلقائيًا، ولا يطلب نسخ الأسرار إلى Git أو إلى صورة Docker.

## Supported modes

| Mode | Runtime | When to use |
|---|---|---|
| Vercel | Managed Next.js deployment | الخيار الحالي للمشروع |
| Docker Compose | Node.js 22.13.0 + PostgreSQL 16 | VPS صغير أو خادم خاص |
| Direct Node | Node.js 22.13.0 + PostgreSQL | خادم Linux يديره المشغّل |

## New private host

1. جهّز Ubuntu/Linux محدثًا، حساب تشغيل غير root، جدارًا ناريًا، ونسخًا احتياطية خارج الخادم.
2. ثبّت Node.js `22.13.0` وpnpm `11.21.0`، أو استخدم الصورة المحددة في `Dockerfile`.
3. وفّر PostgreSQL مدعومًا، واحتفظ بـ`DATABASE_URL` في secret manager أو ملف محمي غير متعقّب.
4. انسخ المستودع إلى release commit المعتمد، ثم نفّذ `pnpm install --frozen-lockfile`.
5. خذ backup قبل أول migration، ثم استخدم runner المعتمد فقط على قاعدة جديدة وفق `docs/PRODUCTION_RUNBOOK.md`.
6. نفّذ `pnpm build` ثم شغّل `pnpm start` تحت supervisor، أو استخدم Compose.
7. ضع Nginx أو reverse proxy أمام التطبيق، وأنهِ TLS، واضبط `NEXT_PUBLIC_SITE_URL` على origin HTTPS النهائي.
8. اختبر `/api/health` وGET/HEAD public/Admin boundaries قبل فتح المرور العام.

## Docker Compose

```bash
cp .env.example .env
# حرّر .env في secret manager أو محرر محمي، ولا تحفظه في Git
docker compose config
docker compose up -d --build
docker compose ps
curl -fsS http://127.0.0.1:3000/api/health
```

نفّذ `docker compose config` قبل التشغيل للتأكد من اكتمال interpolation. لا تنشر PostgreSQL للعامة؛ Compose يستخدم شبكة داخلية وhealth-gating. لا تشغّل seed في Production.

## Rollback

احتفظ بآخر release commit وصورة Docker ونسخة backup معًا. عند فشل التطبيق، أوقف الإصدار الجديد، أعد تشغيل آخر release معروف، ثم افحص `/api/health` والسجلات. لا تُجرِ restore أو migration عكسيًا دون خطة استرداد وموافقة تشغيلية منفصلة.

## Related procedures

راجع `SELF_HOSTING.md`، `ENVIRONMENT.md`، `PRODUCTION_RUNBOOK.md`، `DOMAIN_SETUP.md`، `BACKUP.md`، و`RESTORE.md` قبل تشغيل خاص.
