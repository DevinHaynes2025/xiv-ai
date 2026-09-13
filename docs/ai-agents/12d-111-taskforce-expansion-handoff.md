# 12D-111 — Governed Taskforce Roster Expansion Proposals (handoff)

Status: BUILT LOCALLY on `worktree-agent-add6b56dd3bb301ac` (based on the 12D-108 line). Covers the CEO-directed taskforce and brain expansion scope.

## What it is

`proposeTaskforceExpansion(input)` validates a bounded set of proposed roles and holds them as a proposal — nothing more. The governed way to expand the XIV taskforce is NOT to spin up live agents; it is to extend the ROSTER (the sparse logical workforce of `enterprise-workforce.ts`) through the same admission discipline the enterprise workforce already enforces. This module starts no process, makes no model call, and adds no role to the live factory.

## The admission rules

- `TASKFORCE_EXPANSION_POLICY` (frozen): at most 8 proposed roles per request, at most 24 roster growth per epoch, 2 required distinct reviewer roles, epoch bounds 1..10000, bounded ids/missions/evidence refs.
- Every proposed role declares `roleId`, a bounded `mission`, `requestedReviewerRoleIds`, and `evidenceRefs`. Expansion cannot create its own reviewers: requested reviewers must ALREADY exist in the live enterprise factory AND be designated reviewer roles (derived from the catalog's `reviewerIds` edges). Rejected: duplicate roleIds in one batch, collision with an existing factory role, self-review (a proposed role reviewing another proposed role), unknown or non-designated reviewers, oversized batches, out-of-bounds or repeated epochs.
- `expansionReadiness(proposal)` is a pure evaluation: no role is ever ready here. Every role's gap list starts with `HUMAN_APPROVAL_REQUIRED`, then `STAFFING_PLAN_REQUIRED`, then `REVIEWER_WIRING_ADVISORY_UNTIL_HUMAN_RATIFICATION` — reviewer wiring is advisory until a human ratifies it.
- `expansionSnapshot()` reports honest flags: `proposedRolesLive: 0`, `agentsStarted: 0`, `liveAgentCount: null` (never fabricates a number), `humanDecision: 'REQUIRED'`.

## Verification

6/6 tests (`test:12d-111`): a valid proposal against real designated reviewers from the factory; rejection of unknown/non-designated/colliding/duplicate/self-reviewing wiring; batch, text, evidence, and epoch bounds; readiness gaps list human approval first; snapshot honest flags; frozen policy and guardrails (`startsNoAgentProcess: true`, `modelCallsAllowed: 0`, `remoteCallsAllowed: false`, `rolesAreSparseLogicalUntilStaffed: true`). `typecheck:12d-111` PASS. Wired into `.gitlab-ci.yml`.

## Trust limits

The module never activates a role, never enrolls an agent, and never mutates `ENTERPRISE_WORKFORCE`. Every proposal is held at `PROPOSED_AWAITING_HUMAN_DECISION`, and a human decision plus a staffing plan is required before anything in this module could ever change.