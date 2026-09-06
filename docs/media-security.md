# XIV Media Security

Phase 2E media architecture. **Production uploads are not enabled.**

## Status

| Piece | Maturity |
| --- | --- |
| MediaAsset types + validation | IMPLEMENTED |
| Local photo / video selection | IMPLEMENTED |
| Quarantine after select | IMPLEMENTED |
| Consumer vs company read policy | IMPLEMENTED |
| Storage abstraction + quotas | IMPLEMENTED (no cloud SDK) |
| Signed upload grant shape | IMPLEMENTED (`uploadEnabled: false`) |
| Persistent Universe IDs for object prefixes | MIGRATION AUTHORED — NOT APPLIED (collision) |
| Media draft uses persisted Universe when membership exists | IMPLEMENTED IN CODE |
| Cloud signed upload | NOT CONFIGURED |
| Malware scanning | NOT CONFIGURED (`unavailable`, never `safe`) |
| Media intelligence (image/video/transcript) | PROTOTYPE interface only — not operational |

## Pipeline (target)

```
Client
  → Upload authorization
  → Signed upload
  → Quarantine
  → MIME / signature validation
  → Malware scan
  → Content processing
  → Metadata processing
  → Approval state
  → Object storage
  → CDN / signed delivery
```

Phase 2E implements local selection, validation, quarantine labeling, and honest upload denial. `uploadEnabled` is false. Deletion is governed and disabled. See [media-pipeline.md](./media-pipeline.md).

## Validation (deterministic)

Do not trust filename extension.

Denied when:

- executable or script MIME
- unsupported MIME
- oversized
- missing owner
- missing checksum
- missing Universe for private company media

## Storage

Provider-neutral `StorageProvider`:

- createUploadAuthorization
- completeUpload (disabled)
- getSignedDownload (opaque reference)
- getMetadata
- deleteObject (governed / disabled)
- checkQuota

Namespaces: consumer, organizations, universes, documents, images, video, avatars, agent-artifacts, business-data.

Compatible later with AWS S3, GCS, and other approved providers. **No cloud credentials are returned to mobile.**

Quotas are finite. Tiers: consumer, professional, business, enterprise, sovereign.

## Intelligence

`MediaIntelligenceProvider` exists as an interface. `createUnavailableMediaIntelligence()` returns `operational: false`. Do not claim image/video understanding is live.
