# Phase 17.19.4 — Implementation Map (Pre-Change Audit)

## Actual stack

The repository is a Next.js 16.3.1 App Router application using React 19.2.8, TypeScript 6.0.2, Drizzle ORM 0.45.2, PostgreSQL-compatible schema definitions, Vitest 4.1.11, ESLint 9.39.5, Node.js 22.13.0, and pnpm 11.21.0. The existing architecture is not the generic Vite/tRPC template; no replatforming or new framework is authorized.

## Current CMS state

Pages, Posts, Tags, typed JSON rich content, lifecycle transitions, server-side repository access, RBAC-protected admin routes, admin-only noindex previews, full write-side revision snapshots, and published-only public/sitemap projections were added in Phase 17.19.3. The Content Registry correctly reports Pages, Posts, and Tags as `requires_configuration` until migration `0010_phase17_19_3_content_engine.sql` is applied. Person and Profile workflows remain separate.

The current editorial repository has no revision-list/read/compare/restore API, no bulk editorial API, and no content-workspace summary. The current editor supports typed blocks and local in-session undo/redo but has no durable local recovery, unsaved-change warning, revision panel, or media picker. The current Page/Post list supports query/status/pagination but not bulk selection or author/taxonomy affordances.

## Current Media state

`media_assets` and `person_media` are present in the Drizzle schema and are governed by migration 0007. `lib/media/repository.ts` provides list/detail/create/attach/detach/archive and metadata update operations. Admin Media already offers grid/list, local filtering, metadata projection, honest provider/schema unavailable notices, and safe archive behavior. Upload is a real provider-dependent Person portrait flow and is not a generic CMS upload contract. No Production storage or provider configuration is authorized in this phase.

The existing Media model has a `media_assets` foreign-key target for CMS featured media, but Phase 17.19.3 intentionally rejects CMS featured-media assignment because no eligible picker/assignment contract exists. Phase 17.19.4 may add a read-only reusable picker for existing eligible media only; it must not add upload/provider behavior or expose private storage data.

## Current Admin Shell and appearance

`AdminShell` centralizes principal loading, effective permissions, navigation filtering, sidebar, top bar, header, breadcrumbs, notifications, content, and footer. `AdminSidebar` has a responsive local mobile drawer and active navigation highlighting. `AdminDesignSystem` provides shared header/topbar/breadcrumb/page-header/notification/status/empty primitives. Contextual shell data is currently mostly static: title and breadcrumb are control-center labels, and there is no duplicate navigation implementation.

The Theme Registry contains one active A3LAM Editorial theme with `index`, `single-person`, `archive`, `search`, and `not-found` templates plus header/footer/sidebar/content layout parts. `single-page` and `single-post` are currently safely resolved to `not-found`, so Phase 17.19.4 can add typed React template contracts and safe page/post renderers without introducing WordPress templates or dynamic code execution.

`menuRegistry.ts` is static and typed with URL, depth, duplicate, parent, and cycle validation. There is no menu persistence or widget persistence. Appearance pages are existing configuration surfaces; no fake theme builder or arbitrary widget runtime is authorized.

## Security and Production boundaries

Authentication and effective RBAC are server-authoritative. CMS mutations use same-origin protection, bounded JSON body parsing, typed validation, optimistic version checks, safe error mapping, and audit writes. Public projections filter for explicitly published content. AI activation remains disabled and must not be modified. Production is read-only: no POST, PUT, PATCH, DELETE, upload, migration, seed, provider, OCR, queue, secret, Vercel, or DNS operation is authorized.

## Phase 17.19.4 implementation decisions

1. Add revision list/preview/restore contracts using existing `cms_content_revisions`; restore will require `content.update`, an expected current content version, and an expected revision version. It will be transactional, audit-logged, and refuse stale current records.
2. Add bounded bulk status operations only for existing Page/Post records. The operation will use per-record version checks, canonical status permissions, an upper bound, and a deterministic all-or-nothing transaction; no mass publication and no taxonomy bulk mutation will be represented unless separately implemented.
3. Add explicit local recovery in the editor using a namespaced localStorage snapshot, restore/discard choice, beforeunload warning, and wording that distinguishes `Saved locally` from `Saved to server`. No fake server autosave is added.
4. Add a read-only Media Picker for existing ready/public media returned by a permission-protected endpoint. It will support browse, query, select, cancel, and metadata preview. It will not upload, alter ownership, expose storage keys, or assign featured media until a real CMS assignment backend is justified and implemented.
5. Add contextual reusable shell primitives and honest Content Hub capability summaries, while keeping `requires_configuration` items visibly non-functional until migration readiness exists.
6. Add safe typed page/post template contracts and render wrappers, without database access in presentation components and without dynamic imports/eval/raw HTML.
7. Add deterministic focused tests with at least 12 meaningful cases covering the new contracts and adversarial security cases.

## Explicitly deferred

Server autosave, arbitrary menu/widget persistence, generic upload, media provider activation, Production migration, scheduling workers, AI integration, automatic population, and later phases remain out of scope.
