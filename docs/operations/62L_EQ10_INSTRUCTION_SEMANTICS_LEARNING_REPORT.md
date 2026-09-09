# 62L-EQ10 — Instruction-Semantics Learning Report

Status: **IMPLEMENTATION COMPLETE ON CHILD BRANCH** — unit tests **executed** — denial tests **PASS** — **NOT** production authorization — **NO** tip-land / PR / ManagePullRequest

Date: 2026-09-09  
Branch: `cursor/62l-eq10-instruction-semantics-learning-4059`  
Tip SHA: *(filled after feat commit)*  
Base: `cursor/62l-eq9-riscv-accelerator-research-4059` @ `7ecb0dfdba6259cee5a783369b5b7933682a1734`  
Predecessor: EQ9 **PRESENT**  
SoT: **GitHub #161** / **62L-EQ** family — *62L-EQ10 Instruction-Semantics Learning*  
Note: `gh issue view 161` may be unresolved in this agent environment; issue number retained from founder SoT statement.  
GitLab mirror: **not resolved** (GitLab MCP `needsAuth`; **no issue number invented**)

## Honesty banner

`DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`

- `L4_AUTONOMY_ENABLED=false`
- Learn from public ISA semantics + compiler behavior — **not** copy proprietary microarchitecture
- Key object: **operation need → architecture capability → runtime support → measured outcome**
- Core flow: Public ISA/runtime docs → semantic classes → workload requirements → compiler/IR mapping → device candidates → benchmarks → structured lesson
- Neural pathway: Workload → operation class → compiler/IR → architecture feature → runtime → device → benchmark → lesson
- Measured success strengthens paths; regression / stale evidence weakens them
- Attention example needs: matrix/vector ops, memory movement, precision, bandwidth, compatible kernels
- Compare verified ARM / x86 / GPU / NPU routes using evidence
- Allowed: public/open specs, documented compiler behavior, OSS toolchains, lawful benchmarks
- Blocked: confidential microarchitecture, proprietary RTL, unreleased instructions, private firmware, trade secrets
- No generated claim becomes **VERIFIED** without actual runtime evidence
- Guardian/RLS/tenant/Universe isolation unchanged
- DB candidates **NOT_APPLIED**
- Tip-land / PR / ManagePullRequest / prod deploy: **NO**

## Soft-wire (presence ≠ VERIFIED)

| Target | Soft-wire on EQ9 tip |
| --- | --- |
| EQ9 RISC-V Accelerator Research + report | **PRESENT** |
| EQ5 Compiler/IR Translation Layer + report | **PRESENT** |
| EQ4 Proprietary ISA Boundary + report | **PRESENT** |
| EQ3 RISC-V Open ISA Knowledge Pack + report | **PRESENT** |
| EQ2 ARM Architecture Knowledge Pack + report | **PRESENT** |
| EQ1 Cross-Architecture Contract + report | **PRESENT** |
| EM (#157) Agent Compute Home Base | probe (boolean) |

## Deliverables (`services/ai/local-brain/**`)

| File | Role |
| --- | --- |
| `instruction-semantics-learning-types.ts` | foci, pathway, locks, soft-wire |
| `instruction-semantics-learning-runtime.ts` | lesson / strengthen / weaken / deny + cycle |
| `instruction-semantics-learning.ts` | public facade |
| `phase62leq10.test.ts` | denial + honesty tests |
| `docs/operations/62L_EQ10_INSTRUCTION_SEMANTICS_LEARNING_REPORT.md` | this report |

## Autonomy / boundary denies (tested)

| Deny | Result |
| --- | --- |
| Copy instruction set as learning object | → **DENIED** |
| VERIFIED without runtime evidence | → **DENIED** |
| Confidential microarchitecture / proprietary RTL / unreleased instructions / private firmware / trade secrets | → **DENIED** |
| L4 autonomy | `L4_AUTONOMY_ENABLED=false` |

## Tests

```bash
cd services/ai && npm run test:62leq10
```

| Command | Result |
| --- | --- |
| `npm run test:62leq10` | **PASS** — operation need≠ISA copy; strengthen/weaken; runtime evidence for VERIFIED; soft-wires PRESENT |

## Next (report only — do not implement)

**EQ11 — Device-Neutral Workload Genome** — define reusable workload primitives (attention, matmul, search, graph traversal, simulation, encoding, optimization) so every architecture can be compared against the same computational needs.

## Tip-land / PR

- Tip-land onto `xiv-v2` / `main`: **NO**
- Pull request / ManagePullRequest: **NOT CREATED**
