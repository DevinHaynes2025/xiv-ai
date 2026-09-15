# 12D-244 — Custody Operator Runner (handoff)

Status: COMMITTED on `claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/custody-runner.ts` + 14 focused tests).
**TEST RUN DISCLOSED**: `test:12d-244` = **14/14 pass**, `typecheck:12d-244`
(strict) = **exit 0**; sibling regressions green this cycle: `test:12d-233`
13/13, `test:12d-236` 13/13, `test:12d-237` 12/12, `test:12d-238` 11/11,
`test:12d-239` 13/13, `test:12d-240` 13/13, `test:12d-241`
12/12, `test:12d-242` 14/14. CI IS NOT CLAIMED PASSED: GitLab CI remains
quota-blocked (`ci_quota_exceeded`). Reviewers: CLAUDE_CODE (self-review;
defects caught pre-run are listed below). GROK_XAI review PENDING — never
fabricated.

## What it is

The operator runner the custody chain was missing: executes an
OPERATOR-AUTHORED plan of custody ops (`register` / `authenticate`, 12D-233
semantics) through a 12D-237 custody session and returns a frozen,
deterministic **evidence packet** for the run. It is a loop that collects
evidence — NOT an autonomous loop: the plan is written by the operator, the
runner applies it verbatim, every refusal stops the run, and the human
decides what happens next (`humanDecision: 'REQUIRED'` pinned).

1. **Two-phase execution.** Phase 1 shape-gates EVERY step (exact keys per
   op, types, lowercase-hex64 receipts, safe non-negative integer
   timestamps, plan size ≤ 64, non-empty plan) — a malformed plan refuses
   BEFORE ANY apply, so a broken plan journals nothing (asserted per case:
   the store stays empty).
2. **Stop on the FIRST registry refusal.** Registry first, journal second
   (12D-236) — a refused op is never journaled. Ops BEFORE the refusal STAY
   applied: custody journals are append-only and no rollback is claimed
   (the suite proves a refused run leaves the earlier register intact and
   verifiable from a `resume` run). Later steps are reported `pending`.
3. **Deterministic evidence.** `runId` = sha256 over the canonical run
   description `{domain: 'XIV_CUSTODY_RUNNER', mode, steps, applied:
   [{index, journalDigest}]}` — same plan, same journal history, same
   runId (asserted across two fresh stores; a different seed yields a
   different chain and a different runId).
4. **The seed never serializes into the evidence.** The evidence travels
   without custody control material; verifying the JOURNAL is the operator
   re-providing the seed out of band (`verifyCustodySession`), unchanged
   from 12D-237. `journalVerified: true` is stamped ONLY after that
   verification passes at run end — if the journal diverged, the run
   throws instead of emitting an unverified packet.
5. **Guardrails compared BY VALUE** (JSON-round-trip safe) — the 12D-241
   reference-equality lesson applied at design time; the suite proves the
   evidence still verifies after crossing a JSON wire.
6. **Honest flags**: `humanDecision: 'REQUIRED'`, `learningPromoted:
   false`, `zeroModelCalls: true`, `zeroRemoteCalls: true`,
   `collectsNothing: true`, `automaticRecovery: false`,
   `billionUsersProven: false` — pinned in the frozen guardrails object
   that every evidence packet carries.

## Defects found and paid down during this story

- **(self-review, pre-run — in my own first draft):** an undefined type
  alias (`CustodyJournalEntryInput`), a `require('crypto')` that violated
  the module's ESM pattern, an exact-keys audit on the evidence that would
  have broken on the OPTIONAL `refused` key, and guardrails compared by
  REFERENCE — the exact 12D-241 defect that suite caught — all fixed
  before the first run: guardrails now compare BY VALUE per key.
- **(caught by the first run — test-side):** the chronology fixture used
  `nowMs = T0 + 5` against `issuedAtMs = T0` — which is AFTER issuance, not
  before; the registry was right to accept it. Fixed to a genuinely
  pre-issuance timestamp (`issuedAtMs: T0 + 100`, `nowMs: T0 + 50`).
- **(caught by the first run — test-side):** the seed-serialization
  assertion `serialized.includes('seed')` was a FALSE assertion — the
  guardrail NAME `seedNeverSerializesIntoEvidence` legitimately contains
  the substring. Re-scoped to the real properties: the seed VALUE is
  absent and no `"seed":` key exists.

## Disclosed residuals

- `verifyCustodyRunEvidence` proves the BINDING between an evidence packet
  and the operator's plan (re-deriving `runId`), NOT the authenticity of
  the journal digests inside it — ledger authenticity remains
  `verifyCustodySession(session, store, seed)` with the operator's seed,
  out of band. A fully consistent FORGED evidence (fake digests + matching
  runId) binds to the plan but does not match the real journal; the
  out-of-band session verification is the check that catches it.
- The runner is a library call, not a CLI: an operator-facing CLI surface
  (12D-238 pattern) wrapping `runCustodyPlan` is a future story.
- One process per journal file (single-writer operator discipline),
  carried from 12D-236/237.
- CI remains quota-blocked; GROK_XAI review remains PENDING. Neither is
  ever claimed.

## Exact files

- `services/ai/runtime/offline-team/custody-runner.ts` (new)
- `services/ai/runtime/offline-team/custody-runner.test.ts` (new, 14 tests)
- `docs/ai-agents/12d-244-custody-operator-runner-handoff.md` (this file)
- `services/ai/package.json` — `test:12d-244`, `typecheck:12d-244` added in
  the 12D-244 commit (the 12D-239/240/241 commit chain has landed, so
  wiring no longer waits).
- `.gitlab-ci.yml` — `typecheck:12d-244`, `test:12d-244` appended in the
  same commit.

## Exact commands and local results

```
npm run test:12d-244      # RAN: 14/14 pass
npm run typecheck:12d-244 # RAN: strict, exit 0
```

Sibling regressions this cycle: 12d-233 13/13, 12d-236 13/13, 12d-237 12/12,
12d-238 11/11, 12d-239 13/13, 12d-240 13/13, 12d-241 12/12, 12d-242 14/14 —
all green.

CI: NOT RUN, NOT CLAIMED — `ci_quota_exceeded` persists.

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no traffic shifting, no
production mutation, no merge, no deployment, no learning promotion, no
Ollama/provider invocation, and NO external fetch of any pasted resource
occurred in this story. The commit stages ONLY the files above and never
touches `services/ai/.xiv-runtime/` or `services/ai/provision-12d-99.ts`.

## Direction from the CEO actioned by this story

"Build the brain and neural pathways" — the custody chain (12D-231..244)
is the accountability spine of the governed agent layer: every consequential
op is receipted, journaled tamper-evidently, and consumable exactly once,
with the runner now collecting the evidence the operator reviews. The
CEO's newest directives (identical digital twins per user, digital
fingerprints, autopilot-first, every GPU/CPU running XIV AI OS) are
recorded as direction in the daily report and memory — each will be
encoded as its own fail-closed story or scoping note with honest flags;
none is claimed built here.