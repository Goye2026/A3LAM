# Media Operations — A3LAM

## Provider configuration

The current provider-neutral adapter reads these variable names server-side only:

| Variable | Purpose |
|---|---|
| `A3LAM_STORAGE_UPLOAD_URL` | private upload/delete/HEAD endpoint |
| `A3LAM_STORAGE_PUBLIC_BASE_URL` | public delivery base URL |
| `A3LAM_STORAGE_UPLOAD_TOKEN` | server-side bearer credential |

No values belong in Git, client bundles, logs, tickets, or public metadata. The provider is `configured` only when all three values exist, parse as HTTP/HTTPS URLs where applicable, and pass configuration validation.

## State semantics

`configured` means the configuration is syntactically present. It does not claim that a live upload has succeeded. Network rejection is represented as an operation error. `not_configured` and `invalid_configuration` disable upload and public delivery in the UI; they never produce a fake URL or media record.

## Editorial workflow

A portrait upload is initiated from an authenticated Person editor with `media.manage`. The server validates filename, extension, MIME, magic bytes, size, and image dimensions, builds a server-controlled storage key, uploads the object, and only then writes `media_assets` plus `person_media` in one database transaction. If the database transaction fails after upload, the unreferenced object is cleaned up on a best-effort basis and the operation is not reported as successful.

Metadata fields include alt text, source URL, attribution, and license. Public visibility requires both a valid source URL and license. Person removal is a detach operation; it does not delete a shared physical object. Library archive is allowed only when no attachment uses the asset.

## Observability and audit

Media mutations write `audit_logs` rows for asset creation/update/archive and attachment/detach actions. Read-only list and preview operations do not create audit records. Public responses expose only safe public URLs and visible content; storage keys, provider credentials, audit fields, and private URLs remain server-side.

## Backups and portability

PostgreSQL backups contain media metadata and attachments, not binary objects. The deployment owner must back up the object provider separately, preserve the mapping between `storage_key` and asset metadata, and verify public delivery after restore. Provider migration requires an object export, metadata/provider-key mapping, configuration change by the deployment owner, and a read-only verification pass. Phase 17.16 does not perform backup/restore or provider migration.
