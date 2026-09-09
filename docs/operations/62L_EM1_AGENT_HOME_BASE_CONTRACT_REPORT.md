# 62L-EM1 — Agent Home Base Contract Report

Status: **IMPLEMENTATION COMPLETE ON CHILD BRANCH** — **rebased onto sealed #157** — unit tests **executed** — denial rules **PASS** — soft-wire to local-runtime heartbeat/governor **present** — #157 EM home base soft-wire **PRESENT** — **NOT** production authorization

Date: 2026-09-09  
Branch: `cursor/62l-em1-agent-home-base-contract-4059`  
Tip SHA: `(recorded after commit)`  
Base: sealed `#157` `cursor/62l-em-agent-compute-home-base-4059` @ `b1040f4124802f73fe3545f6a5e9f9da8337ce0c`  
EL9 predecessor: `cursor/62l-el9-resource-governor-4059` @ `c834e5242ba1a2b04e6126babbbaf695133178b1`  
Rebase onto #157 `b1040f41…`: **YES**  
Tip-land onto `xiv-v2` / `main`: **NO**  
PR / ManagePullRequest / L4 / silent authority / cross-org auto-move: **NOT CREATED / DENIED**  
Production deploy / merge: **NO**

## Honesty banner

`DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`

- `L4_AUTONOMY_ENABLED=false`
- Child agents cannot inherit broader permissions than the parent
- Every branch has max runtime, resource budget, task scope, and stop condition
- Every agent must know where to return results (`returnPath`)
- Results return as **structured evidence**, not hidden chain-of-thought
- If Home Base unavailable → checkpoint safely → `WAITING_NODE`
- Revoked agents stop accepting new work
- Expired branch cannot silently continue
- No agent can create itself permanent authority
- Cross-organization and cross-Universe movement = deny-by-default
- High-consequence recommendations return to Home Base for human authorization
- No tip-land / PR / ManagePullRequest from this child branch

## User story

As XIV AI OS, every agent has a defined Home Base so agents can branch into research, simulations, compute tasks, pricing analysis, or domain work and always return to a governed XIV context.

## Core flow (implemented)

`XIV Home Base → agent mission → bounded branch task → CPU/GPU/NPU/model/tool → evidence/result → return receipt → Home Base`

## Required agent fields (encoded)

| Field | Encoded |
|---|---|
| `agentId` | yes |
| `homeUniverseId` | yes |
| `organizationId` or personal scope | yes (`scopeKind` + `organizationId` / `personalScopeId`) |
| `ownerUserId` | yes |
| `mission` | yes |
| `allowedTools` | yes |
| `allowedDataClasses` | yes |
| `computeBudget` | yes |
| `runtimeState` | yes |
| `heartbeat` | yes |
| `parentAgentId` | yes |
| `returnPath` | yes |
| `expiry` | yes |
| `revocationState` | yes |

Plus: `homeBaseId`, `branchBounds` (max runtime / resource budget / task scope / stop condition), `permanentAuthority=false`, `requiresHumanAuthForHighConsequence=true`.

## Deliverables

| Artifact | Path |
|---|---|
| Types + locks | `services/ai/local-brain/agent-home-base-types.ts` |
| Contract (validate / sign / deny) | `services/ai/local-brain/agent-home-base-contract.ts` |
| Soft-wire | `services/ai/local-brain/agent-home-base-soft-wire.ts` |
| Tests | `services/ai/local-brain/phase62lem1.test.ts` |
| npm script | `npm run test:62lem1` (in `services/ai/package.json`) |
| This report | `docs/operations/62L_EM1_AGENT_HOME_BASE_CONTRACT_REPORT.md` |

## Soft-wire

| Target | Result at tip |
|---|---|
| local-runtime `heartbeat-api.ts` | **present** |
| local-runtime `resource-governor.ts` (EL9) | **present** |
| #157 `agent-compute-home-base.ts` (+ runtime/types) | **PRESENT** (sealed tip `b1040f41…`) |

Presence soft-wire does **not** imply EL9/EM/#157 VERIFIED or production authorization.

## Acceptance criteria checklist

| # | Criterion | Result |
|---|---|---|
| 1 | Known parent / Home Base | **PASS** (executed) |
| 2 | Bounded authority (tools/data/budget ≤ parent) | **PASS** (executed) |
| 3 | Explicit compute/data limits + branch bounds | **PASS** (executed) |
| 4 | Heartbeat state required; WAITING_NODE path | **PASS** (executed) |
| 5 | Signed return envelope (HMAC-SHA256) | **PASS** (executed) |
| 6 | Child cannot exceed parent permissions | **PASS** (executed) |
| 7 | Structured evidence only (no hidden CoT) | **PASS** (executed) |
| 8 | Home Base unavailable → checkpoint → WAITING_NODE | **PASS** (executed) |
| 9 | Revoked stops new work | **PASS** (executed) |
| 10 | Expired cannot silently continue | **PASS** (executed) |
| 11 | No permanent self-authority | **PASS** (executed) |
| 12 | Cross-org / cross-Universe deny-by-default | **PASS** (executed) |
| 13 | High-consequence → Home Base human auth | **PASS** (executed) |
| 14 | `L4_AUTONOMY_ENABLED=false` | **PASS** (executed) |

## Tests (executed)

```bash
cd services/ai && npm run test:62lem1
```

**Result: PASS** — 23/23 tests passed, 0 failed (post-rebase onto #157 `b1040f41…`, agent run 2026-09-09).

## NOT_TESTED inventory

| Item | State |
|---|---|
| Live multi-node Home Base mesh | **NOT_TESTED** |
| Production KMS / HSM envelope keys | **NOT_TESTED** (dev HMAC key id only) |
| #157 EM compute home base (sealed tip soft-wire) | **PRESENT** on branch base — presence ≠ VERIFIED |
| EM2 branch-and-return task graph | **NOT IMPLEMENTED** (next) |
| Production authorization / tip-land / PR | **false** / not created |

## Next (do not implement on this branch)

**EM2 — Branch-and-Return Task Graph** — split work into child missions, coordinate, merge verified results back into main XIV brain.
