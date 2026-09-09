# 62L-EQ4 — Proprietary ISA Boundary Report

Status: **IMPLEMENTATION COMPLETE ON CHILD BRANCH** — unit tests **executed** — denial tests **PASS** — **NOT** production authorization — **NO** tip-land / PR / ManagePullRequest

Date: 2026-09-09  
Branch: `cursor/62l-eq4-proprietary-isa-boundary-4059`  
Tip SHA: *(filled after feat commit)*  
Base: `cursor/62l-eq3-riscv-open-isa-knowledge-pack-4059` @ `1bc691e0fa4978afa0a7718605c8e74666f6c2c9`  
Predecessor: EQ3 **PRESENT**  
SoT: **GitHub #161** / **62L-EQ** family — *62L-EQ4 Proprietary ISA Boundary*  
Note: `gh issue view 161` may be unresolved in this agent environment; issue number retained from founder SoT statement.  
GitLab mirror: **not resolved** (GitLab MCP `needsAuth`; **no issue number invented**)

## Honesty banner

`DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`

- `L4_AUTONOMY_ENABLED=false`
- Hard boundary: public/open architecture knowledge vs proprietary implementation IP
- Core flow: Source → rights/provenance check → classification → ALLOW / QUARANTINE / DENY → knowledge graph
- **UNKNOWN_RIGHTS → QUARANTINE** (not automatic ingestion)
- May learn: instruction semantics → compiler behavior → workload mapping → benchmark behavior
- Must not learn: confidential implementation internals → copied proprietary design
- Tenant `AUTHORIZED_PRIVATE` stays in that Universe — **not** XIV global knowledge base
- Guardian/RLS/tenant/Universe isolation unchanged
- DB candidates **NOT_APPLIED**
- Tip-land / PR / ManagePullRequest / prod deploy: **NO**

## Rights states → outcomes

| Rights state | Outcome |
| --- | --- |
| `PUBLIC_OPEN` / `PUBLIC_VENDOR_DOC` / `LICENSED` | **ALLOW** |
| `AUTHORIZED_PRIVATE` | **ALLOW** (tenant/Universe only) |
| `UNKNOWN_RIGHTS` | **QUARANTINE** |
| `RESTRICTED` / `CONFIDENTIAL` / `LEAKED_OR_STOLEN` | **DENY** |

## Audit fields (knowledge nodes)

`sourceId` · `rightsState` · `architectureFeature` · `claim` · `tenantId` · `universeId` · `purpose` · `reviewer` · `timestamp` · `revocationPath`

## Soft-wire (presence ≠ VERIFIED)

| Target | Soft-wire on EQ3 tip |
| --- | --- |
| EQ3 RISC-V Open ISA Knowledge Pack + report | **PRESENT** |
| EQ2 ARM Architecture Knowledge Pack + report | **PRESENT** |
| EQ1 Cross-Architecture Contract + report | **PRESENT** |
| EP16 No Overclock / BIOS Rule + report | **PRESENT** |
| EM (#157) Agent Compute Home Base | probe (boolean) |

## Deliverables (`services/ai/local-brain/**`)

| File | Role |
| --- | --- |
| `proprietary-isa-boundary-types.ts` | sources, rights states, locks, soft-wire |
| `proprietary-isa-boundary-runtime.ts` | classify / emit / deny + cycle |
| `proprietary-isa-boundary.ts` | public facade |
| `phase62leq4.test.ts` | denial + honesty tests |
| `docs/operations/62L_EQ4_PROPRIETARY_ISA_BOUNDARY_REPORT.md` | this report |

## Autonomy / boundary denies (tested)

| Deny | Result |
| --- | --- |
| Auto-ingest UNKNOWN_RIGHTS | → **DENIED** (quarantine) |
| Promote tenant-private to global KB | → **DENIED** |
| Promote quarantine to global | → **DENIED** |
| Private RTL / confidential microarchitecture / firmware keys | → **DENIED** |
| Leaked/stolen / trade secrets | → **DENIED** |
| Learn confidential internals / copy proprietary design | → **DENIED** |
| L4 autonomy | `L4_AUTONOMY_ENABLED=false` |

## Tests

```bash
cd services/ai && npm run test:62leq4
```

| Command | Result |
| --- | --- |
| `npm run test:62leq4` | **PASS** — UNKNOWN_RIGHTS quarantine; tenant≠global; boundary denies; soft-wires PRESENT |

## Next (report only — do not implement)

**EQ5 — Compiler/IR Translation Layer** — map device-neutral workloads through compiler/intermediate-representation abstractions instead of tying intelligence directly to a specific ISA.

## Tip-land / PR

- Tip-land onto `xiv-v2` / `main`: **NO**
- Pull request / ManagePullRequest: **NOT CREATED**
