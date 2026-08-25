# Phase 17.2 Internal Audit

**Project:** A3LAM | أعلام  
**Phase:** 17.2 — Production Admin Identity, RBAC & User Management  
**Audit status:** Completed before implementation changes  
**Date:** 2026-08-25

## Executive finding

Phase 17.1 provides a usable server-side foundation, but it is not yet a fully operational administrative product. Legacy HMAC Admin authentication remains independent from public-user authentication and should remain available during transition. Persisted Admin identity/session tables are represented in Drizzle and migration `0004_phase17_1_admin_identity.sql`, but the migration is not applied in local or Production environments and must not be applied without explicit authorization.

## Reusable foundations

| Area | Reusable foundation | Current status |
|---|---|---|
| Admin authentication | `lib/admin/auth.ts` supports legacy HMAC validation and DB-backed hashed session lookup. | Reusable; persisted path depends on unapplied migration. |
| Authorization | `lib/admin/rbac.ts` centralizes role vocabulary and role-to-permission policy. | Reusable; currently static policy. |
| HTTP gates | `requirePermissionPrincipal` distinguishes anonymous `401` from authenticated `403`. | Reusable; all sensitive routes must continue to use it. |
| Page guards | `requireAdminPage` resolves the separate Admin cookie and redirects unauthenticated access. | Reusable. |
| Input validation | `lib/admin/input.ts` validates Admin identity inputs and IDs; `lib/admin/records.ts` validates editorial content. | Reusable but incomplete for Phase 17.2 filters/detail contracts. |
| User authentication | `lib/user/auth.ts` uses separate password/session handling and rejects disabled accounts. | Reusable; must not be merged with Admin auth. |
| Request security | `isSameOriginMutation` protects mutations. | Reusable; must remain on every Admin mutation. |
| Audit storage | Existing append-only `audit_logs` is used by Admin mutations. | Reusable; filtering/detail views are incomplete. |
| Design system | Existing AdminShell, RTL styles, localization surface, status/empty/error states. | Reusable; new pages should extend rather than duplicate it. |

## Incomplete or foundation-only areas

| Area | Gap | Phase 17.2 implication |
|---|---|---|
| Admin credentials | No safe invitation, activation, password setup, or reset provider is configured. | Do not activate identities or invent temporary credentials; expose `Requires Configuration`. |
| Persisted RBAC | `admin_role_assignments` persists one role per identity, but there are no persisted permission overrides and the catalog tables are not populated. | Keep policy centralized; add a migration only if persisted overrides are essential and document it as not applied. |
| Admin management | List/create/update/disable exists, but re-enable, confirmation UX, audit drill-down, and effective-permission views are incomplete. | Extend server contracts and UI without weakening last-Super-Admin protection. |
| Editor management | Editor listing and scoped creation/update exist, but lifecycle controls, session/audit/effective-permission views are incomplete. | Extend using `editors.manage`, while role escalation still requires `admins.manage`. |
| User management | User list can filter basic query/status and can disable/enable/revoke sessions. | Add richer filters, detail endpoint/page, profile projection, session and audit views; never expose hashes/private files. |
| Sessions | Active Admin session list and revoke exist. | Add safe status/owner presentation and confirmations; no raw tokens or hashes. |
| Permission UI | `/admin/roles` is read-only and based on static policy. | Add effective-permission presentation; do not show editable overrides without persistence and tests. |
| Audit UI | Existing audit list is shallow and lacks filters. | Add practical filters and safe actor/resource fields; no sensitive values. |
| Dashboard | Some real counts exist; identity/session counts are optional when migration is absent. | Add real queues/status only where backed by actual queries; retain unavailable state. |

## Migration 0004 review

`0004_phase17_1_admin_identity.sql` is additive and contains no INSERT statements, seed rows, default privileged accounts, credentials, people, profiles, categories, or user records. It adds `user_accounts.disabled_at`, creates Admin identity/role/permission/assignment/session tables, adds unique indexes, and constrains identity status, bounded role codes, and 64-character lowercase hexadecimal session token hashes.

The relationship behavior is explicit: Admin role assignments and sessions cascade when an identity is deleted; `assigned_by` is nullable and set null on actor deletion; role-permission rows cascade with their catalog rows. Since the role and permission catalogs are not seeded, the current app cannot claim that persisted role/permission catalog management is operational. The application’s static typed policy remains the source of authorization until a separately authorized configuration/migration exists.

The migration is transactionally compatible with `scripts/db-migrate.mjs`, which records applied filenames in `schema_migrations`. It has not been run locally because no local `DATABASE_URL` is configured and has not been run in Production. Rollback is not automatic; reversing additive DDL would require a separately reviewed migration and could be destructive. Therefore: **0004 = REVIEWED / NOT APPLIED**.

## Security boundaries

