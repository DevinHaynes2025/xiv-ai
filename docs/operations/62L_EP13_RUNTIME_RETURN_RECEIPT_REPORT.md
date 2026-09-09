# 62L-EP13 — Runtime Return Receipt Report

Status: **IMPLEMENTATION COMPLETE ON CHILD BRANCH** — unit tests **executed** — denial tests **PASS** — **NOT** production authorization — **NO** tip-land / PR / ManagePullRequest

Date: 2026-09-09  
Branch: `cursor/62l-ep13-runtime-return-receipt-4059`  
Tip SHA: *(aligned on commit)*  
Base: `cursor/62l-ep12-hardware-neutral-scheduler-4059` @ `8eaba9c6f42a34f3f5a75b2c7aa301babcd3097e`  
Predecessor: EP12 **PRESENT**  
SoT: **GitHub #160** / **62L-EP** family — *62L-EP13 Runtime Return Receipt*  
Note: `gh issue view 160` unresolved in this agent environment; issue number retained from founder SoT statement.  
GitLab mirror: **not resolved** (GitLab MCP `needsAuth`; **no issue number invented**)

## Honesty banner

`DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`

- `L4_AUTONOMY_ENABLED=false`
- Requested device and actual device always recorded separately
- CPU fallback can validate the CPU path; it **cannot** verify NPU/GPU
- Missing / malformed / stale / inconsistent receipt → **UNVERIFIED** (not silent accept)
- Receipt tenant/Universe must match originating task
- No hidden chain-of-thought in receipts
- Secrets and credentials redacted
- Final receipts are append-only audit artifacts
- Cross-tenant reuse denied by default
- Failed security/policy checks cannot be rewritten as successful inference
- High-consequence outputs still require human authorization even when compute returns PASS
- Guardian/RLS/tenant/Universe isolation unchanged
- DB candidates **NOT_APPLIED**
- Tip-land / PR / ManagePullRequest / prod deploy: **NO**

## Home Base flow

`Receipt → validation → audit → benchmark_memory → neural_compute_graph → agent_result`

## Receipt result states

`PASS` | `FAIL` | `PARTIAL` | `DEGRADED` | `TIMEOUT` | `RESOURCE_LIMIT` | `POLICY_DENIED` | `PROVIDER_UNAVAILABLE` | `MODEL_LOAD_FAILED` | `INVALID_OUTPUT` | `UNVERIFIED`

## Core truth example

```
requestedDeviceClass=npu
actualDevice=cpu
fallbackUsed=true
acceleratorVerifiedByThisReceipt=false
```

That receipt can validate the CPU path; it cannot verify the NPU.

## Soft-wire (presence ≠ VERIFIED)

| Target | Soft-wire on EP12 tip |
| --- | --- |
| EP12 Hardware-Neutral Scheduler + report | **PRESENT** |
| EP10 Other Accelerator Registry + report | **PRESENT** |
| EP5 Public Benchmark Memory + report | **PRESENT** |
| EP1 Virtual Chip Contract + report | **PRESENT** |
| EM (#157) Agent Compute Home Base | probe (boolean) |

## Deliverables (`services/ai/local-brain/**`)

| File | Role |
| --- | --- |
| `runtime-return-receipt-types.ts` | fields, states, locks, soft-wire |
| `runtime-return-receipt-runtime.ts` | emit/validate/deny + cycle |
| `runtime-return-receipt.ts` | public facade |
| `phase62lep13.test.ts` | denial + honesty tests |
| `docs/operations/62L_EP13_RUNTIME_RETURN_RECEIPT_REPORT.md` | this report |

## Autonomy / security denies (tested)

| Deny | Result |
| --- | --- |
| Verify accelerator via CPU fallback | → **DENIED** |
| Silent accept missing receipt | → **DENIED** (→ UNVERIFIED) |
| Secrets / hidden CoT in receipt | → **DENIED** |
| Mutate finalized receipt | → **DENIED** |
| Cross-tenant receipt reuse | → **DENIED** |
| Rewrite policy fail as PASS | → **DENIED** |
| Skip human for high-consequence PASS | → **DENIED** |
| L4 autonomy | `L4_AUTONOMY_ENABLED=false` |

## Tests

```bash
cd services/ai && npm run test:62lep13
```

| Command | Result |
| --- | --- |
| `npm run test:62lep13` | **PASS** — requested≠actual; fallback≠NPU verify; UNVERIFIED gates; security denies; high-consequence human auth; soft-wires PRESENT |

## Next (report only — do not implement)

**EP14 — Adaptive Benchmark Ledger** — turn these receipts into time-aware performance memory and detect when hardware, drivers, runtimes, or models improve or regress.

## Tip-land / PR

- Tip-land onto `xiv-v2` / `main`: **NO**
- Pull request / ManagePullRequest: **NOT CREATED**
