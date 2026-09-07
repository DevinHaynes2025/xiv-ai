# XIV Business Modules

**TENANT PERSISTENCE BLOCKED** · `businessModulesTenantReady = false` · marketplace persistence is not implemented

Upcoming Modular Business OS work (WMS, Insurance, Real Estate, Lead Engine) binds to tenant context:

`auth.uid()` → membership → organization → Universe → module install → explicit permissions.

## InstalledBusinessModule

In-memory concept only (`persisted: false`):

| Field | Meaning |
| --- | --- |
| moduleId | Stable module identity |
| organizationId | Owning XIV organization |
| universeId | Optional Universe bind |
| packageId | Publisher package |
| version | Package version |
| status | `declared` / `pending_review` / `not_installed` |
| permissions | Explicit allow-list only |
| installedBy | Actor user id when approved |
| installedAt | Install time when approved |

No marketplace rows. No phone-side executable download.

## Cloud install path (planned)

Developer Package → Signature Verification → Security Scan → Manifest Validation → Permission Review → Organization Approval → Universe Binding → Installation → Audit.

The phone should receive UI bundle/config, authorized API access, and module metadata. Heavy code stays in a governed cloud/runtime.

Signing verification is **PLANNED**, not implemented.
