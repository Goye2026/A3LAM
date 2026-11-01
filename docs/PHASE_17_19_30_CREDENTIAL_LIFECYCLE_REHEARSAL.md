# PHASE 17.19.30 — ISOLATED CREDENTIAL LIFECYCLE DESIGN & REHEARSAL

## الحالة النهائية

**DECISION: BLOCKED**

تمت مراجعة الحالة الفعلية للمستودع وحُفظ commit Phase 17.19.29 كما هو. أُنجز التصميم الأمني والمقارنة الرسمية لمزودي البريد، لكن لم يبدأ أي اختبار stateful لأن البيئة المعزولة المطلوبة غير متاحة.

لم يتم تنفيذ:

- Production migration أو DDL/DML.
- Production deployment.
- Production email sending.
- تغيير secrets أو DNS أو Vercel.
- إنشاء حسابات أو تغيير كلمات مرور أو إبطال جلسات.
- تعديل runtime authentication.
- استخدام Production `DATABASE_URL` أو Production email credentials.

## 1. Git State and Preserved Commits

الحالة الفعلية:

```text
HEAD: b0c2863 docs: audit account security lifecycle
Branch: main
Remote: origin/main
Working tree: clean
State: main is ahead of origin/main by 1 commit
```

تم الحفاظ على:

- `docs/PHASE_17_19_29_SECURITY_AUDIT.md`
- `tests/phase17.19.29.test.ts`
- commit `b0c2863`

لم يتم reset أو discard أو overwrite لأي commit.

## 2. Isolated Environment Check

**ISOLATED_ENVIRONMENT = NOT_AVAILABLE**

نتائج الفحص:

- `DATABASE_URL`: ABSENT.
- PostgreSQL local listener: غير موجود.
- `psql`: غير متاح.
- Docker/Podman: غير متاحان.
- Postmark/Resend/SendGrid/Mailgun credentials: غير موجودة.
- Email sandbox callback URL: غير مهيأ.
- لا توجد قاعدة منفصلة أو credentials منفصلة أو session namespace منفصل متاح لهذه الجلسة.

بناءً على ذلك تم التوقف قبل أي stateful migration أو flow execution كما يطلب العقد.

### Infrastructure required to resume

يلزم توفير بيئة معزولة بالكامل تشمل:

1. PostgreSQL منفصل عن Production مع connection secret منفصل.
2. قاعدة/branch اختبارية لا تحتوي على Production data.
3. Admin/User credentials اختبارية لا تصل إلى Production.
4. Postmark Sandbox Server أو بديل معتمد، وtoken اختبار منفصل.
5. HTTPS callback/base URL منفصل للـwebhooks والروابط.
6. Redis/Upstash أو rate-limit store موزع منفصل للاختبار.
7. test domain أو sandbox sender منفصل.

## 3. Email Provider Comparison

### Recommendation: Postmark

Postmark هو الاختيار المقترح للتجربة المعزولة، وليس اختيارًا Production نهائيًا في هذه المرحلة.

السبب الرئيسي هو أن Postmark Sandbox Servers تمنع التسليم إلى inboxes حقيقية مع إبقاء API قابلًا للاختبار، كما أن `POSTMARK_API_TEST` متاح لاختبارات validation-only. ويوفر Postmark REST API عبر HTTPS، server-scoped tokens، webhooks للتسليم والارتداد والشكاوى، وأخطاء موثقة تشمل `401`, `422`, `429`, `500`, و`503`.

### مقارنة مختصرة

- **Postmark — suitable:** Sandbox حقيقي يمنع التسليم، API test token، Webhooks واضحة، وتكامل server-side مناسب.
- **Resend — suitable:** test recipients وwebhooks وNext.js integration، لكن رسائل الاختبار تستهلك quota ولا يوجد sandbox no-send منفصل موثق بنفس القوة.
- **SendGrid — suitable:** Mail Send sandbox يتحقق من الطلب ولا يرسل، لكنه لا ينتج Events ولا يمثل اختبار delivery end-to-end.
- **Mailgun — suitable:** Sandbox domain وauthorized recipients وwebhooks، لكنه يتطلب إدارة sandbox recipients وقيود domain مختلفة.
- **Generic SMTP — unavailable:** لا يمكن تقييم sandbox أو quotas أو events أو security قبل تحديد مزود بعينه.

### Required Postmark configuration checklist

