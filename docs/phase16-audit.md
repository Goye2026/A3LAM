# Phase 16.0 — Architecture Audit and Scope Decisions

## Current architecture

A3LAM is a Next.js App Router application with server-side REST route handlers, PostgreSQL via postgres.js and Drizzle, independent user/Admin sessions, a server-side profile repository, public privacy projections, and an external storage abstraction. The current schema already contains profile identity, portrait `image_url`, visibility, experiences, education, skills, certifications, languages, portfolio items, social links, source records, and profile files.

## Implementable without migration

The phase will improve the existing profile completion checklist, clarify visibility modes in the editor, add a privacy-safe professional-contact CTA on public profiles, improve the existing share/copy/print experience, strengthen public portfolio presentation using existing `cover_url` and profile-public gating, and add client-side Admin filters for visibility, country, and city plus oldest-updated sorting. These changes reuse existing APIs, repositories, ownership guards, and projection logic.

## Deferred without migration/provider

A first-class profile cover image cannot be represented by the current `profiles` table or upload contract without a schema/API change. Per-work visibility, work dates/years, work categories beyond the existing `work_type`, sort order persistence, and work-attached file uploads are not represented by the current schema. A real contact form requires an Email Provider and server-side message persistence/rate limiting that are not currently configured. QR generation is deferred because adding a library or external QR service is not necessary for this pass. These items are documented as deferred; no migration file is created or applied.

## Security boundary

No user/Admin authentication code, session separation, ownership checks, privacy projection rules, storage provider, schema, migration, or Production data will be changed. Public contact data will be reachable only through an explicit professional-contact action rather than displayed as raw email/phone text. Public JSON-LD will not include direct contact fields. Portfolio items will remain visible only inside an already-public profile; item-level privacy remains deferred until the schema supports it.
