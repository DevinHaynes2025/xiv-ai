# 62L-ES27 — Capability Composition Engine Report

Status: **IMPLEMENTATION COMPLETE ON CHILD BRANCH** — unit tests **executed** — denial tests **PASS** — **NOT** production authorization — **NO** tip-land / PR / ManagePullRequest

Date: 2026-09-09  
Branch: `cursor/62l-es27-capability-composition-engine-4059`  
Tip SHA: `ec76f1a283eafd69b4b276942655e3c9ca2df8bd`  
Base: ES10 tip `b3be8b6` (ES26 Marketplace tip **not yet landed** at park time; ES25 Certification tip **absent**; soft-wire via `existsSync`)  
Preferred bases: ES26 Marketplace → ES25 soft-wire — both **absent as landed tips** → soft-wired as **WAITING_DATA** (not FAIL). Presence ≠ VERIFIED.  
SoT: **62L-ES** family — *62L-ES27 Capability Composition Engine*  
Note: GitHub SoT unresolved in this agent environment — **no issue number invented**.  
GitLab mirror: **not resolved** (GitLab MCP `needsAuth`; **no issue number invented**)

## Honesty banner

`DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`

- `L4_AUTONOMY_ENABLED=false`
- Permission mode: **INTERSECTION** (not UNION)
- Skill fail → **PARTIAL** / **BLOCKED** + failure receipt — no silent fabricate
- Component skill revoked → **REVALIDATION_REQUIRED** or **BLOCKED**
- No bid submission / contract signing / payment authority
- No autonomous cloud purchasing or budget expansion
- Guardian/RLS/tenant/Universe isolation unchanged
- DB candidates **NOT_APPLIED**
- Tip-land / PR / ManagePullRequest / prod deploy: **NO**

## Core flow

User/mission request → capability discovery → skill compatibility check → permission intersection → workflow graph → bounded execution → evidence merge → Home Base

## Permission rule

Composed workflow receives **INTERSECTION** of allowed permissions, not UNION.

Example: Skill A `read_supplier` + Skill B `draft_contract_analysis` ≠ `contract_signing` or `payment_authority`.

## Composition tracking fields

`compositionId` · `mission` · `participatingSkills` · `participatingAgents` · `tenant/Universe` · `requiredApisTools` · `requiredDataClasses` · `computeRuntimeNeeds` · `dependencyOrder` · `costBudget` · `timeout` · `approvalCheckpoints` · `expectedOutputs` · `evidenceRequirements` · `fallbackPaths` · `rollbackRevocationState`

## Compatibility checks

`skill_versions_current` · `data_scopes_compatible` · `apis_authorized` · `models_runtimes_available` · `output_schema_matches_next_input` · `no_revoked_dependency` · `cost_resource_ceilings_within_policy`

## Gov contract example (no bid submit)

Opportunity Research → Requirement Decomposer → Logistics Solution → Pricing Scenario → Proposal Draft → Compliance Review → **proposal candidate + evidence + blockers + human decisions required**. Bid submission **DENIED**.

## Soft-wire (presence ≠ VERIFIED; absent → WAITING_DATA not FAIL)

| Target | Soft-wire on this tip |
| --- | --- |
| ES26 Agent Capability Marketplace (+ report) | **WAITING_DATA** |
| ES25 Skill Certification (+ report) | **WAITING_DATA** |
| ES19 Production Boundary (+ report) | **WAITING_DATA** |
| ER16 / Home Base (`agent-compute-home-base` + EM report) | **PRESENT** |

## Deliverables (`services/ai/local-brain/**`)

| File | Role |
| --- | --- |
| `capability-composition-engine-types.ts` | INTERSECTION, compatibility, soft-wire, truth boundary, locks |
| `capability-composition-engine-runtime.ts` | compose → execute → evidence merge → revoke → Home Base cycle |
| `capability-composition-engine.ts` | public facade |
| `phase62les27.test.ts` | intersection≠union; no bid; fabricate deny; revoked→BLOCKED; L4 false (7) |
| `docs/operations/62L_ES27_CAPABILITY_COMPOSITION_ENGINE_REPORT.md` | this report |

## Autonomy / boundary denies (tested)

| Deny | Result |
| --- | --- |
| Permission UNION / expansion | → **DENIED** |
| Bid submission / contract signing / payment | → **DENIED** |
| Fabricate downstream after skill fail | → **DENIED** |
| Skill fail with fallback | → **PARTIAL** + failure receipt |
| Skill fail without fallback | → **BLOCKED** + failure receipt |
| Component skill revoked | → **BLOCKED** / **REVALIDATION_REQUIRED** |
| Autonomous cloud purchase / budget expand | → **DENIED** |
| Hidden tool chain / cross-tenant pool / prod change | → **DENIED** |
| L4 autonomy | `L4_AUTONOMY_ENABLED=false` |

## Tests

```bash
cd services/ai && npm run test:62les27
```

| Command | Result |
| --- | --- |
| `npm run test:62les27` | **PASS** — 7/7; INTERSECTION≠UNION; no bid; fabricate denied; revoked→BLOCKED; L4 false; soft-wires |

## Next (report only — do not implement)

**ES28 — Workflow Graph Optimizer** — optimize composed skill graphs for cost, latency, and evidence coverage without expanding permissions or autonomy.

## Tip-land / PR

- Tip-land onto `xiv-v2` / `main`: **NO**
- Pull request / ManagePullRequest: **NOT CREATED**
