# 12D-113 — Mechanical Alignment-Invariant Audit (handoff)

Status: BUILT on `claude/12d-99-supervised-local-worker`. This story makes the
cross-agent alignment briefing's shared invariants (§3) mechanically auditable: a repeatable
source audit that any agent or the CI can run, fail-closed, with zero tolerance for unknown
violations and a shrink-only ledger for pre-existing debt.

## What it is

`services/ai/runtime/offline-team/alignment-invariant-audit.ts` + generated ledger
`alignment-invariant-debt.ts`. The audit scans `runtime/offline-team/*.ts` (non-test) and
checks:

1. **Guardrails invariants** — every `*_GUARDRAILS` object is `Object.freeze`d and carries
   `humanDecision: 'REQUIRED'`.
2. **No network in guardrails modules** — any network primitive in a guardrails module is a
   finding; debt cannot grandfather a network call.
3. **Authorized network surfaces** — every non-test module using `fetch`/`node:http`/etc.
   must be explicitly listed in `AUTHORIZED_NETWORK_SURFACES` with a loopback justification
   (directly in source, or via a named `viaLoopbackModules` entry that itself contains a
   loopback literal). The authorized set is exactly the loopback Ollama (127.0.0.1:11434)
   collaboration surfaces, the loopback token-gated control-tower HTTP server, and the local
   child_process reviewer. Nothing remote is authorized.
4. **Device ladder distinctness** — all six `DeviceEnrollmentState` values declared; no
   state aliased to another.
5. **Scale honesty markers** — the queue's 2,000,000-row ceiling and the partition
   contract's `billionUsersProven: false` must be present.

## The debt ledger (honest baseline)

The first real run found **136 genuine legacy violations** across older story modules
(unfrozen `*_GUARDRAILS` objects and/or missing `humanDecision: 'REQUIRED'`) out of 145
guardrails objects scanned (9 already compliant). Rather than paper over this with a loose
audit or mass-edit 136 files blindly, the violations are recorded in a frozen, GENERATED
ledger (`alignment-invariant-debt.ts`) with per-object facets. The ledger is enforced
**shrink-only**:

- a violation NOT in the ledger is a finding (audit fails);
- an entry that becomes compliant without being removed is a finding (`debt-ledger-stale`);
- an entry whose facets changed is a finding.

Paying down the ledger is queued as its own remediation story — each fix is a small,
reviewable diff (wrap in `Object.freeze`, add `humanDecision: 'REQUIRED'`), and the ledger
entry is removed in the same change.

## Result on the current tree

- Files scanned: 307 (non-test).
- Guardrails objects: 145 — 9 compliant, 136 known debt (ledgered), **0 unknown violations**.
- Network surfaces: 9 authorized, all loopback-bound or local child_process.
- Ladder: distinct; scale markers present.
- Tests: 9/9 pass; strict typecheck PASS over the module, ledger, and tests.

## Honest flags

`auditOnly: true` — the audit fixes nothing, executes no audited module, makes no network
call, starts no worker. `learningPromoted: false`, `liveAgentCount: null`,
`automaticRecovery: false`, `humanDecision: 'REQUIRED'`.

## Provenance note

The story was originally assigned to a multi-agent workflow run (wf_9fb7816c-e2b) whose
agent stalled on all six attempts; it was rebuilt directly and verified by hand. No
fabricated receipt is claimed for the stalled attempts.

humanDecision: REQUIRED · learningPromoted: false · zero real user stories created.