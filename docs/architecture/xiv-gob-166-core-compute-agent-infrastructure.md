# XIV-GOB-166 — Core Compute / Agent Infrastructure

**Status:** **QUEUED ARCHITECTURE — NOT IMPLEMENTED.** Canonical story lives in **Global operations brain**. Do not copy this document into Enterprise OS, Engineering civilization, or Mobile.
**Home:** Global operations brain
**Depends-on (consumers):** Enterprise OS · Engineering civilization (2I-LA-61N) · Mobile / product
**Branch:** `xiv-v2` (never `main`). Park: `cursor/queue-gob-166-core-compute-infra-d8c0`. Never force-push. Never push `main`.
**L4_AUTONOMY_ENABLED = FALSE.** All `AUTO_*` FALSE.

Routing rule: [`xiv-work-surface-routing.md`](./xiv-work-surface-routing.md)

> Shared core used by **every** XIV surface. AMD software acceleration, CPU/GPU/NPU routing, message bus, task graph, and Home Base receipts are **one** infrastructure plane — not four brains.

---

## 1. Mission

Define the governed **Core Compute / Agent Infrastructure** so agents, Home Base, hybrid cloud, orchestration, neural pathways, and security share one CPU/GPU/NPU router, one message bus, one task graph, and one Home Base receipt ledger.

This is operational infrastructure, not an enterprise workflow and not a long-range R&D program.

DEPLOYMENT_STATE=QUEUED. No LIVE AMD claim. No production bus. No production task-graph execute.

---

## 2. Canonical components

| Component | Contract | Honesty |
|-----------|----------|---------|
| AMD software acceleration | `AmdSoftwareAccelerationAdapterV100` | DETECTED ≠ SUPPORTED ≠ OPTIMIZED. AMD ≠ partnership. Do not clone proprietary kernels. |
| CPU / GPU / NPU routing | `CpuGpuNpuRouterV100` | Hardware ≠ authority. NPU detected ≠ model compatible. Placement ≠ permission. |
| Message bus | `XivMessageBusV100` | Bus ≠ authority. Delivery ≠ truth. Tenant / Universe isolation required. |
| Task graph | `XivTaskGraphV100` | Graph ≠ production execute. Consensus ≠ evidence. Guardian-first. Compose existing Agent Orchestrator V4; do not fork a second orchestrator. |
| Home Base receipts | `HomeBaseReceiptLedgerV100` | Receipt ≠ settlement. Receipt ≠ company root. Phone Home Base ≠ engineering root. |

Compose existing planes rather than replacing them: `services/ai/runtime/opsbrain/` (Global Operations Brain) · `nightshift/compute-fabric.ts` (CPU/GPU/NPU backends) · `osfund/orchestrator.ts` (task graph V4) · LA-28 / LA-32A / LA-46 / LA-60S (queued compute and operations docs).

**This commit does not start those runtimes.** It names the single home so later agents do not build parallel AMD/enterprise/mobile/government brains.

---

## 3. Core loop

```
SIGNAL → IDENTITY → TENANT → UNIVERSE → PURPOSE → CLASSIFICATION
  → RIGHTS → AUTHORITY → BUDGET → TASK GRAPH → COMPUTE ROUTE
  → (CPU | GPU | NPU | HYBRID CLOUD)
  → MESSAGE BUS → HOME BASE RECEIPT → OBSERVE → LEARN
```

Write path never skipped:

```
AGENT → LOCK → ROUTE → EXECUTE CANDIDATE → RECEIPT → VALIDATE
```

SAME FILE PARALLEL WRITE DEFAULT = FALSE. SAME TASK PARALLEL ROOT DEFAULT = FALSE.

---

## 4. What this is not

- Not Enterprise ERP/CRM, contracts, government, pricing, CFO/COO, supply chain, or industry packs.
- Not 2I-LA-61N software factories, ADRs, or quantum/photonics research programs.
- Not mobile onboarding or consumer UI.
- Not a LIVE AMD/NVIDIA/Apple deployment.
- Not L4. Not auto production deploy. Not cloud root. Not database root.

---

## 5. Consumers (reference, do not copy)

| Consumer | How it uses #166 |
|----------|------------------|
| **Enterprise OS** | Org-scoped budgets, ERP/CRM workers, government packs ride the shared bus and router. See [`xiv-enterprise-os-depends-on-gob-166.md`](./xiv-enterprise-os-depends-on-gob-166.md). |
| **Engineering civilization (61N)** | Chip-compatibility *research* and GPU engineering labs remain 61N. Operational routing used by running agents is #166. |
| **Mobile / product** | Home Base screens display receipts from the #166 ledger. UI ≠ ledger. PHONE ≠ ROOT. |

---

## 6. Feature flags (all FALSE)

```
GOB_166_CORE_COMPUTE_INFRA_ENABLED=false
AMD_SOFTWARE_ACCELERATION_ENABLED=false
CPU_GPU_NPU_ROUTER_V100_ENABLED=false
XIV_MESSAGE_BUS_V100_ENABLED=false
XIV_TASK_GRAPH_V100_ENABLED=false
HOME_BASE_RECEIPT_LEDGER_ENABLED=false
AUTO_PRODUCTION_COMPUTE_ROUTE=false
AUTO_PRODUCTION_TASK_EXECUTE=false
AUTO_AMD_OPTIMIZED_CLAIM=false
L4_AUTONOMY_ENABLED=false
```

---

## 7. Permanent invariants

AMD DETECTED ≠ OPTIMIZED. GPU PROVIDER ≠ PARTNERSHIP. NPU DETECTED ≠ MODEL COMPATIBLE. MESSAGE BUS ≠ AUTHORITY. TASK GRAPH ≠ PRODUCTION EXECUTE. HOME BASE RECEIPT ≠ SETTLEMENT. HOME BASE ≠ COMPANY ROOT. ENTERPRISE OS ≠ SEPARATE COMPUTE BRAIN. MOBILE UI ≠ ROUTER. ENGINEERING R&D ≠ OPERATIONAL ROUTER. MORE COMPUTE ≠ MORE AUTHORITY. L4 DISABLED.

UNKNOWN IS VALID. NEVER INFER PASS.

---

## 8. Implementation slices (none start here)

1. Routing rule published (this park).
2. CpuGpuNpuRouterV100 contracts on opsbrain (later).
3. Message bus tenant/Universe isolation.
4. Task graph compose with Orchestrator V4.
5. Home Base receipt ledger (not settlement).
6. AMD adapter NOT_CONFIGURED → evidence gate.
7. Enterprise OS consumer wiring (depends-on only until authorized).
8. Mobile Home Base display of receipts.
9. Exact-commit validation.

**No slice starts in this commit except slice 1 (docs + invariant lock).**

---

## Completion rule

Documentation plus a queued lock ≠ implemented AMD acceleration, ≠ LIVE router, ≠ production bus.

**XIV-GOB-166 = QUEUED ARCHITECTURE — NOT IMPLEMENTED.** Canonical home remains Global operations brain.
