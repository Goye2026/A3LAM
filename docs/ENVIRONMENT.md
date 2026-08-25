# A3LAM — Environment Management

## Rules

كل secrets يجب أن تأتي من Vercel Environment Variables أو secret manager أو ملف محمي غير متعقّب. لا تطبع `DATABASE_URL` أو access token، ولا تضعها في Git أو Dockerfile أو Android assets أو client bundle. `.env.local` و`.env.production.local` مستبعدان من Git، و`.env.example` يحتوي placeholders فقط.

## Variables

| Variable | Scope | Required | Notes |
|---|---|---|---|
| `NODE_ENV` | server | Production | استخدم `production` على الخادم |
| `LOG_LEVEL` | server | recommended | اضبطه بما يناسب التشغيل دون secrets |
| `PORT` / `HOSTNAME` | server | optional | Compose يضبطهما للتطبيق |
| `DATABASE_URL` | server | required | PostgreSQL URL من secret manager فقط |
| `DATABASE_MAX_CONNECTIONS` | server | optional | اضبطه وفق موارد PostgreSQL |
| `NEXT_PUBLIC_SITE_URL` | public/server | required in Production | canonical HTTPS origin |
| `A3LAM_ADMIN_ACCESS_TOKEN` | server | required for legacy admin access | random 32+ character secret؛ لا يرسل للمتصفح |
| `A3LAM_ADMIN_SESSION_TTL_SECONDS` | server | optional | يظل ضمن حدود التطبيق |
| `STORAGE_*` | server | optional | provider configuration only |
| `POSTGRES_*` | Compose only | required for Compose | استخدم values محلية محمية، ولا تنشر db port |
| `APP_PORT` | Compose only | optional | public host port mapping |

## Environments

Vercel يحتفظ بالقيم في إعدادات البيئة الخاصة بالمشروع. Direct Node يستخدم secret manager أو `.env` محميًا. Compose يستخدم `.env` محليًا غير متعقّب ويحقن القيم المطلوبة فقط؛ لا تستخدم `env_file` شاملًا إذا كان ذلك يسرّب متغيرات غير لازمة إلى container.

قبل التشغيل، تحقق من وجود أسماء المتغيرات لا قيمها. بعد التشغيل نفّذ `/api/health` وread-only smoke. عند تغيير secret، استخدم rotation procedure للمضيف، ثم أعد deployment وتحقق من Admin sessions وفق خطة تشغيل معتمدة.

## Runtime parity

`.node-version` وDocker baseline يثبتان Node.js `22.13.0` و`packageManager` يثبت pnpm `11.21.0`. مشروع Vercel الحالي يذكر Node.js `24.x`; لم تُغيّر هذه المرحلة إعداد Vercel. إذا كانت parity الصارمة مطلوبة، يجب أن يقرر المالك إعداد Vercel في عملية مستقلة.
