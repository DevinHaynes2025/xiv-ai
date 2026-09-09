# Enterprise OS — depends on XIV-GOB-166

Status: **POINTER ONLY.** This is not a second copy of the AMD / CPU-GPU-NPU / message bus / task graph / Home Base story.

**Canonical story:** [`xiv-gob-166-core-compute-agent-infrastructure.md`](./xiv-gob-166-core-compute-agent-infrastructure.md) (Global operations brain)

**Routing rule:** [`xiv-work-surface-routing.md`](./xiv-work-surface-routing.md)

## Rule

```
Enterprise OS
  → Depends on #166
  → enterprise-specific usage of that infrastructure
```

Enterprise operating system remains the right section for **enterprise-specific work**: organizations, ERP/CRM, contracts, government, pricing, CFO/COO, supply chain, industry packs.

Enterprise OS **must not** grow a private:

- AMD software-acceleration brain
- CPU/GPU/NPU router
- message bus
- task graph
- Home Base receipt ledger

Those stay in Global operations brain (#166). Enterprise workflows **call** them under tenant, Universe, organization, purpose, rights, and budget.

## Allowed enterprise usage (later, when authorized)

- Organization-scoped compute budgets on the shared router
- ERP/CRM/contract workers publishing to the shared message bus
- Government / industry packs submitting task-graph nodes (Guardian-first; graph ≠ execute)
- CFO/COO / supply-chain views of Home Base receipts (receipt ≠ settlement)

## Honesty

ENTERPRISE OS ≠ SEPARATE AMD BRAIN. GOVERNMENT PACK ≠ SEPARATE COMPUTE BRAIN. INDUSTRY PACK ≠ UNRESTRICTED ROUTER. L4 DISABLED.

Do not duplicate the #166 document here.
