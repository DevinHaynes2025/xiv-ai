# 62L-EP16 — No Overclock / BIOS Rule Report

Status: **IMPLEMENTATION COMPLETE ON CHILD BRANCH** — unit tests **executed** — denial tests **PASS** — **NOT** production authorization — **NO** tip-land / PR / ManagePullRequest

Date: 2026-09-09  
Branch: `cursor/62l-ep16-no-overclock-bios-rule-4059`  
Tip SHA: `9f8127fa8dd4f3b40b2e7567f9776bd655b32a87`  
Base: `cursor/62l-ep15-algorithm-tuning-sandbox-4059` @ `10285a757529952012a1347c760cd0229e153458`  
Predecessor: EP15 **PRESENT**  
SoT: **GitHub #160** / **62L-EP** family — *62L-EP16 No Overclock / BIOS Rule*  
Note: `gh issue view 160` unresolved in this agent environment; issue number retained from founder SoT statement.  
GitLab mirror: **not resolved** (GitLab MCP `needsAuth`; **no issue number invented**)

## Honesty banner

`DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`

- `L4_AUTONOMY_ENABLED=false`
- Hard boundary: agents never convert software tuning into firmware / voltage / clock / thermal manipulation
- Any such request terminates with **`DENIED_HARDWARE_SAFETY_POLICY`**
- Agents may emit human-readable diagnostic recommendations only — **never execute**
- Virtual Chip improves how XIV *uses* hardware; it does **not** seize low-level control
- Portable across ASUS / AMD / NVIDIA / Intel / edge / future platforms without unsafe device management
- Guardian/RLS/tenant/Universe isolation unchanged
- DB candidates **NOT_APPLIED**
- Tip-land / PR / ManagePullRequest / prod deploy: **NO**

## Policy states

`SAFE_SOFTWARE_TUNING` | `REQUIRES_ADMIN_REVIEW` | `HARDWARE_CONTROL_DENIED` | `SECURITY_BOUNDARY_DENIED`

## Prohibited (perform or recommend-for-auto-exec)

CPU/GPU overclocking · undervolting/overvolting · BIOS/UEFI modification · firmware flashing · fan-curve override · thermal-limit bypass · power-limit override · driver replacement without human-admin · secure-boot changes · kernel/driver privilege escalation · hidden persistence for hardware control

## Allowed software layer

`batching` | `quantization` | `model_selection` | `runtime_selection` | `queue_scheduling` | `caching` | `concurrency_limits` | `local_edge_cloud_routing`

## Soft-wire (presence ≠ VERIFIED)

| Target | Soft-wire on EP15 tip |
| --- | --- |
| EP15 Algorithm Tuning Sandbox + report | **PRESENT** |
| EP14 Adaptive Benchmark Ledger + report | **PRESENT** |
| EP13 Runtime Return Receipt + report | **PRESENT** |
| EP12 Hardware-Neutral Scheduler + report | **PRESENT** |
| EM (#157) Agent Compute Home Base | probe (boolean) |

## Deliverables (`services/ai/local-brain/**`)

| File | Role |
| --- | --- |
| `no-overclock-bios-rule-types.ts` | states, prohibits, locks, soft-wire |
| `no-overclock-bios-rule-runtime.ts` | classify/deny/diagnostic + cycle |
| `no-overclock-bios-rule.ts` | public facade |
| `phase62lep16.test.ts` | denial + honesty tests |
| `docs/operations/62L_EP16_NO_OVERCLOCK_BIOS_RULE_REPORT.md` | this report |

## Autonomy / safety denies (tested)

| Deny | Result |
| --- | --- |
| Overclock / undervolt / BIOS / firmware | → **DENIED_HARDWARE_SAFETY_POLICY** |
| Fan / thermal / power limit overrides | → **DENIED_HARDWARE_SAFETY_POLICY** |
| Secure boot / privilege / hidden persistence | → **SECURITY_BOUNDARY_DENIED** |
| Driver replace without human-admin | → **REQUIRES_ADMIN_REVIEW** |
| Treat diagnostic as execute | → **DENIED** |
| Seize low-level control via Virtual Chip | → **DENIED** |
| L4 autonomy | `L4_AUTONOMY_ENABLED=false` |

## Tests

```bash
cd services/ai && npm run test:62lep16
```

| Command | Result |
| --- | --- |
| `npm run test:62lep16` | **PASS** — SAFE_SOFTWARE_TUNING; hardware denies; diagnostic-only; soft-wires PRESENT |

## Next (report only — do not implement)

**EP17 — Classical Quant Baseline Lab** — formalize the deterministic, OR, statistical, and optimization baselines that all advanced scheduler and quantum-inspired algorithms must be tested against.

## Tip-land / PR

- Tip-land onto `xiv-v2` / `main`: **NO**
- Pull request / ManagePullRequest: **NOT CREATED**
