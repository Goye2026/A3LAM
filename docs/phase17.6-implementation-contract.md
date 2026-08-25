# A3LAM — Phase 17.6 Implementation Contract

## Objective

Activate the existing Admin Control Center for daily operational use without rebuilding the architecture, changing the database schema, populating Production, or exposing a second permission/auth/session/audit system.

## Scope selected

The implementation will make the existing `/admin` dashboard more operational, improve truthful state handling across Admin list screens, improve bounded user/audit/session experiences, clarify effective permissions, add a central Site Experience hub using existing resources, and remove the migration execution action from the Phase 17.6 system UI. Existing server-side APIs and repository mutations remain the source of truth.

## Explicit non-goals

Population, bulk population, AI, semantic search, analytics, email/storage provider integration, external integrations, advanced media processing, QR/PDF services, autosave APIs, onboarding wizards, seed records, Production test records, and new migrations are excluded. No new Admin, Editor, user, person, category, profile, CV, or file record will be created for this phase.

## Architecture decisions

| Decision | Selection | Reason |
|---|---|---|
| Data access | Extend `adminRepository`, existing repositories, and REST route handlers | Preserves server-side boundaries and existing contracts |
| Authorization | Reuse `getAdminPageAccess`, `requirePermissionPrincipal`, `hasEffectiveAdminPermission`, and existing permission codes | Avoids a second RBAC vocabulary and ensures UI cannot grant authority |
| Identity/session | Reuse existing Admin identity/session tables and legacy Admin session compatibility | Keeps Admin auth separate from public-user auth |
| Audit | Reuse `audit_logs` and existing transactional audit writes | Maintains traceability without new audit storage |
| Database | No schema or migration change planned | Existing columns support the selected filters and displays; stop with `SCHEMA_CHANGE_REQUIRED` if this changes |
| Site Experience | Reuse existing resource pages/repository and add only a navigation hub/aliases if needed | Preserves draft isolation, preview protection, and public projection |
| Migration UI | Keep the deployed control-plane API for the prior phase but do not mount a Run Migrations action in Phase 17.6 UI | The Phase 17.6 contract explicitly forbids a Run Migrations button |
| Provider states | Render storage/email as configuration states, not database failures | Matches the project’s truthful error-state policy |
| Production verification | GET/HEAD-only by default; mutation paths are tested locally and marked NOT TESTED in Production if they would change real data | Prevents test data and editorial changes |

## Delivery slices

1. Dashboard overview and quick actions: add bounded operational cards for users, active/suspended users, Admins, Editors, profiles, people, categories, and publication/review states; show only permission-authorized actions.
2. User and session operations: retain existing suspend/reactivate and session revocation protections; add bounded pagination/filter semantics and current-session indication only where supported by existing fields.
3. Admin/Editor and permissions operations: preserve identity creation/update and last-active-Super-Admin protections; make role defaults, allowed overrides, denied overrides, and effective permissions explicit in the UI.
4. Audit and content operations: improve audit filtering/empty states and people/category/profile list states without creating content or weakening publication/ownership boundaries.
5. Site Experience center: add a central `/admin/site` index and safe aliases only if they can reuse existing pages without new schema; keep all save/publish operations permission-gated and do not invoke them in Production verification.
6. System and error semantics: remove the migration execution component from `/admin/system` for this phase, preserve read-only registry health, and distinguish empty, unavailable, forbidden, not-configured, not-found, and conflict states in affected pages.

## Acceptance gates

Implementation is allowed to proceed only while all of the following remain true: no migration is required; no Production content/test data is created; no secret or Vercel environment change is needed; no client-side database access is introduced; all mutations remain server-side, permission-checked, validated, same-origin protected where applicable, audited, and safe on retry; and the last active Super Admin protections remain intact.

If a feature requires a schema change, unsupported permission, provider, secret, authentication bypass, or unsafe Production mutation, stop that slice and document `SCHEMA_CHANGE_REQUIRED` or `BLOCKED` rather than using a workaround.

## Verification target

Required local checks are frozen install, typecheck, lint, test, build, and `git diff --check`. Production verification is read-only and must cover public routes plus authenticated Admin routes that can be safely read. No WCAG 2.2 AA, cross-browser, screen-reader, or real-user claim may be made without the required evidence.

## Phase 2 conclusion

The Phase 17.6 implementation contract is closed. The work can proceed as an incremental operational-hardening pass over the existing architecture.
