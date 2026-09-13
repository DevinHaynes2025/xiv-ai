# 12D-118 — Enterprise authority-ladder mapping (handoff)

## What exists

`services/ai/runtime/offline-team/enterprise-authority-ladder.ts` maps the master plan's
authority ladder — **L0 Observe · L1 Recommend · L2 Draft · L3 Human Approval ·
L4 reserved (disabled) · L5 Human Only** (canonical wording: `docs/agent-runtime.md:182`)
— onto all **100 enterprise workforce roles** in `enterprise-workforce.ts`.

- `AUTHORITY_LADDER` — the six frozen ladder definitions.
- `ASSIGNABLE_LEVELS` — L0/L1/L2/L3/L5; **L4 is reserved and can never be assigned to a
  role** (mechanically enforced).
- `ENTERPRISE_ROLE_LADDER_MAP` — one frozen entry per role: `{roleId, level,
  justification}`; every justification cites the role's own mission wording in
  `enterprise-workforce.ts`.
- `assertLadderMapInvariants(map)` — fail-closed checks: exact coverage of the workforce
  catalog (no missing, no unknown, no duplicate), no reserved rung, substantive
  justification per entry.
- `composeAuthorityLadderPacket({generatedAtMs})` — governed packet
  `ENTERPRISE_AUTHORITY_LADDER_MAP` with honest flags (`humanDecision: 'REQUIRED'`,
  `learningPromoted: false`, `liveAgentCount: null`, `automaticRecovery: false`).

Verified distribution: **L0 = 22 · L1 = 23 · L2 = 47 · L3 = 6 · L5 = 1 · L4 = 0.**

- **L3 (approval-gated domains):** authorization, backup_restore, compliance,
  iam_auditor, incident_response, encryption.
- **L5 (human-reserved core decision; role only prepares material):** executive.
- **Key reading:** every level is the CEILING a role's output shape may reach — never an
  activation. All roles remain `PROFILE_DEFINED_NOT_ACTIVATED` with `LOCAL_DRAFT_ONLY`
  execution; activation and anything above a role's ceiling are human decisions.

## Provenance and review

- Levels proposed by a 5-agent classified fan-out over the catalog (2 teams each), then
  adversarially verified by 3 independent skeptics (over-privilege, under-privilege,
  governance-consistency against `productionAuthority: false` /
  `networkAuthority: false` / `cloudProvisioningAuthority: false` /
  `modelWeightMutation: false`).
- Verified findings applied as **conservative refute-downs only** (levels never move up):
  `model_router` L2→L1 (BLOCKING: "Deny …" is a gatekeeping verdict, mirroring
  `learning_safety`), `tenant_isolation` L2→L1, `prompt_engineer` L2→L1,
  `agent_registry` L2→L0, `architecture_council` L1→L0. Justification rewords applied for
  `tenant_isolation`, `load_test` (no executed load), `schema_designer` (line ref).
- Coverage and governance checks passed for all 100 roles; no L4 assignment; every
  justification verified against the catalog's verbatim mission text.
- One junk verify finding (literal `"test"`, under-privilege skeptic) was discarded as
  reviewer noise — disclosed, not hidden.

## Honest state

Zero activated agents, zero executed drafts, zero real user stories. The mapping is
governance data about role ceilings, not evidence of capability. Reviewers remain
CLAUDE_CODE / GROK_XAI PENDING (Grok has never responded).

## How to verify

```
npm run typecheck:12d-118
npm run test:12d-118
```