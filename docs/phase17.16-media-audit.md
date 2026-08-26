# A3LAM — Phase 17.16 Media Audit

## Architectural finding

قبل Phase 17.16 كان لدى Editorial People حقل `people.image_url` اختياري فقط، بينما كان `profile_files` مرتبطًا بالـProfessional Profiles. إعادة استخدام `profile_files` للشخصيات كانت ستخلط domain ownership وتكسر portability والخصوصية. لذلك اختيرت طبقة مستقلة: `media_assets` للـasset metadata و`person_media` لعلاقة الاستخدام والتحكم في portrait/secondary وprimary uniqueness.

## Persistence model

| Entity | Responsibility | Safety boundary |
|---|---|---|
| `media_assets` | provider, controlled storage key, public URL, filename, MIME, extension, size, dimensions, alt, source, attribution, license, status, visibility, actors, timestamps | no binary bytes, no secret values |
| `person_media` | Person-to-asset attachment, usage type, primary flag, creator, timestamp | `ON DELETE RESTRICT` on asset and unique primary portrait per person |

The migration is additive, transactional through the existing runner, and registered as migration 0007 after 0006. It has no seed rows, no data rewrite, no destructive DDL, and no automatic invocation during build.

## Storage contract

The provider adapter is provider-neutral. It exposes typed configuration state and operations for upload, delete, existence, and public URL construction. Configuration is evaluated server-side from the existing variable names only. Values are never returned to the client, written to metadata, or emitted in logs. A missing or invalid provider produces a blocked UI state, not a fake success.

## Validation

Uploads accept JPEG, PNG, and WebP only. The server checks filename safety, extension, MIME, magic bytes, maximum size, and image dimensions. SVG is not accepted. Metadata rejects unsafe URLs and invalid visibility transitions. Public visibility requires a source URL and license/rights text. Storage keys are server-controlled and reject traversal patterns. Public projection runs the safe URL helper again before rendering.

## Authorization and request security

Media listing requires `media.read`. Upload, metadata update, archive, and detach require `media.manage`. Mutating routes use the existing server-side Admin principal, centralized RBAC, same-origin mutation gate, typed safe error responses, and audit logging. Frontend controls are not the security boundary.

## Attachment and deletion safety

A successful upload creates the object first and persists asset plus attachment metadata transactionally. If persistence fails, the implementation attempts orphan cleanup and reports failure. Detach removes only the relationship and clears the legacy Person image field in the editor state; it does not delete a shared object. Archive is available only when no attachment references the asset, and archived/private assets are excluded from public projection. No physical deletion was executed in Phase 17.16.

## Public and SEO projection

Only a ready, public, primary portrait attached to a published Person is eligible for public use. Public Person pages, Search/cards, Open Graph, and JSON-LD use the canonical attachment when the schema and attachment exist. If migration 0007 is pending or no attachment exists, the safe legacy `image_url` fallback remains available. Private assets, internal identifiers, storage keys, audit records, and provider details are not included in public output.

## Current external blockers

The Production registry has 0007 pending, and the storage provider is not configured. Consequently, no real upload, public delivery, object existence check, archive, detach, or media persistence operation was performed against Production. These are external configuration gates, not workarounds to be hidden by the UI.
