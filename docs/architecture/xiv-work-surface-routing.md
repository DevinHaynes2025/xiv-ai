# XIV work-surface routing

Status: **CANONICAL ROUTING RULE** — does not implement any story.
Branch: `xiv-v2` (never `main`; never force-push)

One rule so XIV does not fragment into separate AMD, enterprise, mobile, and government brains.

Post the **next story to Global operations brain** unless it is specifically an enterprise/customer workflow, long-range engineering R&D, or a mobile/product UI surface.

## Surfaces

| Surface | Owns | Does not own |
|---------|------|----------------|
| **Global operations brain** | Shared core used by every XIV surface: agents, Home Base, CPU/GPU/NPU routing, hybrid cloud, orchestration, neural pathways, security, compute graph, message bus, task graph, Home Base receipts | Enterprise ERP/CRM workflows; consumer UI chrome; long-range photonics/quantum research programs |
| **Enterprise operating system** | Enterprise-specific usage: organizations, ERP/CRM, contracts, government, pricing, CFO/COO, supply chain, industry packs | A second AMD / CPU-GPU-NPU / message-bus / Home Base brain |
| **Engineering civilization architecture** (2I-LA-61N V740) | Long-range architecture and R&D: software factories, ADRs, chip *compatibility research*, photonics, quantum research, space/edge simulations | Operational CPU/GPU/NPU routing used at runtime by every surface |
| **Mobile / product** | UI, onboarding, consumer and employee experiences | Core compute routing, message bus, or Home Base ledger |

## Pattern

```
Global Operations Brain
  → #166 Core Compute / Agent Infrastructure   (canonical)

Enterprise OS
  → Depends on #166
  → enterprise-specific usage of that infrastructure

Engineering civilization (2I-LA-61N)
  → Depends on #166 for operational compute / bus / task graph / Home Base
  → keeps R&D, factories, ADRs, chip-compatibility research

Mobile / product
  → Depends on #166
  → UI and onboarding only
```

**Do not copy the full #166 story into Enterprise OS, Engineering civilization, or Mobile.** Reference the canonical file.

## Canonical #166

- Architecture: [`xiv-gob-166-core-compute-agent-infrastructure.md`](./xiv-gob-166-core-compute-agent-infrastructure.md)
- Queue: [`../queue/XIV-GOB-166-core-compute-agent-infrastructure.md`](../queue/XIV-GOB-166-core-compute-agent-infrastructure.md)
- Enterprise depends-on: [`xiv-enterprise-os-depends-on-gob-166.md`](./xiv-enterprise-os-depends-on-gob-166.md)
- Queued lock: [`../../services/ai/runtime/queued/xiv-gob-166.ts`](../../services/ai/runtime/queued/xiv-gob-166.ts)

## Honesty

- AMD DETECTED ≠ OPTIMIZED. AMD ADAPTER ≠ PARTNERSHIP.
- MESSAGE BUS ≠ AUTHORITY. TASK GRAPH ≠ PRODUCTION EXECUTE.
- HOME BASE RECEIPT ≠ SETTLEMENT. HOME BASE ≠ COMPANY ROOT.
- ENTERPRISE OS ≠ SEPARATE AMD BRAIN. MOBILE UI ≠ COMPUTE ROUTER.
- ENGINEERING R&D ≠ OPERATIONAL ROUTER.
- L4 DISABLED. All `AUTO_*` FALSE. NEVER INFER PASS.

An agent **Retry** error on a screenshot is not repository damage. Retry the individual task; do not repost the entire queue.
