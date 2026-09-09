# 62L-ES30 — Agent Reputation & Domain Trust Graph Report

Status: **IMPLEMENTATION COMPLETE ON CHILD BRANCH** — unit tests **executed** — denial tests **PASS** — **NOT** production authorization — **NO** tip-land / PR / ManagePullRequest

Date: 2026-09-09  
Branch: `cursor/62l-es30-agent-reputation-domain-trust-graph-4059`  
Tip SHA: `TIP_SHA_PLACEHOLDER`
Base: `cursor/62l-es26-agent-capability-marketplace-4059` @ `3de2e93` (ES29 Multi-Agent Consensus tip **absent** as landed tip; ES28 tip **absent**; ES26 marketplace **PRESENT** — used as best available prior tip)  
Preferred bases: ES29 → ES28 **absent as landed tips** — soft-wired via `existsSync` as **WAITING_DATA** or disk-PRESENT (presence ≠ VERIFIED; absent ≠ FAIL).  
SoT: **62L-ES** family / GitHub SoT **unresolved** — **no issue number invented**  
GitLab mirror: **not resolved** (GitLab MCP `needsAuth`; **no issue number invented**)

## Honesty banner

`DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`

- `L4_AUTONOMY_ENABLED=false`
- Domain trust profiles are routing/reputation signals, **not** permission or authority grants
- Evidence remains primary over reputation (dissent never auto-suppressed when stronger)
- No agent may modify its own trust score, certification, or reviewer history
- Guardian/RLS/tenant/Universe isolation unchanged; high-consequence actions human-authorized
- Soft-wire presence ≠ VERIFIED
- DB candidates **NOT_APPLIED**
- Tip-land / PR / ManagePullRequest / prod deploy: **NO**

## Trust states

`UNVERIFIED` · `LIMITED_TRUST` · `DOMAIN_VERIFIED` · `HIGH_TRUST` · `DEGRADED` · `SUSPENDED` · `REVALIDATION_REQUIRED`

## Trust record fields

`agentId` · `skillId` · `domain` · `taskClass` · `certificationState` · `testHistory` · `factualAccuracy` · `citationQuality` · `contradictionRate` · `escalationQuality` · `policyCompliance` · `latency` · `cost` · `failureRate` · `evaluatorScores` · `humanReviewOutcomes` · `lastVerifiedDate` · `trustState` · `evidenceRefs`

## Domain model

Agent → Domain → Skill → Task → Evidence → Outcome

Domain isolation: Supply Chain `HIGH_TRUST` for inventory ≠ `HIGH_TRUST` for legal.

## Routing path

Mission → required domain → eligible agents → trust graph → capability/cost/availability → team selection  
Prefer **best qualified**, not most active / most expensive.

## Soft-wire (presence ≠ VERIFIED; absent → WAITING_DATA not FAIL)

| Target | Soft-wire on ES30 tip (base ES26) |
| --- | --- |
| ES29 Multi-Agent Consensus + report | Consensus types may be disk-PRESENT from sibling WIP; **report WAITING_DATA**; presence ≠ VERIFIED |
| ES28 prior tip + report | Composition/marketplace chain soft-wire **PRESENT** (ES26 report landed); ES28-named tip **WAITING_DATA** |
| ES25 Skill Certification + report | Certification-adjacent via ES26 marketplace soft-wire **PRESENT**; ES25-named tip **WAITING_DATA** |
| ES16 / Home Base + report | Home Base types + compute surface **PRESENT**; ES16-named report **WAITING_DATA** |

## Deliverables (`services/ai/local-brain/**`)

| File | Role |
| --- | --- |
| `agent-reputation-domain-trust-graph-types.ts` | states, fields, locks, soft-wire, truth boundary |
| `agent-reputation-domain-trust-graph-runtime.ts` | register / increase / decrease / route / dissent / denies / cycle |
| `agent-reputation-domain-trust-graph.ts` | public facade |
| `phase62les30.test.ts` | denial + honesty tests (8) |
| `docs/operations/62L_ES30_AGENT_REPUTATION_DOMAIN_TRUST_GRAPH_REPORT.md` | this report |
| `npm run test:62les30` | package script |

## Autonomy / boundary denies (tested)

| Deny | Result |
| --- | --- |
| Domain isolation (supply_chain ≠ legal) | → **PASS** (no cross-domain transfer) |
| Self-modify trust / certification / reviewer history | → **DENIED** |
| Lower-trust + stronger evidence auto-suppress | → **NOT suppressed**; evidence primary |
| Trust grants permission / authority | → **DENIED** |
| Prefer most active / most expensive over best qualified | → **DENIED** (best qualified selected) |
| Tip-land / ManagePullRequest | → **DENIED** |
| L4 autonomy | `L4_AUTONOMY_ENABLED=false` |

## Tests

```bash
cd services/ai && npm run test:62les30
```

| Command | Result |
| --- | --- |
| `npm run test:62les30` | **PASS** — 8/8; domain isolation; self-modify denied; dissent evidence primacy; trust≠permission; L4 false; soft-wires WAITING_DATA≠FAIL |

## Next (report only — do not implement)

**ES31 — Dynamic Agent Team Builder** — assemble mission teams from domain trust, capability, cost, and availability without granting new authority.

## Tip-land / PR

- Tip-land onto `xiv-v2` / `main`: **NO**
- Pull request / ManagePullRequest: **NOT CREATED**
