# A3LAM — Phase 17.6 Audit and Scope Closure

## Status

**Phase 17.6 audit complete. Implementation not yet started at the time of this audit.** Population, seed data, new migrations, provider setup, analytics, AI, and external integrations remain out of scope.

## Existing architecture confirmed

The current project is a Next.js 16.3.1 App Router application using React 19.2.8, TypeScript 6.0.2, PostgreSQL through `postgres` and Drizzle, REST route handlers, and the existing separate Admin/public-user authentication cookies. The existing Admin authentication, central RBAC vocabulary, effective-permission resolver, Admin session model, audit log table, migration registry/runner, Site Experience repository, public projection, profile ownership, people/categories/profile repositories, storage status abstraction, and safe error mapping are already present.

The existing `adminRepository` is the server-side operational layer for dashboard aggregates, people and category management, user management, Admin identities, effective permissions, Admin sessions, audit reads, and transactional audit-backed mutations. New implementations must extend this layer rather than introduce a second repository, auth system, permission vocabulary, session system, audit system, migration runner, storage abstraction, or public projection.

## Current capability map

| Area | Current evidence | Phase 17.6 disposition |
|---|---|---|
| Dashboard | `/admin` already loads counts, quick actions, recent people/audit, and limited health data | Extend cards and permission-filtered actions; preserve existing server reads |
| Users | `/admin/users` and `/api/admin/users` support read, suspend/reactivate, and revoke-all-user-sessions | Extend filters/pagination/state semantics only where existing schema supports them; preserve mutation guards |
| Admins/editors | `/admin/administrators` and `/admin/editors` share operational identity manager and server-side role/status actions | Refine operational presentation; preserve last-active-Super-Admin protections |
| RBAC | Central role/permission matrix and effective-permission override API/UI exist | Improve clarity of inherited/allowed/denied states; do not create new permission names |
| Sessions | Read, single revoke, revoke-all, and current-session API modes exist | Improve status/current-session UX without exposing tokens or weakening guards |
| Audit | Filtered read endpoint/page and audit-backed mutations exist | Improve filter/pagination/state presentation using existing audit fields |
| People | CRUD/editorial lifecycle and pagination exist | Improve empty/error/filter semantics without population |
| Categories | Existing admin list/create/update flow exists with people/profile counts | Preserve CRUD and explicitly create no Production categories |
| Profiles | `/admin/profiles` and `/admin/profiles/[id]` moderation surfaces exist | Improve operational status/filter presentation without changing ownership/privacy/publication rules |
| Site Experience | Shared permission wrapper and draft/publish repository exist for homepage, appearance, identity, navigation, footer, SEO, settings, and profile presentation | Add a hub/aliases only if useful; preserve draft isolation and preview protection |
| Media | Storage status is exposed and provider can be unconfigured | Show `PROVIDER_NOT_CONFIGURED` semantics; no provider or filesystem fallback |
| System | Registry inspector and permanent migration control plane exist | Remove the Run Migrations UI from Phase 17.6 system presentation; keep registry read-only and do not execute migrations |
| Error states | Safe HTTP codes exist, but several pages collapse failures into generic database messages | Add truthful UI state mapping without exposing internal details |

## Material gaps selected for implementation

1. The dashboard needs broader operational overview cards and a complete permission-filtered quick-action set, while retaining bounded aggregate reads.
2. User and audit pages need clearer filters and bounded navigation where the current schema and repository contracts support them; no speculative columns or migrations will be introduced.
3. Sessions need explicit current-session treatment in the UI and safe status presentation; raw cookies, tokens, and credentials must remain absent.
4. The permissions experience needs explicit visual distinction between role defaults, allowed overrides, denied overrides, and effective permissions, all derived from the existing server resolver.
5. Site Experience needs a central navigation hub/aliases if implemented, but existing resource pages remain the source of truth. The system page must not present a migration execution button in Phase 17.6.
6. Admin list pages need consistent empty, unavailable, forbidden, not-configured, loading, success, and error semantics. The implementation will use existing server boundaries and will not claim WCAG 2.2 AA without measured evidence.

## Architecture and safety decisions

No new database migration is authorized by this audit. The initial implementation is limited to existing tables, existing fields, existing routes, and existing permission codes. If a requested behavior is found to require schema changes, the affected work must stop and a `SCHEMA_CHANGE_REQUIRED` report must be written instead of generating or applying a migration.

No Production data mutation is required for implementation verification. No person, category, user, profile, CV, file, or seed record will be created. Any mutation endpoint testing that would alter real Production data will be marked `NOT TESTED` unless it can use a safe pre-existing record without changing editorial content.

The existing `system.migrations.execute` permission and execution API remain part of the already deployed Phase 17.5.4 control plane, but Phase 17.6 will not expose a Run Migrations action in the Admin system UI and will not call the execution endpoint.

## Phase 1 conclusion

The repository contains most of the requested operational foundation. Phase 17.6 should be an incremental activation/hardening pass, not a rewrite. The next phase is to finalize the gap matrix and implementation contract before changing code.
