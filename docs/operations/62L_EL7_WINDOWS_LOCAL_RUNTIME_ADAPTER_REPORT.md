# 62L-EL7 — Windows Local Runtime Adapter Report

## Summary

Governed `runLocalInference(request)` adapter under `services/ai/local-runtime/**` with soft-wired policy deny-hooks, truthful LOCAL/HYBRID/CLOUD labeling, CPU-safe fallback routing, GPU/NPU default **NOT_TESTED**, resource-governor reject, and **UNAVAILABLE** (never pretend success) when measured inference evidence is absent.

## Branch / Base

| Field | Value |
| --- | --- |
| Branch | `cursor/62l-el7-windows-local-runtime-adapter-4059` |
| Predecessor | `cursor/62l-el5-amd-gpu-capability-candidate-4059` (= `origin/feat/62l-el-local-runtime-probe`) |
| Base SHA | `0e7ca0930245d2c1b4cfbc41e2078e2aa8f2c502` |
| Tip SHA | `88404149878cf948f7a92ae5386440ed95725996` |
| EL6 | **absent** — branched from EL5 |

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
- Preserve EL heartbeat / resource-governor / probe router invariants
- Prefer **VERIFIED** providers only; GPU/NPU stay **NOT_TESTED** until measured evidence
- Fall back safely to CPU for routing; return **UNAVAILABLE** if inference cannot truthfully succeed
- Distinguish **LOCAL** / **HYBRID** / **CLOUD** truthfully
- **No unrun test is a PASS**

## Evidence record fields

Each response `evidence` includes: model ID/version, execution provider, start/end time, latency, status, failure class, provider state, execution mode, measured-evidence flag.

## Verification gate

**VERIFIED** requires actual model load + successful bounded inference on that provider **and** `measuredEvidencePresent=true` on the registry entry. Unit tests that claim VERIFIED without that fixture boundary are denied (`VERIFIED_SKIP_DENIED`). Default paths remain **NOT_TESTED** / **UNAVAILABLE**.

## Test results (executed)

| Suite | Command | Result |
| --- | --- | --- |
| EL7 adapter | `npm run test:62lel7` | **PASS** (11/11 executed) |
| Local-runtime regression | `npm run test:local-runtime` | **PASS** (17/17 executed; includes EL7 + EL heartbeat/router/governor) |

## VERIFIED skip

**Denied** in default/unit paths without measured-evidence fixture boundaries.

## Next (do not implement)

**EL8 — Model-Load Evidence** — define exact proof required before a local model/provider graduates to VERIFIED.
