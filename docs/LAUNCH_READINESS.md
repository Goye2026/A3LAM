# A3LAM — Launch Readiness

هذه الوثيقة هي بوابة إطلاق Phase 17.8. وهي تميّز بين ما تم التحقق منه فعليًا، وما هو جاهز للتحقق الخارجي، وما يحتاج إعدادًا من مالك البنية التحتية. لا تمنح هذه الوثيقة صلاحية لتنفيذ migrations أو seed أو Production mutations أو تغيير الأسرار.

## Launch matrix

| Area | Status | Evidence | Limitation |
|---|---|---|---|
| Web application | PASS WITH LIMITATION | Local typecheck/lint/test/build and Production GET-only smoke | Full real-user E2E remains outside this phase |
| Runtime parity | PASS WITH LIMITATION | `.node-version` and Docker pin Node.js 22.13.0; Vercel metadata is Node.js 24.x | Vercel parity requires owner configuration if exact Node 22 is mandatory |
| Docker | READY FOR EXTERNAL VERIFICATION | `Dockerfile`, `.dockerignore`, `docker-compose.yml`, non-root `USER node`, health-gated Compose | Docker CLI is unavailable in the development environment |
| VPS/self-hosting | READY FOR EXTERNAL VERIFICATION | `SELF_HOSTING.md`, `DEPLOYMENT.md`, nested operator runbooks | No external VPS was provisioned |
| PostgreSQL | PASS WITH LIMITATION | Existing Drizzle/PostgreSQL architecture and migration runbook | New-host migration must be run by an operator after backup; no migration ran here |
| Domain/HTTPS | READY FOR EXTERNAL VERIFICATION | `DOMAIN_SETUP.md`; canonical/robots/sitemap review | No DNS, certificate, or custom-domain cutover was performed |
| Backups | READY FOR EXTERNAL VERIFICATION | `BACKUP.md`, `RESTORE.md`, `DISASTER_RECOVERY.md` | No Production dump or destructive restore was executed |
| Android foundation | ANDROID REQUIRES EXTERNAL BUILD ENVIRONMENT | `android/README.md`, `capacitor.config.example.json`, `ANDROID_RELEASE.md` | SDK, Gradle, emulator/device, and signing key are unavailable |
| Security | PASS WITH LIMITATION | Server-side auth/RBAC, same-origin gate, secure headers, privacy scans | No external penetration test was performed |
| SEO | PASS WITH LIMITATION | Metadata, canonical, Open Graph, Twitter, JSON-LD, robots, sitemap smoke | Custom-domain absolute URLs require final owner configuration |
| Accessibility | READY FOR EXTERNAL VERIFICATION | Semantic/focus/RTL review and local visual smoke | Screen reader and measured WCAG 2.2 AA evidence are not certified here |
| Storage/email | REQUIRES CONFIGURATION | Existing provider abstractions and explicit configuration states | No provider credentials or configuration were changed |
| Population | DEFERRED | Explicitly outside this phase | No content records were created or edited |
| Phase 18 | DEFERRED | Explicitly outside this phase | Not started |

## Release gate

A3LAM may be handed off as a **Release Candidate with limitations** when local validation passes, the Production deployment is `READY`, and read-only smoke checks are recorded. A private-host or Android release requires the owner to complete the rows marked `READY FOR EXTERNAL VERIFICATION`, `REQUIRES CONFIGURATION`, or `NOT TESTED` in the target environment.

## Required operator evidence

Before declaring Docker, private hosting, Android, accessibility, or custom-domain release complete, attach the command output, device/browser versions, URL, timestamp, and reviewer for each relevant check. Never convert an unavailable environment into a PASS by inference.
