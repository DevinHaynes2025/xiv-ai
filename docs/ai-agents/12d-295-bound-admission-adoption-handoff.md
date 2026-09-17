# 12D-295 — Bound-Admission Adoption handoff (12D-278 becomes the ONLY reading-admission door)

Status: COMMITTED on `claude/12d-99-supervised-local-worker` (worktree `C:\Users\Devin\xiv-build-12d-99`), pushed to the **gitlab** remote.
Date: 2026-09-16/17.
CEO authorization on record: the CEO's **"i approve"** (2026-09-16, mid-turn) read as the explicit approval of the 12D-278 bound-bridge adoption candidate that had just been listed as needing a decision; the interpretation was stated openly in-session at the time. Recorded here so the rung's authorization trail is explicit.

## What this rung changed

The 12D-275 reading-admission door (`xiv-reading-admission.ts`) now REQUIRES
provenance. The 12D-278 bound-admission bridge is no longer an optional
composition on top — it is structurally the ONLY door:

```
register (12D-276) → bind (12D-277) → ingest (12D-274) → ADOPTED DOOR (12D-275 + provenance, bridge composed by 12D-278)
```

- `admitReadingStories(queue, prepared, provenance)` — the third argument is
  REQUIRED: `{ registerStore, registerGenesis, sourceId }` (exact keys, in
  order). NO REGISTER, NO BINDING, NO ADMISSION: a provenance-less or
  malformed invocation throws before a single row is written.
- The binding is **re-derived from the register chain bytes** via the REAL
  stateless `bindReadingToSource` (12D-277) — never accepted as a claim — and
  cross-gated against the prepared result's own `tenantId`, `documentId`, and
  `documentDigestSha256`.
- The measured `ReadingAdmissionResult` now **carries the binding receipt**
  (`binding: ReadingBinding`) — provenance travels with the admission.
- `xiv-bound-admission.ts` (12D-278) keeps its EXACT public contract; it now
  supplies the provenance from its own re-derived binding context (the
  binding is derived twice — once in the bridge, once in the door — both pure
  chain walks; defense-in-depth, one truth).
- Policy/guardrail pins: `READING_ADMISSION_POLICY.adoptedBoundAdmission =
  '12d-278-v1'`, `READING_ADMISSION_GUARDRAILS.boundAdmissionOnlyDoor = true`.

Deliberately UNCHANGED: `xiv-reading-binding.ts` (12D-277) is stateless — the
adoption re-derivation is idempotent, so re-admission by dedup stays safe;
`xiv-document-ingest.ts` (12D-274); the 12D-283 supervised reading cycle;
the 12D-294 review CLI; the 12D-101 Ed25519 review door (still untouched —
no CEO key; no reviewer receipt ever fabricated).

## Files

- `services/ai/runtime/offline-team/xiv-reading-admission.ts` — adoption edits (provenance gate, binding re-derivation, result carries `binding`).
- `services/ai/runtime/offline-team/xiv-bound-admission.ts` — now passes provenance (public contract unchanged).
- `services/ai/runtime/offline-team/xiv-reading-admission.test.ts` — all call sites converted to the 3-arg form with a registered-register fixture (`registerReadingSource`, sourceId `psychopy-repo`); NEW adversarial tests: provenance-less invocation refuses, unregistered sourceId refuses, malformed provenance shapes refuse by name, binding receipt asserted on the happy path and in the END-TO-END; guardrail test pins `adoptedBoundAdmission` + `boundAdmissionOnlyDoor`.
- `services/ai/runtime/offline-team/xiv-reading-binding.test.ts` — END-TO-END updated to the 3-arg form; asserts the door's re-derived receipt is byte-identical (`assert.deepEqual(admission.binding, binding)`) to the one derived above the call.
- `services/ai/package.json` — `test:12d-295` / `typecheck:12d-295` (the rung runs the 275 + 277 + 278 suites as one chain).
- `.gitlab-ci.yml` — `typecheck:12d-295` + `test:12d-295` appended to the validate chain.

Untracked scratch updated (NEVER committed): `.xiv-runtime/reading-cycle-demo.ts` now passes the register provenance per document.

## Measured results (all run from `services/ai`)

- `npm run test:12d-295` → **31/31 pass, 0 fail** (12D-275 suite 13 tests incl. 3 new adoption refusals; 12D-277 suite unchanged count with the updated END-TO-END; 12D-278 suite GREEN UNCHANGED — every 12D-278 refusal message preserved).
- `npm run typecheck:12d-295` → exit 0.
- Full chain regression: every `test:12d-*` suite in `package.json` re-run — results in the commit message and memory.

## Defects paid down / caught during the rung

- First draft of the tampered-digest test expected the binding-gate message; the structural cross-binding (`sourceRevision mismatch`) fires FIRST — correct fail-closed ordering, expectation restored to the structural message with a comment explaining the ordering.

## Honest boundaries (unchanged)

- The binding proves the reading's IDENTITY chain (registered source → binding → prepared digest → admitted rows); it cannot prove the ingested text was truly fetched from the registered URL — the human-supervised reading step remains the trust point (disclosed in 12D-277/278/295 alike).
- Honest flags on every result: `learningPromoted: false`, `activated: 0`, `humanDecision: 'REQUIRED'`, `remoteCalls: 0`, `modelCalls: 0`. No weight mutation happened anywhere in this rung. `billionUsersProven: false`. 2,000,000 rows/database remains the only measured ceiling.
- CI never claimed passed (`ci_quota_exceeded` org quota); the suites were run locally and the counts above are the measured truth.

## Next candidates

1. **Blocked-item retry (highest priority):** apply the CEO's 2026-09-16 review decision to the SIX settled drafts via the prepared, fail-closed `.xiv-runtime/apply-ceo-review-2026-09-16.ts` (acceptReview, review ref `ceo-decision-2026-09-16-i-approve`) — blocked by the safety-classifier outage at the time of this rung; retry each turn.
2. Read further CEO-named public sources through the 12D-283 cycle (98 registered unread; candidates: OWASP WSTG, mlflow docs, GSA/data.gov).
3. A bound-admission CLI surface (executor, not decider) mirroring the 12D-294 pattern.
4. The 12D-243/12D-245 operator questions (CEO-decision-gated); rail integration for 12D-266 (BLOCKED on CEO authorization + credentials); GitHub Phase 1 lockdown (blocked on `! gh auth login`).