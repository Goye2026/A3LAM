# Media Operations — A3LAM

## Provider configuration

The current Cloudinary adapter reads these variable names server-side only:

| Variable | Purpose |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud identifier |
| `CLOUDINARY_API_KEY` | Cloudinary server-side API key |
| `CLOUDINARY_API_SECRET` | Cloudinary server-side API secret; never expose it |

No values belong in Git, client bundles, logs, tickets, or public metadata. The provider is `configured` only when all three Cloudinary values exist and the cloud name passes configuration validation.

## State semantics

`configured` means the Cloudinary configuration is syntactically present. It does not claim that a live upload has succeeded. Network rejection is represented as an operation error. `not_configured` and `invalid_configuration` disable upload and public delivery in the UI; they never produce a fake URL or media record.

## Editorial workflow

A portrait upload is initiated from an authenticated Person editor with `media.manage`. The server validates filename, extension, MIME, magic bytes, size, and image dimensions, builds a server-controlled Cloudinary `public_id`, uploads the bytes through the server-side Cloudinary SDK, and only then writes `media_assets` plus `person_media` in one database transaction. If the database transaction fails after upload, the unreferenced Cloudinary asset is cleaned up on a best-effort basis and the operation is not reported as successful.

Metadata fields include alt text, source URL, attribution, and license. Public visibility requires both a valid source URL and license. Person removal is a detach operation; it does not delete a shared physical object. Library archive is allowed only when no attachment uses the asset.

## Observability and audit

Media mutations write `audit_logs` rows for asset creation/update/archive and attachment/detach actions. Read-only list and preview operations do not create audit records. Public responses expose only safe public URLs and visible content; Cloudinary credentials, audit fields, and private URLs remain server-side. Archiving an unlinked asset calls Cloudinary `destroy` using its `public_id` before the database status is changed.

## Backups and portability

PostgreSQL backups contain media metadata and attachments, not binary objects. The deployment owner must back up the object provider separately, preserve the mapping between `storage_key` and asset metadata, and verify public delivery after restore. Provider migration requires an object export, metadata/provider-key mapping, configuration change by the deployment owner, and a read-only verification pass. Phase 17.16 does not perform backup/restore or provider migration.
