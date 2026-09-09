# 62L-EL7 — Windows Local Runtime Adapter Report

## Summary

Governed `runLocalInference(request)` adapter under `services/ai/local-runtime/**` with soft-wired policy deny-hooks, truthful LOCAL/HYBRID/CLOUD labeling, CPU-safe fallback routing, GPU/NPU default **NOT_TESTED**, resource-governor reject, and **UNAVAILABLE** (never pretend success) when measured inference evidence is absent.

## Branch / Base

| Field | Value |
| --- | --- |
| Branch | `cursor/62l-el7-windows-local-runtime-adapter-4059` |
| Predecessor (preferred) | `cursor/62l-el6-amd-npu-capability-candidate-4059` |
| Base SHA | `d36b38852efbe35c0d342255be77084c444a1fe0` (EL6 tip; includes EL5 `32bcbc36542742e17a32cd7f1075eb1801eb222c` + EM) |
| Tip SHA | _(filled after push)_ |
| Rebase | **yes** — rebased EL7 onto latest origin EL6 tip |

## Core flow

`Agent request → Policy check → Local Runtime Adapter → Verified execution provider → Model inference → Evidence → Result`

## Deliverables

| Item | Path / command | Status |
| --- | --- | --- |
| Adapter | `services/ai/local-runtime/inference-adapter.ts` (`runLocalInference`) | Encoded |
| Policy soft-wire | `services/ai/local-runtime/inference-policy.ts` | Encoded |
| Provider registry | `services/ai/local-runtime/execution-providers.ts` | Encoded |
| Locks | `services/ai/local-runtime/el7-locks.ts` (`L4_AUTONOMY_ENABLED=false`) | Encoded |
| Tests | `npm run test:62lel7` + `npm run test:local-runtime` | See results below |
| Report | `docs/operations/62L_EL7_WINDOWS_LOCAL_RUNTIME_ADAPTER_REPORT.md` | This file |

## Governance invariants

- `L4_AUTONOMY_ENABLED=false`
- Never auto-download models without explicit authorization channel
- Never auto-install drivers/runtimes
- Never bypass **auth.ts**, **Guardian**, **RLS**, **tenant**, or **Universe** (soft-wire deny when signals absent)
- Preserve EL heartbeat / resource-governor / probe / EL5–EL6 invariants
- Prefer **VERIFIED** providers only; GPU/NPU stay **NOT_TESTED** until measured evidence
- Fall back safely to CPU for routing; return **UNAVAILABLE** if inference cannot truthfully succeed
- Distinguish **LOCAL** / **HYBRID** / **CLOUD** truthfully
- **No unrun test is a PASS**

## Evidence record fields

Each response `evidence` includes: model ID/version, execution provider, start/end time, latency, status, failure class, provider state, execution mode, measured-evidence flag.

## Verification gate

**VERIFIED** requires actual model load + successful bounded inference on that provider **and** `measuredEvidencePresent=true` on the registry entry. Unit tests that claim VERIFIED without that fixture boundary are denied (`VERIFIED_SKIP_DENIED`). Default paths remain **NOT_TESTED** / **UNAVAILABLE**.

## Test results (executed post-rebase)

| Suite | Command | Result |
| --- | --- | --- |
| EL7 adapter | `npm run test:62lel7` | **PASS** (11/11 executed) |
| Local-runtime regression | `npm run test:local-runtime` | **PASS** (55/55 executed; EL6+EL5+EM+EL7+probe) |

## VERIFIED skip

**Denied** in default/unit paths without measured-evidence fixture boundaries.

## Next (do not implement)

**EL8 — Model-Load Evidence** — define exact proof required before a local model/provider graduates to VERIFIED.
