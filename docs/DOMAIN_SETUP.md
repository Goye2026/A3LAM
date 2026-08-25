# A3LAM — Domain and HTTPS Setup

هذا الدليل يشرح ربط نطاق خاص مستقبلي مثل `https://a3lam.example.com`. لا يغير النطاق الحالي `https://a3-lam.vercel.app`، ولا يلمس DNS أو Vercel configuration.

## Origin policy

اضبط `NEXT_PUBLIC_SITE_URL` على origin HTTPS النهائي، من دون trailing path، مثل `https://a3lam.example.com`. يستخدم التطبيق هذا الأصل للـcanonical URLs وOpen Graph وrobots وsitemap، كما تقارن به حماية same-origin للطلبات الحساسة عندما يكون مضبوطًا.

في بيئة Production، اعتبر المتغير مطلوبًا. لا تعتمد على fallback المحلي `http://localhost:3000` في public deployment، ولا تضع القيمة في Android assets أو client-side secrets.

## Reverse proxy

ينبغي أن ينهي Nginx أو proxy مماثل TLS، ويرسل `Host` و`X-Forwarded-Proto` بشكل صحيح، ويمرر الطلبات إلى التطبيق داخليًا على `127.0.0.1:3000` أو شبكة Compose الخاصة. فعّل redirect واحدًا من HTTP إلى HTTPS، واستخدم HSTS بعد التأكد من صحة النطاق وكل subdomains التابعة.

## DNS and certificate sequence

1. أنشئ DNS record للنطاق إلى نقطة الدخول التي يحددها مزود الاستضافة.
2. أصدر شهادة TLS من مزود موثوق، ثم اختبر السلسلة والتجديد التلقائي.
3. اضبط `NEXT_PUBLIC_SITE_URL` وطبّق deployment عادي.
4. افحص `/`, `/robots.txt`, `/sitemap.xml`, canonical، Open Graph، و`/api/health` عبر النطاق الجديد.
5. اختبر login/logout وsame-origin mutations من نفس origin، من دون إنشاء بيانات جديدة.

## Cookies, redirects, and CORS

جلسة Admin تستخدم cookie `httpOnly`, `sameSite=lax`, `secure` في Production، ولا تفرض cookie domain؛ لذلك تعمل على النطاق المضيف نفسه ولا ينبغي توسيعها إلى parent domain بلا قرار أمني مستقل. لا تستخدم cross-origin CORS كبديل للـsame-origin gate. مسارات redirect بعد تسجيل الدخول تقبل destinations داخلية فقط وفق sanitizer الحالي.

## Rollback

احتفظ بالنطاق الحالي حتى ينجح smoke check. عند الفشل، أعد proxy أو deployment إلى آخر release معروف، ثم افحص health والسجلات. لا تغير DNS أو cookies أو CORS policy تجريبيًا على Production ضمن هذا الدليل.
