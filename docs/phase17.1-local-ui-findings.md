# Phase 17.1 local UI findings

Date: 2026-08-25

A local production server was started from the built project without configuring DATABASE_URL. Read-only checks returned HTTP 200 for `/` and `/api/health`, HTTP 307 for `/admin` (redirect to the Admin login boundary), and HTTP 401 for `/api/admin/administrators` without an Admin cookie.

The browser visual check of `/` loaded the Arabic RTL shell, navigation, search controls, hero, stats, and footer without a visible runtime error. The catalog sections correctly displayed the existing unavailable/empty state because no local database was configured. No mutation, login, account creation, or data insertion was performed. The viewport was the sandbox browser default; mobile/tablet external responsive verification remains not tested.

The local browser check of `/admin` redirected to `/admin/login?next=%2Fadmin`. With no local `A3LAM_ADMIN_ACCESS_TOKEN`, the login page showed the explicit unavailable configuration state and no credential form. This confirms the Admin boundary is separate and does not silently fall back to public user authentication.

Production read-only visual verification on `https://a3-lam.vercel.app/` loaded the Arabic public homepage from the deployment associated with commit `e22c89c8424216ceb196b02d15ddf287591a2ca9`. The page rendered the public RTL shell, public navigation, search controls, and publication-gated empty/unavailable catalog state without a visible runtime error. No login, POST, PATCH, DELETE, migration, or data mutation was performed.

Production GET-only status checks on 2026-08-25 returned: `/api/health` 200, `/admin` 307 to the Admin login boundary, `/api/admin/administrators` 401 without an authorized Admin session, `/robots.txt` 200, and `/sitemap.xml` 200. No database migration status was inferred from these checks; migration remains unapplied/not verified.

After the final documentation deployment reached READY, the production alias was visually rechecked. The Arabic public shell, search controls, and publication-gated catalog state rendered without a visible runtime error. The check remained GET/visual-only; no Admin login, mutation, migration, or data creation was attempted.

Vercel read-only deployment verification: deployment `dpl_58HuwC4JieiZVhG8fk3esLUgwiMB` reached `READY` with target `production`, alias `a3-lam.vercel.app`, and GitHub commit `3f6ec1c53e7fc676286fa583ab67274ae56ebb57`. No migration or content/account mutation was executed.
