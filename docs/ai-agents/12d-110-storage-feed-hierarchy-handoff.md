# 12D-110 — Storage Feed Hierarchy: Local / Offline-Carrier / Cloud Tier Contract (handoff)

Status: BUILT LOCALLY on `claude/12d-110-storage-feed-hierarchy`. Covers the CEO-named three-tier storage scope: LOCAL storage, OFFLINE carrier (portable/export), and CLOUD (contract only).

## What it is

A deterministic, pure STORAGE FEED contract governing where XIV artifacts (story records, reports, social archive entries, receipts) may live. No file I/O, no network, no cloud call — this is the routing/gate layer only: `routeArtifactToTiers(input)` decides per-tier eligibility from caller-supplied descriptors (kind, security class, size, sha256 content hash, tenant, evidence refs), and the only side effect is an in-memory decision ledger.

## Hard classification rules

`STORAGE_TIER_POLICY` (frozen) fixes per-tier item ceilings, batch ceilings, and retention hints, plus the classification matrix: TOP_SECRET is LOCAL-only — it never leaves the local plane, and an explicit routing attempt to OFFLINE-CARRIER or CLOUD throws (fail closed); CONFIDENTIAL is LOCAL or contract-registered CLOUD with an operator receipt, never carrier-exportable; ORDINARY may use all three tiers by contract. CLOUD is contract-only: an item is denied CLOUD unless an operator-authorized contract is registered for the tenant.

## Cloud is contract-only, and the packet says so

`registerCloudContract` records region, retention class, and a REQUIRED operator authorization ref into an in-memory map. It accepts no credentials (credential-shaped fields throw), contacts no endpoint, and the returned packet states `cloudTransferPerformed: false` with `requiresAuditedOperatorLayerForExecution: true` — executing such a contract belongs to a future, separately audited operator layer with its own human decision.

## Verification

8/8 tests (`test:12d-110`): policy/guardrails frozen with honest values; TOP_SECRET never routes above LOCAL (matrix denies + explicit attempts throw); ORDINARY routes to all three by contract; CONFIDENTIAL gating including no-contract denial; oversized/malformed-hash/bad-tenant/bad-refs fail closed; cloud contract requires an operator receipt, rejects credentials, never claims transfer, rejects duplicates; snapshot honest flags (`realArtifactsStored: 0`, `cloudTransferPerformed: false`) with frozen output; deterministic pure routing. `typecheck:12d-110` PASS. Wired into `.gitlab-ci.yml`.

## Trust limits

The module never stores content — `realArtifactsStored` is hard-coded 0 because everything so far is contract and routing decisions on caller-supplied descriptors. `STORAGE_FEED_GUARDRAILS` (frozen): `performsNoIO: true`, `remoteCallsAllowed: false`, `cloudIsContractOnly: true`, `topSecretNeverLeavesLocalPlane: true`, `humanDecision: 'REQUIRED'`.