- إنشاء Sandbox Server فقط.
- تخزين server token في server-only environment variable مثل `POSTMARK_SERVER_TOKEN`.
- عدم وضع token في client bundle أو URL أو logs.
- استخدام `POSTMARK_API_TEST` لاختبارات validation-only حيث ينطبق.
- استخدام sender/sandbox identity غير إنتاجية.
- إنشاء HTTPS webhook endpoint منفصل للتجربة فقط.
- التحقق من authenticity/configuration للـwebhooks.
- تخزين events normalized في PostgreSQL المعزولة مع idempotency.
- اختبار `401`, `422`, `429`, `500`, `503` مع bounded exponential backoff.

لم يتم إنشاء حساب أو شراء خدمة أو تعديل DNS.

## 4. Token Lifecycle Design

### Ordinary Users — `user_password_reset_tokens`

1. يستقبل endpoint البريد، ويعيد response عامًا ثابتًا سواء كان الحساب موجودًا أو غير موجود.
2. يُولّد token عبر CSPRNG.
3. يُرسل raw token مرة واحدة عبر sandbox email فقط.
4. يُخزّن hash فقط، وليس raw token.
5. تكون مدة الصلاحية قصيرة ومحددة في التطبيق.
6. عند الاستهلاك، تتم المعاملة داخل transaction وبشرط `used_at IS NULL`, `revoked_at IS NULL`, و`expires_at > now()`.
7. يحدّث password hash باستخدام `scrypt` الحالي.
8. يضع `used_at` ويُلغي جميع `user_sessions` للمستخدم في نفس transaction.
9. يمنع replay وconcurrent consumption باستخدام row lock أو conditional update atomic.
10. يسجل audit event بدون raw token أو password أو البريد الكامل.

### Admin Accounts — `admin_invitations`

1. لا ينشئ الدعوة إلا Admin يملك `admins.manage`.
2. لا يسمح بمنح `SUPER_ADMIN` إلا وفق حماية الدور الحالية وبواسطة `SUPER_ADMIN`.
3. يُحفظ role المصرح به في سجل الدعوة server-side، ولا يؤخذ من client عند activation.
4. يُولّد token منفصل namespace عن Ordinary User tokens.
5. يُخزّن hash فقط مع expiry وrevocation وsingle-use.
6. يتحقق activation من token صالح ومن role المخزن في الدعوة.
7. يكتب `password_hash` باستخدام `scrypt` ثم يستهلك الدعوة atomic.
8. يسجل audit event للإنشاء والاستهلاك والإبطال.
9. يمنع role tampering وself-assignment وprivilege escalation.
10. لا يستخدم Ordinary User cookie أو session لإكمال Admin activation.

### Rate limiting and enumeration

يجب تطبيق rate limiting موزع على الأقل حسب IP وحسب normalized-email fingerprint، مع response عام ثابت. لا يجوز الاعتماد على in-memory limiter في deployment متعدد النسخ.

## 5. Proposed Migration

الـSQL المقترح موجود في:

`docs/phase17.19.30-proposed-migration.sql`

هو مقترح للمراجعة فقط، ولم يُضف إلى migration registry ولم يُنفذ على أي قاعدة.

التصميم يستخدم:

- Foreign keys إلى `user_accounts` و`admin_identities`.
- `token_hash` unique.
- فهارس على owner وexpiry.
- `used_at` و`revoked_at`.
- حالات يمكن استهلاكها atomic داخل transaction.
- `ON DELETE CASCADE` للـtokens التابعة للحساب.

لا يحاول SQL وحده فرض expiry مقارنة بالوقت؛ يجب فرضها في conditional update داخل transaction.

## 6. Isolated Migration Rehearsal

**NOT RUN — BLOCKED**

لا توجد قاعدة معزولة يمكن تنفيذ SQL عليها بأمان. لم تُنفذ migration على Production أو على قاعدة غير معروفة.

## 7. Password Recovery Rehearsal

**NOT RUN — BLOCKED**

لم يتم إنشاء routes أو runtime code أو إرسال sandbox email، وبالتالي لا توجد ادعاءات حول:

- valid reset.
- unknown account generic response.
- expiry/reuse/revocation.
- concurrent consumption.
- password hash update.
- session revocation.
- rate limiting.

## 8. Admin Invitation Rehearsal

**NOT RUN — BLOCKED**

لم يتم إنشاء invitation أو تفعيل credential أو إرسال email، وبالتالي لا توجد ادعاءات حول:

- authorization.
- explicit role enforcement.
- expiry/revocation/reuse.
- role tampering.
- concurrent consumption.
- audit event creation.
- SUPER_ADMIN protection.

