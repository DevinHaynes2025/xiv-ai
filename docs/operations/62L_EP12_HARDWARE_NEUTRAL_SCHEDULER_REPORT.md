# 62L-EP12 — Hardware-Neutral Scheduler Report

Status: **IMPLEMENTATION COMPLETE ON CHILD BRANCH** — unit tests **executed** — denial tests **PASS** — **NOT** production authorization — **NO** tip-land / PR / ManagePullRequest / privacy-for-performance trade / autonomous cloud purchase

Date: 2026-09-09  
Branch: `cursor/62l-ep12-hardware-neutral-scheduler-4059`  
Tip SHA: `818b76d1eefbf3698ab7cb6c64f214174a58de7d`  
Base: `cursor/62l-ep10-other-accelerator-registry-4059` @ `60d50a77f367d50d70a8f6e7e8f30a1fd8a612e0`  
Predecessor: EP10 **PRESENT**; EP11 Task Envelope **WAITING_DATA** (not landed on remote)  
SoT: **GitHub #160** / **62L-EP** family — *62L-EP12 Hardware-Neutral Scheduler*  
Note: `gh issue view 160` unresolved in this agent environment; issue number retained from founder SoT statement.  
GitLab mirror: **not resolved** (GitLab MCP `needsAuth`; **no issue number invented**)

## Honesty banner

`DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`

- `L4_AUTONOMY_ENABLED=false`
- Vendor-neutral scoring — no hard-coded vendor preference
- Classical explainable score: `compatibility + privacy + reliability + performance - cost - resourcePressure - networkRisk`
- Weights configurable by organization/mission
- `NOT_TESTED` cannot satisfy `VERIFIED` routes
- Stale heartbeat → unavailable for new work
- Silent accelerator fallback must be recorded
- Privacy/security cannot be traded for performance
- `LOCAL_ONLY` cannot leave enrolled device for cloud speed
- Cost ceilings are hard constraints
- Agents cannot increase budgets via scheduling
- No safe route → **UNAVAILABLE** (not forced)
- Learning loop feeds Benchmark Memory; cannot self-expand permissions
- Quantum claims require classical-baseline gate
- No autonomous provisioning / cloud purchasing
- Guardian/RLS/tenant/Universe isolation unchanged
- DB candidates **NOT_APPLIED**
- Tip-land / PR / ManagePullRequest / prod deploy: **NO**

## Core flow

`Task Envelope → Policy Gate → Eligible Nodes → Capability Match → Resource Check → Route Score → Execute → Compute Receipt → XIV Home Base`

## Route states

`ELIGIBLE` | `PREFERRED` | `DEGRADED` | `THROTTLED` | `NOT_ELIGIBLE` | `STALE` | `WAITING_NODE` | `UNAVAILABLE`

## Soft-wire (presence ≠ VERIFIED)

| Target | Soft-wire on EP10 tip |
| --- | --- |
| EP11 Virtual Instruction / Task Envelope | **WAITING_DATA** / absent |
| EP10 Other Accelerator Registry + report | **PRESENT** |
| EP6 Local Hardware Truth Probe v2 + report | **PRESENT** |
| EP5 Public Benchmark Memory + report | **PRESENT** |
| EP1 Virtual Chip Contract + report | **PRESENT** |
| EM (#157) Agent Compute Home Base | probe (boolean) |

## Deliverables (`services/ai/local-brain/**`)

| File | Role |
| --- | --- |
| `hardware-neutral-scheduler-types.ts` | score dims, states, locks, soft-wire |
| `hardware-neutral-scheduler-runtime.ts` | schedule/score/deny + cycle |
| `hardware-neutral-scheduler.ts` | public facade |
| `phase62lep12.test.ts` | denial + honesty tests |
| `docs/operations/62L_EP12_HARDWARE_NEUTRAL_SCHEDULER_REPORT.md` | this report |

## Autonomy / routing denies (tested)

| Deny | Result |
| --- | --- |
| NOT_TESTED wins VERIFIED route | → **DENIED** |
| LOCAL_ONLY silent cloud move | → **DENIED** |
| Privacy traded for performance | → **DENIED** |
| Soft cost ceiling / budget increase | → **DENIED** |
| Force execute without safe route | → **DENIED** |
| Omit silent fallback record | → **DENIED** |
| Autonomous provision / cloud purchase | → **DENIED** |
| Quantum without classical baseline | → **DENIED** |
| Scheduler self-expand permissions | → **DENIED** |
| L4 autonomy | `L4_AUTONOMY_ENABLED=false` |

## Tests

```bash
cd services/ai && npm run test:62lep12
```

| Command | Result |
| --- | --- |
| `npm run test:62lep12` | **PASS** — LOCAL_ONLY routing; NOT_TESTED/stale/cost gates; UNAVAILABLE; EP11 WAITING_DATA; EP10/EP6/EP5/EP1 PRESENT |

## Next (report only — do not implement)

**EP13 — Runtime Return Receipt** — record exactly which device/runtime/model actually handled each task and feed that verified outcome back into Home Base.

## Tip-land / PR

- Tip-land onto `xiv-v2` / `main`: **NO**
- Pull request / ManagePullRequest: **NOT CREATED**
