# 62L-EP2 — Cross-Vendor Capability Graph Report

Status: **IMPLEMENTATION COMPLETE ON CHILD BRANCH** — unit tests **executed** — denial tests **PASS** — **NOT** production authorization — **NO** tip-land / PR / ManagePullRequest / proprietary-IP ingest / hidden CoT storage

Date: 2026-09-09  
Branch: `cursor/62l-ep2-cross-vendor-capability-graph-4059`  
Tip SHA: _(filled after commit)_  
Base: `cursor/62l-ep1-virtual-chip-contract-4059` @ `a02ba70c85ca369c228f122901a4623a6b4c411d`  
Predecessor: EP1 Virtual Chip Contract **PRESENT**  
SoT: **GitHub #160** / **62L-EP** family — *62L-EP2 Cross-Vendor Capability Graph*  
Note: `gh issue view 160` unresolved in this agent environment; issue number retained from founder SoT statement.  
GitLab mirror: **not resolved** (GitLab MCP `needsAuth`; **no issue number invented**)

## Honesty banner

`DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`

- `L4_AUTONOMY_ENABLED=false`
- **Public documentation ≠ XIV runtime verification**
- **DOCUMENTED ≠ DETECTED ≠ SUPPORTED ≠ VERIFIED**
- Example ladder: vendor docs → **DOCUMENTED**; ASUS exposes hardware → **DETECTED**; XIV loads model via intended EP → **VERIFIED**
- Proprietary-IP boundary: no leaked schematics, firmware keys, confidential designs, trade secrets, private source, or restricted eng data
- Neural edges strengthen on verified benchmarks; weaken to **STALE** / **REGRESSED** on regression
- No hidden chain-of-thought — structured evidence and outcomes only
- Agents return evidence to Home Base; **no automatic authority**
- Guardian/RLS/tenant/Universe isolation unchanged
- DB candidates **NOT_APPLIED**
- Tip-land / PR / ManagePullRequest / prod deploy: **NO**

## Core graph (encoded)

`Vendor → Chip Family → Device → Runtime → Model Support → Precision → Benchmark → Workload → Result → Lesson`

## Vendors (initial coverage)

AMD | NVIDIA | Intel | Apple | Qualcomm | other documented accelerator vendors

## Capability node fields (20)

`vendor`, `productFamily`, `deviceModel`, `deviceType`, `architecture`, `generation`, `memory`, `supportedPrecisions`, `documentedRuntimes`, `executionProviders`, `operatingSystems`, `modelCompatibility`, `workloadStrengths`, `knownLimitations`, `powerEnergyProxy`, `benchmarkEvidence`, `source`, `sourceDate`, `verificationState`, `lastTestedAt`

## Evidence states

`DOCUMENTED` | `DETECTED` | `SUPPORTED` | `VERIFIED` | `DEGRADED` | `NOT_TESTED` | `UNAVAILABLE`

## Historical semiconductor learning

`process node → architecture → packaging → memory → software ecosystem → workload performance → supply-chain context`

## Soft-wire (presence ≠ VERIFIED)

| Target | Soft-wire on EP1 tip |
| --- | --- |
| EP1 Virtual Chip Contract + report | **PRESENT** |
| EO11 Virtual Data Warehouse | **PRESENT** |
| EM (#157) Agent Compute Home Base | **PRESENT** |

## Deliverables (`services/ai/local-brain/**`)

| File | Role |
| --- | --- |
| `cross-vendor-capability-graph-types.ts` | vendors, fields, evidence states, locks, soft-wire |
| `cross-vendor-capability-graph-runtime.ts` | register/label/neural/IP deny surfaces + cycle |
| `cross-vendor-capability-graph.ts` | public facade |
| `phase62lep2.test.ts` | denial + honesty tests |
| `docs/operations/62L_EP2_CROSS_VENDOR_CAPABILITY_GRAPH_REPORT.md` | this report |

## Autonomy / truth / IP denies (tested)

| Deny | Result |
| --- | --- |
| Equate DOCUMENTED with VERIFIED | → **DENIED** |
| VERIFIED without XIV runtime evidence | → **DENIED** |
| Forbidden IP ingest (schematics/keys/secrets/…) | → **DENIED** |
| Keep REGRESSED edge as VERIFIED | → **DENIED** |
| Hidden chain-of-thought storage | → **DENIED** |
| Bind production route from advisory answer | → **DENIED** |
| L4 autonomy | `L4_AUTONOMY_ENABLED=false` |

## Tests

```bash
cd services/ai && npm run test:62lep2
```

| Command | Result |
| --- | --- |
| `npm run test:62lep2` | **PASS** — vendors/path/fields; DOCUMENTED≠VERIFIED; IP boundary; neural STALE/REGRESSED; EP1 soft-wire |

## Next (report only — do not implement)

**EP3 — Chip Research Agent Team** — specialized semiconductor, compiler/runtime, memory, packaging, power, manufacturing, and supply-chain research agents that feed verified knowledge back into the Virtual Chip brain.

## Tip-land / PR

- Tip-land onto `xiv-v2` / `main`: **NO**
- Pull request / ManagePullRequest: **NOT CREATED**
