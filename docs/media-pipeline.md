# XIV Media Pipeline

## Status

| Piece | Maturity |
| --- | --- |
| Local photo / video selection | IMPLEMENTED |
| Deterministic MIME / size / checksum validation | IMPLEMENTED |
| Quarantine after select | IMPLEMENTED |
| Upload authorization API | IMPLEMENTED (returns not_configured) |
| Signed upload to object storage | NOT CONFIGURED |
| AWS S3 provider | NOT CONFIGURED |
| Malware scanner | NOT CONFIGURED (`scanStatus = unavailable`) |
| Media intelligence | NOT CONFIGURED / PROTOTYPE interface |
| Production publishing writes | DISABLED |

## Stages

```
User selects media
  → local validation
  → upload authorization
  → Universe / ownership validation
  → storage quota check
  → quarantine
  → MIME / signature validation
  → scanner interface
  → processing interface
  → approved / rejected
  → authorized delivery
```

Phase 2E implements selection, validation, quarantine labeling, and honest upload denial.

Statuses shown in UI:

- SELECTED
- PENDING
- QUARANTINED
- SCAN UNAVAILABLE
- READY
- REJECTED
- UPLOAD NOT CONFIGURED

Unscanned media is never marked `safe`.

## Limits

Finite prototype limits by tier: consumer, professional, business, enterprise, sovereign.

Sovereign is **not** deployed. The tier exists only as a quota policy shape.

Allowed image MIME: `image/jpeg`, `image/png`, `image/webp`.

Allowed video MIME: `video/mp4`, `video/quicktime`, `video/webm`.

Filename extension is not trusted.

## Isolation

Private company media requires Universe + organization. Cross-Universe reads are denied. Consumers cannot read restricted company media. Private media has no permanent public URL.
