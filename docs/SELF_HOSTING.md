# A3LAM — Self-Hosting Guide

## Server baseline

استخدم Ubuntu/Linux محدثًا، حساب تشغيل غير root، جدارًا ناريًا يسمح فقط بـ22 من مصادر الإدارة و80/443 للعامة، وموارد تناسب PostgreSQL وNext.js. استخدم Node.js `22.13.0` وpnpm `11.21.0` في التشغيل المباشر، أو Dockerfile الذي يثبت Node `22.13.0` ويدير التطبيق كمستخدم `node` غير root.

## Direct Node mode

```bash
git clone https://github.com/Goye2026/A3LAM.git
cd A3LAM
git checkout <approved-release-commit>
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

شغّل العملية تحت systemd أو supervisor، واجعل PostgreSQL خاصًا وغير منشور للعامة. لا تضع `.env`, `.env.local`, أو `.env.production.local` في Git. استخدم `.node-version` لتثبيت baseline المحلي.

## Docker mode

```bash
cp .env.example .env
# املأ القيم من secret manager أو محرر محمي
docker compose config
docker compose up -d --build
docker compose ps
```

Compose يربط التطبيق بقاعدة PostgreSQL عبر شبكة داخلية، ويؤخر التطبيق حتى يصبح `db` healthy. لا تنشر منفذ قاعدة البيانات. يمر healthcheck عبر `/api/health`، ويجب وضع reverse proxy أمام التطبيق.

## PostgreSQL

وفّر قاعدة PostgreSQL جديدة أو خدمة مُدارة، وحدد pool size مناسبًا. خذ backup قبل أي migration على قاعدة جديدة، واستخدم `pnpm db:migrate` عبر runner الحالي فقط. لا تستخدم `pnpm db:seed` في Production. لا تنفذ migration على قاعدة A3LAM الحالية ضمن Phase 17.8.

## Reverse proxy and HTTPS

ضع Nginx أمام `127.0.0.1:3000`, مرر `Host` و`X-Forwarded-Proto`, أنهِ TLS، وفعل redirect من HTTP إلى HTTPS. بعد ذلك اضبط `NEXT_PUBLIC_SITE_URL` على الأصل النهائي وشغّل public/Admin read-only smoke.

## Operations

راقب `/api/health`, application logs, PostgreSQL health, disk, memory, backup jobs, certificate renewal, and restart count. عند الفشل، أوقف الكتابات وفق incident plan، ارجع إلى آخر release commit، ولا تنفذ restore أو migration عكسيًا بلا موافقة.

## External configuration

Storage وemail وmonitoring providers اختيارية في الكود لكنها تحتاج إعدادًا حقيقيًا من المالك. لا تضف credentials وهمية، ولا تعتبر `PROVIDER_NOT_CONFIGURED` عطلًا في قاعدة البيانات.
