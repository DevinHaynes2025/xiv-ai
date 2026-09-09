# 62L-EP6 — Local Hardware Truth Probe v2 Report

Status: **IMPLEMENTATION COMPLETE ON CHILD BRANCH** — unit tests **executed** — denial tests **PASS** — **NOT** production authorization — **NO** tip-land / PR / ManagePullRequest / UNKNOWN→VERIFIED jump / personal-data inspection

Date: 2026-09-09  
Branch: `cursor/62l-ep6-local-hardware-truth-probe-v2-4059`  
Tip SHA: *(pending commit — will align after push)*  
Base: `cursor/62l-ep5-public-benchmark-memory-4059` @ `ebffa2e96053a9070bfd61af2f4800c4dc889754`  
Predecessor: EP5 Public Benchmark Memory **PRESENT**; EP3 **WAITING_DATA** (not landed)  
SoT: **GitHub #160** / **62L-EP** family — *62L-EP6 Local Hardware Truth Probe v2*  
Note: `gh issue view 160` unresolved in this agent environment; issue number retained from founder SoT statement.  
GitLab mirror: **not resolved** (GitLab MCP `needsAuth`; **no issue number invented**)

## Honesty banner

`DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`

- `L4_AUTONOMY_ENABLED=false`
- Device states never jump **UNKNOWN → VERIFIED**
- **DETECTED ≠ VERIFIED**; **SUPPORTED ≠ VERIFIED**; **NOT_TESTED ≠ VERIFIED**
- Seeing an AMD CPU **≠** AMD NPU exists
- Seeing a Radeon GPU **≠** Windows ML/ONNX works
- Installed runtime packages **≠** model compatibility
- **VERIFIED** requires actual bounded model inference or benchmark on that exact path
- CPU / GPU / NPU independently classified
- Accelerator fallbacks visible
- Evidence timestamped; stale profiles stop influencing verified scheduling
- Fresh heartbeat required for `RUNNING_VERIFIED`; sleep → `WAITING_NODE`; shutdown → `OFFLINE_STOPPED`
- Read-only technical metadata only — no personal files, credentials, precise location
- Probe output feeds: ASUS Node → Virtual Chip Registry → Benchmark Memory → Workload Router → Agent Compute Decisions
- Guardian/RLS/tenant/Universe isolation unchanged
- DB candidates **NOT_APPLIED**
- Tip-land / PR / ManagePullRequest / prod deploy: **NO**

## Probe fields (13, read-only)

`windowsVersionBuild`, `systemArchitecture`, `cpuVendorModel`, `logicalPhysicalCoreCounts`, `installedRam`, `gpuVendorModel`, `gpuMemory`, `npuPresence`, `storageCapacityFreeSpaceXivPaths`, `availableExecutionRuntimeProviders`, `powerBatteryState`, `xivRuntimeHeartbeat`, `timestamp`

## Truth states

Progression: `UNKNOWN` → `DETECTED` → `SUPPORTED` → `VERIFIED`  
Adjacent: `NOT_TESTED` | `DEGRADED` | `UNAVAILABLE` | `STALE`

## Machine evidence surfaces (conceptual ASUS profile)

| Surface | Example state |
| --- | --- |
| CPU | DETECTED |
| AMD GPU | DETECTED |
| NPU | UNKNOWN / DETECTED |
| Windows ML | SUPPORTED / NOT_TESTED |
| CPU inference | VERIFIED only after bounded run |
| GPU inference | NOT_TESTED |
| NPU inference | NOT_TESTED |

## Soft-wire (presence ≠ VERIFIED)

| Target | Soft-wire on EP5 tip |
| --- | --- |
| EP5 Public Benchmark Memory + report | **PRESENT** |
| EP4 Proprietary-IP Firewall + report | **PRESENT** |
| EP1 Virtual Chip Contract + report | **PRESENT** |
| EP3 Chip Research Agent Team | **WAITING_DATA** / absent |
| EM (#157) Agent Compute Home Base | probe (boolean) |

## Deliverables (`services/ai/local-brain/**`)

| File | Role |
| --- | --- |
| `local-hardware-truth-probe-types.ts` | fields, states, locks, soft-wire |
| `local-hardware-truth-probe-runtime.ts` | profile/advance/deny surfaces + cycle |
| `local-hardware-truth-probe.ts` | public facade |
| `phase62lep6.test.ts` | denial + honesty tests |
| `docs/operations/62L_EP6_LOCAL_HARDWARE_TRUTH_PROBE_V2_REPORT.md` | this report |

## Autonomy / privacy / truth denies (tested)

| Deny | Result |
| --- | --- |
| UNKNOWN → VERIFIED jump | → **DENIED** |
| VERIFIED without bounded inference/benchmark | → **DENIED** |
| AMD CPU implies AMD NPU | → **DENIED** |
| Radeon implies Windows ML works | → **DENIED** |
| Packages imply model compatibility | → **DENIED** |
| Stale influences verified scheduling | → **DENIED** |
| Available without fresh heartbeat | → **DENIED** |
| Personal files / credentials / precise location | → **DENIED** |
| Agent auto-authority / recommend=act | → **DENIED** |
| L4 autonomy | `L4_AUTONOMY_ENABLED=false` |

## Tests

```bash
cd services/ai && npm run test:62lep6
```

| Command | Result |
| --- | --- |
| `npm run test:62lep6` | **PASS** — progression gates; independent CPU/GPU/NPU; heartbeat/stale; privacy denies; EP5/EP4/EP1 soft-wire PRESENT |

## Next (report only — do not implement)

**EP7 — AMD Adapter Research Path** — connect the verified ASUS hardware profile to Windows ML/ONNX Runtime candidates and begin measuring which AMD CPU/GPU/NPU execution paths actually work.

## Tip-land / PR

- Tip-land onto `xiv-v2` / `main`: **NO**
- Pull request / ManagePullRequest: **NOT CREATED**
