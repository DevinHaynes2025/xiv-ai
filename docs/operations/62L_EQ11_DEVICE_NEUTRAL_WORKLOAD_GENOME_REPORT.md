# 62L-EQ11 — Device-Neutral Workload Genome Report

Status: **IMPLEMENTATION COMPLETE ON CHILD BRANCH** — unit tests **executed** — denial tests **PASS** — **NOT** production authorization — **NO** tip-land / PR / ManagePullRequest

Date: 2026-09-09  
Branch: `cursor/62l-eq11-device-neutral-workload-genome-4059`  
Tip SHA: `0f2422fbd47cacab9fb3589b66f92bd5d4af510a`  
Base: `cursor/62l-eq10-instruction-semantics-learning-4059` @ `f80cd2abed090d715e6e7781909a60f0d052db36`  
Predecessor: EQ10 **PRESENT**  
SoT: **GitHub #161** / **62L-EQ** family — *62L-EQ11 Device-Neutral Workload Genome*  
Note: `gh issue view 161` may be unresolved in this agent environment; issue number retained from founder SoT statement.  
GitLab mirror: **not resolved** (GitLab MCP `needsAuth`; **no issue number invented**)

## Honesty banner

`DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`

- `L4_AUTONOMY_ENABLED=false`
- 20 reusable workload primitives (matmul, attention, vector search, vision, …)
- Compare architectures by **workload needs**, not vendor name
- Core flow: Agent task → Workload Genome → capability requirements → eligible runtimes/devices → benchmark comparison → scheduler decision
- XIV intelligence chain: task meaning → computational structure → architecture fit → measured performance → learned routing policy
- Neural pathway: Business problem → algorithm → primitives → runtime → architecture → device → benchmark → outcome
- **Only measured results strengthen the pathway**
- Vector-search example: memory-heavy, latency-sensitive, moderate parallelism, local-only, embedding/index runtime — **no GPU-always-best assumption**
- No infer-beyond-evidence, proprietary ISA cloning, firmware mod, unsafe hardware tuning, automatic cloud purchasing, permission expansion
- Guardian/RLS/tenant/Universe isolation unchanged
- DB candidates **NOT_APPLIED**
- Tip-land / PR / ManagePullRequest / prod deploy: **NO**

## Genome fields

`workloadId` · `operationFamily` · `inputOutputShape` · `computeIntensity` · `memoryIntensity` · `bandwidthNeeds` · `latencySensitivity` · `throughputPriority` · `precisionRequirements` · `parallelismProfile` · `localityPrivacyRequirements` · `modelRuntimeDependencies` · `acceleratorRequirements` · `fallbackOptions` · `benchmarkSuite` · `evidenceState`

## Soft-wire (presence ≠ VERIFIED)

| Target | Soft-wire on EQ10 tip |
| --- | --- |
| EQ10 Instruction-Semantics Learning + report | **PRESENT** |
| EQ8 ARM Server/Cloud Runtime Research + report | **PRESENT** |
| EQ6 Architecture Capability Graph + report | **PRESENT** |
| EQ5 Compiler/IR Translation Layer + report | **PRESENT** |
| EQ1 Cross-Architecture Contract + report | **PRESENT** |
| EM (#157) Agent Compute Home Base | probe (boolean) |

## Deliverables (`services/ai/local-brain/**`)

| File | Role |
| --- | --- |
| `device-neutral-workload-genome-types.ts` | primitives, fields, locks, soft-wire |
| `device-neutral-workload-genome-runtime.ts` | emit / requirements / compare / deny + cycle |
| `device-neutral-workload-genome.ts` | public facade |
| `phase62leq11.test.ts` | denial + honesty tests |
| `docs/operations/62L_EQ11_DEVICE_NEUTRAL_WORKLOAD_GENOME_REPORT.md` | this report |

## Autonomy / boundary denies (tested)

| Deny | Result |
| --- | --- |
| Vendor-name-first scheduling / assume GPU always best | → **DENIED** |
| Strengthen without measurement | → **DENIED** |
| Infer beyond evidence / ISA clone / firmware / unsafe tune / auto cloud buy / permission expansion | → **DENIED** |
| L4 autonomy | `L4_AUTONOMY_ENABLED=false` |

## Tests

```bash
cd services/ai && npm run test:62leq11
```

| Command | Result |
| --- | --- |
| `npm run test:62leq11` | **PASS** — needs≠vendor; vector-search profile; measured strengthen; safety denies; soft-wires PRESENT |

## Next (report only — do not implement)

**EQ12 — Cross-Architecture Benchmark Matrix** — run the same workload/model/input across verified ARM, x86, GPU, NPU, and edge paths and record which route actually performs best.

## Tip-land / PR

- Tip-land onto `xiv-v2` / `main`: **NO**
- Pull request / ManagePullRequest: **NOT CREATED**
