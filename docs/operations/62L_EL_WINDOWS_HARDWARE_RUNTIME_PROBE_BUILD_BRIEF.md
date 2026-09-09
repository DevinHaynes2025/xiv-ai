# 62L-EL Windows Hardware & Runtime Probe — Bounded Build Brief

## Purpose
Establish truthful local runtime evidence for XIV AI on a Windows/ASUS machine before any AMD CPU/GPU/NPU, offline-agent, local-model, or Microsoft-tool integration claim is promoted to VERIFIED.

## Non-Negotiable Governance
- L4_AUTONOMY_ENABLED=false.
- Guardian/RLS/tenant/Universe isolation must not be weakened.
- No production deploys, merges to main, database migrations, cloud purchases, permission expansion, external commitments, or autonomous consequential actions.
- High-consequence actions remain human-authorized.
- No stealth persistence, privilege escalation, arbitrary process control, credential capture, or hidden chain-of-thought storage.

## Current Repository Mapping
Use the existing `services/ai` service as the first integration target.

Existing relevant files:
- `services/ai/agent-router.ts` — agent routing/orchestration entry point.
- `services/ai/model-router.ts` — model/provider routing entry point.
- `services/ai/diagnostics.ts` — safe diagnostics and redaction patterns.
- `services/ai/audit.ts` — audit/event integration candidate.
- `services/ai/auth.ts` — authorization boundary candidate.
- `services/ai/persistence.ts` — bounded persistence candidate.
- `services/ai/index.ts` — export surface.
- `services/ai/package.json` — TypeScript service package.

## Safest New Candidate Files
Do not create these on main until implementation is explicitly authorized. Candidate structure:

- `services/ai/local-runtime/types.ts`
- `services/ai/local-runtime/hardware-probe.ts`
- `services/ai/local-runtime/windows-capabilities.ts`
- `services/ai/local-runtime/runtime-state.ts`
- `services/ai/local-runtime/onnx-runtime-adapter.ts`
- `services/ai/local-runtime/workload-router.ts`
- `services/ai/local-runtime/resource-governor.ts`
- `services/ai/local-runtime/heartbeat.ts`
- `services/ai/local-runtime/benchmark.ts`
- `services/ai/local-runtime/index.ts`
- `services/ai/local-runtime/__tests__/hardware-probe.test.ts`
- `services/ai/local-runtime/__tests__/workload-router.test.ts`
- `services/ai/local-runtime/__tests__/resource-governor.test.ts`
- `services/ai/local-runtime/__tests__/runtime-state.test.ts`

## Truth-State Contract
Hardware and runtime claims must use explicit states:

- UNKNOWN
- DETECTED
- SUPPORTED
- VERIFIED
- DEGRADED
- UNAVAILABLE
- NOT_TESTED
- WAITING_NODE
- OFFLINE_STOPPED

`VERIFIED` requires fresh runtime evidence, not configuration alone.

## Hardware Probe Contract
Collect only local machine capability metadata needed for scheduling:
- OS/version/build
- architecture
- CPU vendor/model/logical cores
- RAM total/available
- GPU adapters and memory where available
- NPU presence where the OS/runtime exposes it
- storage capacity/free space for approved runtime locations
- battery/AC state where available
- thermal/power state only through documented local APIs where permitted

Do not collect unrelated user files, browser history, credentials, device identifiers unnecessary to scheduling, or private content.

## Runtime Verification Contract
For each execution target, separate:
1. DETECTED — hardware/device is visible.
2. SUPPORTED — runtime/provider documentation and installed software indicate compatibility.
3. VERIFIED — a bounded probe or model inference actually completed.
4. DEGRADED — path works but violates target performance/reliability thresholds.
5. UNAVAILABLE — cannot be used in current environment.

Do not infer VERIFIED from DETECTED/SUPPORTED.

## Classical Benchmark First
Before any quantum-inspired or advanced scheduling method is promoted, build deterministic classical baselines for:
- task assignment
- batching
- queue priority
- resource allocation
- route selection
- latency/cost tradeoffs

Minimum baseline families:
- FIFO / priority queue
- greedy assignment
- weighted scoring
- shortest-path / graph search where applicable
- linear/integer optimization candidate where appropriate

## Quantum Research Boundary
Quantum work remains isolated from production runtime routing.

Evidence classes:
- THEORETICAL
- SIMULATED
- QUANTUM_INSPIRED
- PHYSICAL_QPU_VERIFIED

A quantum-inspired scheduler may only be described as better if it is reproducibly compared against strong classical baselines on the same data, metric, budget, and stop condition.

## Offline Agent Boundary
Offline agents may only run on explicitly enrolled powered nodes. Allowed activities:
- index approved local knowledge packs
- summarize approved documents
- run sandbox benchmarks
- prepare code/test candidates
- evaluate candidate skills
- produce structured lessons and checkpoints

Disallowed without explicit human authorization:
- production mutation
- permission changes
- purchases
- external publication
- customer-data ingestion
- contracts/payments
- OS-level takeover
- unrestricted replication

## Microsoft Tool Bridge — Candidate Scope
Treat every Microsoft integration independently. Candidate adapters may cover:
- Windows local APIs
- PowerShell scripts with constrained allowlists
- VS Code / repository workflows
- Git
- Edge/WebView surfaces
- Azure developer tools
- Microsoft 365/Graph-backed workflows when explicit credentials/scopes are authorized

Installed/configured/authorized/verified are distinct states.

## Acceptance Criteria
A first bounded implementation is acceptable when all of the following are evidenced:
1. TypeScript typecheck passes for the new local-runtime module.
2. Hardware probe returns structured truth states without secrets/private-content collection.
3. CPU fallback path is deterministic and testable.
4. GPU/NPU paths remain NOT_TESTED or UNAVAILABLE unless a real local probe succeeds.
5. Runtime heartbeat changes stale agents to WAITING_NODE/OFFLINE_STOPPED rather than claiming continuous work.
6. Resource governor enforces configured CPU/RAM/concurrency ceilings in tests.
7. Workload router never chooses a provider marked UNAVAILABLE/NOT_TESTED for a required capability.
8. Diagnostics redact secrets using existing safe patterns.
9. No Guardian/RLS/auth bypass is introduced.
10. No production database, cloud, or deployment mutation occurs.

## Test Evidence Required
Do not mark tests PASS unless actually run.

Candidate commands once implementation exists:
- `cd services/ai && npm run typecheck`
- local unit-test command once a test runner is added/configured
- bounded hardware probe command on the ASUS device
- bounded ONNX/local model inference probe if a compatible runtime/model is installed

Record exact command, timestamp, machine state, result, failure class, and artifact/log reference.

## Build Sequence
1. Add truth-state and capability types.
2. Implement read-only hardware probe.
3. Add runtime-state normalization.
4. Add heartbeat/freshness logic.
5. Add resource governor.
6. Add deterministic workload router with CPU-safe fallback.
7. Add ONNX/Windows local-runtime adapter boundary, initially NOT_TESTED unless actual provider exists.
8. Add benchmark harness for CPU baseline.
9. Add tests for state transitions, routing, ceilings, and redaction.
10. Only after local evidence exists, promote supported AMD GPU/NPU paths from NOT_TESTED to VERIFIED.

## Report Format
Every overnight/local build brief must separate:

### VERIFIED
Only evidence actually observed/run.

### PROPOSED
Designs, files, commands, algorithms, providers, and user stories not yet executed.

### BLOCKED
Missing hardware access, provider/runtime, credentials, test runner, permissions, corpus rights, or human authorization.

### NEXT SAFEST CANDIDATES
Bounded reversible work that does not mutate production or expand authority.
