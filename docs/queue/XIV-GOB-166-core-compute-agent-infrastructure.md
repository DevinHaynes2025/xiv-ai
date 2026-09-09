# XIV-GOB-166 — Core Compute / Agent Infrastructure

Status: **QUEUED ARCHITECTURE — NOT IMPLEMENTED** / **DEPLOYMENT_STATE=QUEUED** / **tip-landed=NO**
**Canonical home: Global operations brain.** Do not copy this story into Enterprise OS, Engineering civilization, or Mobile.
Park: `cursor/queue-gob-166-core-compute-infra-d8c0`. Target `xiv-v2` when authorized. Never force-push. Never push `main`.
L4 disabled. All `AUTO_*` FALSE.

**Theme:** AMD software acceleration, CPU/GPU/NPU routing, message bus, task graph, and Home Base receipts are **one shared core** used by every XIV surface.

```
Global Operations Brain
  → #166 Core Compute / Agent Infrastructure   (canonical)

Enterprise OS
  → Depends on #166
  → enterprise-specific usage of that infrastructure
```

**Full contracts:** [`docs/architecture/xiv-gob-166-core-compute-agent-infrastructure.md`](../architecture/xiv-gob-166-core-compute-agent-infrastructure.md)

**Routing rule:** [`docs/architecture/xiv-work-surface-routing.md`](../architecture/xiv-work-surface-routing.md)

**Enterprise depends-on (not a copy):** [`docs/architecture/xiv-enterprise-os-depends-on-gob-166.md`](../architecture/xiv-enterprise-os-depends-on-gob-166.md)

## Founder user story

As the XIV AI Founder, I want one Global Operations Brain core for compute and agents — AMD acceleration, CPU/GPU/NPU routing, message bus, task graph, Home Base receipts — so Enterprise OS, Engineering civilization, Mobile, and government packs **use** that core instead of each growing a private AMD brain.

## Permanent rules

1. AMD DETECTED ≠ OPTIMIZED; AMD ADAPTER ≠ PARTNERSHIP.
2. MESSAGE BUS ≠ AUTHORITY; TASK GRAPH ≠ PRODUCTION EXECUTE.
3. HOME BASE RECEIPT ≠ SETTLEMENT; HOME BASE ≠ COMPANY ROOT.
4. ENTERPRISE OS ≠ SEPARATE COMPUTE BRAIN; MOBILE UI ≠ ROUTER; 61N R&D ≠ OPERATIONAL ROUTER.
5. MORE COMPUTE ≠ MORE AUTHORITY; L4 DISABLED; NEVER INFER PASS.

## Compose, do not fork

Existing `opsbrain/`, Agent Orchestrator V4, Advanced Compute Fabric, LA-28 / LA-32A / LA-46 / LA-60S remain the planes to compose. This story names the home. It does not start LIVE adapters.

## Next stories

Keep posting to **Global operations brain** unless the story is specifically an enterprise/customer workflow, long-range engineering R&D, or a mobile/product UI surface.

An agent screenshot that says “Agent encountered an error” is not repository damage. Retry that individual task; do not repost the entire queue.

## Docs-only gate

`LOCAL = GITHUB` after park push; `GITLAB = BLOCKED` if unverifiable; `TREE = CLEAN`; **DEPLOYMENT_STATE=QUEUED**. Never infer PASS.