Admin identities, public-user accounts, professional profile ownership, and legacy Admin access remain distinct. No user account can authenticate to an Admin API through the user session cookie, and the Admin cookie is not used for public-user operations. Authorization is server-side; UI visibility is only presentation. The final-Super-Admin invariant is enforced in the repository transaction for active identity demotion/disable paths.

Admin mutations must authenticate before parsing or executing business logic, enforce permission server-side, validate input, use same-origin protection, write an audit event, and return a safe response. Passwords, token hashes, raw session tokens, database URLs, environment values, private files, and request bodies must not be logged or returned.

## Scope decision

Phase 17.2 may extend the existing APIs, repository, pages, tests, and localization. It must not start Population, create seed/fake/test accounts or content, modify current editorial data, add an Email Provider that is not already configured, apply any Production migration, change `A3LAM_ADMIN_ACCESS_TOKEN`, change `DATABASE_URL`, or start Phase 17.3/Phase 18.

## Decisions required before implementation

1. Keep the existing no-seed migration strategy. Role and permission catalog rows are reference configuration, not synthetic content, but no automatic insertion is authorized.
2. Add a normalized `admin_permission_overrides` table through `0005_phase17_2_rbac_management.sql`. It stores one explicit `allow` or `deny` override per Admin identity and permission code, uses bounded application/DB vocabulary, stores the assigning Admin ID, and contains no seed rows or accounts. The migration is created and reviewed only; it must not be applied to Production without explicit approval.
3. Keep Admin invitation/activation deferred until a real credential lifecycle and provider are configured.
4. Implement effective permissions as centralized role defaults plus persisted overrides when the 0005 table is available; present a safe unavailable/configuration state when it is not.
5. Prefer soft user suspension and session revocation; do not add destructive user deletion.
6. Treat database-backed identity/session/override functionality as `REQUIRES CONFIGURATION` until migrations are applied under explicit authorization.

## Audit conclusion

The Phase 17.1 foundation is suitable for incremental Phase 17.2 work. The safe implementation boundary is to complete server-side management contracts, UI detail/filter/audit surfaces, effective-policy presentation, tests, and read-only deployment verification while preserving the unapplied migration and deferred credential lifecycle.

## Implementation security review

The implementation keeps `a3lam_admin_session` and the public `a3lam_user_session` on separate authentication paths. Admin API mutations retain same-origin protection and follow the order of authentication, permission evaluation, bounded validation, transactional business logic, audit write, and safe response. Admin identity PATCH now evaluates management permission before retrieving the target identity, preventing unauthorized existence disclosure; editor-scoped actions cannot cross into Admin/Super Admin management without `admins.manage`, and only a principal whose role is `SUPER_ADMIN` may create, promote, or manage a Super Admin.

Effective authorization is the centralized role default plus bounded `allow`/`deny` overrides. Before migration `0005` is present, a missing-table dependency falls back to the static role policy so the pre-migration deployment remains compatible; this fallback grants no permission outside the static role default. Other database failures are surfaced as unavailable/internal responses by the route layer rather than being converted into grants. This transitional availability behavior must be revisited if overrides become a mandatory security control after migration rollout.

The last active Super Admin protection is enforced transactionally for demotion/disable and for permission replacement: when there is only one active Super Admin, `admins.manage`, `permissions.assign`, and `system.read` must remain effective. Permission replacement is delete-and-replace inside one transaction and its audit event is written in the same transaction, so a failed audit write rolls the change back. No catalog rows are seeded; the static typed vocabulary remains authoritative until a separately approved catalog-management design exists.

User detail projections return only approved account/profile metadata, calculated completion, active-session timestamps with opaque IDs, and audit metadata. They exclude password hashes, raw session tokens, private files, profile contact/private fields, and audit old/new values. Session IDs are shortened in the UI, and the security section explicitly states that credential hashes/tokens are never exposed and activation/reset operations remain deferred because no approved credential lifecycle/email provider is configured.

The new high-density Admin tables use localized `data-label` values and a mobile card layout below 45rem; the CSS does not rely on horizontal overflow for these Phase 17.2 surfaces. Exact viewport/browser and screen-reader measurements remain external verification items and are not claimed here.

## Current migration and data-safety status

| Item | Status |
|---|---|
| `0004_phase17_1_admin_identity.sql` | **REVIEWED / NOT APPLIED** locally or in Production |
| `0005_phase17_2_rbac_management.sql` | **CREATED / REVIEWED / NOT APPLIED** locally or in Production |
| Local database writes | **0**; no local database is configured |
| Production INSERT/UPDATE/DELETE/migration writes | **0** |
| Synthetic accounts, users, people, profiles, categories, seeds | **0** |
| Credential/email connectors enabled or modified | **0** |
| Production secrets or environment variables changed | **0** |