## 9. Security Review

المحافظ عليه من Phase 17.19.29:

- scrypt password hashing.
- `timingSafeEqual` حيث ينطبق.
- hash-only session tokens.
- فصل User/Admin sessions.
- server-side RBAC.
- Same-Origin mutation protection.
- existing audit logging.
- منع تفعيل Admin بلا credential.

الفجوات التي يجب اختبارها بعد توفير البنية:

- raw token لا يظهر في logs أو URLs بعد الاستهلاك.
- generic response لا يكشف وجود البريد.
- atomic concurrent consumption.
- rate limiting موزع.
- role لا يأتي من client أثناء activation.
- reset لا يلمس `admin_sessions`.
- invitation لا يلمس `user_sessions`.

## 10. Files Changed

في هذه المرحلة أُضيفت artifacts تصميمية فقط:

- `docs/PHASE_17_19_30_CREDENTIAL_LIFECYCLE_REHEARSAL.md`
- `docs/phase17.19.30-proposed-migration.sql`

لم يتغير runtime code أو schema source أو migration registry، ولم تُحذف اختبارات Phase 17.19.29.

## 11. Tests and Build

اختبارات Phase 17.19.29 guard tests السابقة بقيت محفوظة ونجحت في آخر تحقق موثق.

لم تُنفذ اختبارات lifecycle stateful في هذه المرحلة لأن infrastructure غير متاح. لم يُشغّل build جديد بعد إضافة ملفات التصميم فقط.

لا يجوز اعتبار Definition of Done محققة اعتمادًا على unit/guard tests فقط.

## 12. Remaining Infrastructure Requirements

- Isolated PostgreSQL.
- Isolated Postmark Sandbox credentials.
- Separate HTTPS callback/base URLs.
- Distributed rate-limit store.
- Isolated test accounts and test sessions.
- Approved isolated migration execution path.
- Test harness capable of concurrent token consumption.

## 13. Production Safety Confirmation

- Production migrations: 0.
- Production DDL/DML: 0.
- Production seed: 0.
- Production accounts created: 0.
- Production passwords changed: 0.
- Production sessions revoked: 0.
- Production emails sent: 0.
- Production DNS changes: 0.
- Production environment changes: 0.
- Production deployment of credential flows: 0.

## 14. Exact Authorization Required Next

لا يُطلب أي تفويض Production الآن.

قبل المتابعة يلزم تفويض مستقل ومحدد يسمح فقط بـ:

> توفير واستخدام بيئة PostgreSQL وEmail Sandbox معزولة تمامًا عن Production، وتطبيق `docs/phase17.19.30-proposed-migration.sql` عليها فقط، ثم تنفيذ rehearsal الاختبارات دون دفع أو نشر runtime code إلى Production.

بعد نجاح rehearsal ومرور المراجعة الأمنية، يمكن طلب تفويض منفصل لـPhase 17.19.31 لتطبيق implementation على بيئة Preview مع secrets معزولة.

## References

[1]: https://postmarkapp.com/developer/user-guide/sandbox-mode "Postmark Sandbox Mode"
[2]: https://postmarkapp.com/developer/api/overview%23authentication "Postmark API Authentication"
[3]: https://postmarkapp.com/developer/api/overview "Postmark API Overview"
[4]: https://postmarkapp.com/developer/webhooks/webhooks-overview "Postmark Webhooks Overview"
[5]: https://postmarkapp.com/developer/webhooks/delivery-webhook "Postmark Delivery Webhook"
[6]: https://postmarkapp.com/developer/webhooks/bounce-webhook "Postmark Bounce Webhook"
[7]: https://postmarkapp.com/developer/integration/official-libraries "Postmark Official Libraries"
[8]: https://resend.com/docs/dashboard/emails/send-test-emails "Resend Test Emails"
[9]: https://resend.com/docs/webhooks/introduction "Resend Webhooks"
[10]: https://www.twilio.com/docs/sendgrid/for-developers/sending-email/sandbox-mode "SendGrid Sandbox Mode"
[11]: https://www.twilio.com/docs/sendgrid/for-developers/tracking-events/twilio-sendgrid-event-webhook-overview "SendGrid Event Webhook"
[12]: https://documentation.mailgun.com/docs/mailgun/user-manual/domains/domains-sandbox "Mailgun Sandbox Domains"
[13]: https://documentation.mailgun.com/docs/mailgun/user-manual/events/events "Mailgun Events"
