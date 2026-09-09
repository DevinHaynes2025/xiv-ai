# Business Live Security

Defense-in-depth targets for future livestreams.

## Status

| Control | Maturity |
| --- | --- |
| Host / viewer authorization types | IMPLEMENTED |
| Public cannot expose restricted classification | IMPLEMENTED |
| Private tenant rooms require membership | IMPLEMENTED (blocked until persistence is LIVE) |
| Stream provider | NOT CONFIGURED |
| Device / session step-up | PLANNED |
| Rate limiting / abuse detection | PLANNED |
| Recording / screen-share consent | PLANNED |
| DLP | NOT CONFIGURED |
| Kill switch | PLANNED |

Moderation Agent may `recommend_block`, `recommend_warning`, or `recommend_review`. It cannot silently terminate a stream or auto-ban a host.

DLP does not simulate detections. Status is `not_configured`.
