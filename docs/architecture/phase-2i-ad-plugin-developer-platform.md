# Phase 2I-AD Proposal — Plugin Marketplace + Developer OS

**Status:** PROPOSAL ONLY — not scheduled for implementation until CEO authorization after 2I-AB/AC inspection.  
**Queue:** [`xiv-master-build-queue-2i-ad-to-2i-at.md`](./xiv-master-build-queue-2i-ad-to-2i-at.md) (AD–AT); continuation [`xiv-master-build-queue-2i-ad-to-2i-bf.md`](./xiv-master-build-queue-2i-ad-to-2i-bf.md).

## Intent

Extend existing platform / plugin / developer SDK foundations into a governed **Plugin Marketplace + Developer OS** so third-party and internal packages can be discovered, reviewed, sandboxed, and installed **without** granting unrestricted runtime privilege or L4.

## In scope (proposal)

- Signed plugin manifests; capability declarations; tenant + universe scoping
- Marketplace catalog + install lifecycle: discover → review → sandbox install → (human/policy) promote
- Developer OS surfaces for SDK, fixtures, and local simulation
- Composition with Agent Firewall, Guardian, Data Access Gateway, evidence/provenance

## Out of scope (this proposal / AD landing)

- LIVE payment or commerce settlement credentials
- Auto-install to production; plugin self-grant of permissions
- Enabling L4; weakening tenant/universe isolation
- New model/provider keys (`NOT_CONFIGURED` until proven)
- Implementing AD in the same change as this proposal document

## Invariants to preserve

- Plugin installed ≠ unrestricted
- Creative / developer control ≠ production control
- Connected network ≠ trusted
- ONE phase at a time; fail → STOP / report / preserve last good

## Exit criteria (when CEO later authorizes build)

- Deterministic unit contracts + tests; no network required for foundation proof
- Explicit denial paths for unsigned / over-scoped / cross-universe install
- Providers and production credentials unchanged (`NOT_CONFIGURED` / gated)
- Dual-remote landing on `xiv-v2` only after VERIFY gate
