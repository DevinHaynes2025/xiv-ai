# 12D-278 — Bound Admission Bridge (handoff)

Status: COMMITTED with the commit carrying this file on
`claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-bound-admission.ts` + 8
adversarial tests). **TEST RUN DISCLOSED**: `test:12d-278` (node TAP
via tsx) = **8/8 pass**; `typecheck:12d-278` (strict tsc, covering the
bridge, the 12D-275 admission, the 12D-277 binding, the 12D-276
register, the 12D-274 ingest, and the queue) = **exit 0**. Full
sibling regressions (single tsx run): **128/128** across 11 chain
suites (document-ingest, reading-admission, register, binding, bound-
admission, approval-ledger, approval-ledger-batch, pathway-ledger,
offline-story-queue, shared-host-admission, authenticated-review-
response). Shell build (Next.js 16.3.5): compiled + typechecked
(unchanged tree — the bridge is RUNTIME-ONLY, `shellDatabaseFree`).
CI IS NOT CLAIMED PASSED (`ci_quota_exceeded`). Reviewers: CLAUDE_CODE
(self-review). GROK_XAI review PENDING — never fabricated.

## What this rung is

The structural completion of the reading chain's provenance:
`admitBoundReading(queue, registerStore, registerGenesis, prepared,
bindingInput)` JOINS the two halves — an operator can no longer admit
a reading whose REGISTERED-SOURCE binding is absent or mismatched.

- **NO BINDING, NO ADMISSION**: the binding is re-derived from the
  register chain bytes (the real 12D-277 `bindReadingToSource`) and
  its receipt validated — an unregistered reading physically cannot
  pass this door (proven: empty register, unknown sourceId; a foreign
  tenant refuses even earlier, at the prepared cross-gate).
- **THE PREPARED DIGEST IS THE TRUTH**: the binding is cross-gated
  against `prepareDocumentStories`' own digest, tenant, and document
  id — declaring another document's digest (or another tenant, or
  another documentId) refuses BEFORE any queue write (zero rows
  proven written in every refusal).
- **THE REAL CONTRACT DOES THE WORK**: admission is the actual 12D-275
  `admitReadingStories` (measured, dedup'd, claimable), called, never
  re-implemented; the census is the queue's own summary.
- **PROVENANCE CARRIED, NOT CONSUMED**: the frozen result pairs the
  binding receipt WITH the measured admission and census — provenance
  travels with the admission record. Nothing is activated;
  `learningPromoted: false`; weight-mutation stays CEO-gated.
- Pure composition: no fs, no network, no clock, no randomness, no
  model calls; operator/runtime-side only (imports the SQLite-backed
  queue — NEVER imported by the story shell, the 12D-273 lesson).

## Disclosed residuals (unchanged, re-disclosed here)

- The bridge proves the reading's IDENTITY chain (registered source →
  binding receipt → prepared digest → admitted rows); it cannot prove,
  by bytes alone, that the ingested text was truly fetched from the
  registered URL — the human-supervised reading step remains the trust
  point (same residual as 12D-277).
- `admitReadingStories` (12D-275) is UNCHANGED and still available
  without a register. This bridge is the REQUIRED-PROVENANCE path
  offered ALONGSIDE, not a silent replacement. Adopting it as the ONLY
  door is a CEO decision.

## Measured demo (scratch, never committed)

`.xiv-runtime/bound-admission-demo.ts` (run from services/ai):
- 4 of the CEO's public quantum sources REGISTERED into the existing
  register (quantumlib-cirq — license verified in-session Apache 2.0;
  quantumlib-openfermion, pennylane, qutip — license notes carried
  with a "re-verify before any read" disclosure). Register census:
  **7 entries**, 10,000 capacity, `sourcesRead: 0` (registered ≠
  read), `learningPromoted: false`.
- One supervised in-session WebFetch read of the Cirq README →
  12D-274 prepare → **MEASURED BOUND ADMISSION**: `kind:
  BOUND_READING_ADMITTED`, binding receipt digest `134861fbde2f…`,
  prepared 1 / inserted 1 / duplicates 0, real-queue census **3
  total READY rows**, `liveAgentCount: null`, `activated: 0`,
  `humanDecision: 'REQUIRED'`.
- Honest mapping of the CEO's quantum-universe vision: the reading is
  DESIGN VOCABULARY only — no quantum capability is built or claimed;
  the "xiv quantum ai virtual chip" stays future design, CEO-gated.

## Exact files

- `services/ai/runtime/offline-team/xiv-bound-admission.ts` (new)
- `services/ai/runtime/offline-team/xiv-bound-admission.test.ts`
  (new, 8 tests — happy path with binding receipt + measured
  admission; NO BINDING NO ADMISSION refusals before any write
  (empty register, unknown source, foreign tenant at the cross-gate);
  prepared-digest/documentId cross-gate mismatches; tampered register;
  missing/malformed/extra-key/reordered binding objects; foreign
  queue instance + foreign register stores; idempotent re-admission
  via the queue's own dedup; guardrail/policy pins)
- `services/ai/package.json` — `test:12d-278`, `typecheck:12d-278`
- `.gitlab-ci.yml` — `typecheck:12d-278`, `test:12d-278` steps
- `docs/ai-agents/12d-278-bound-admission-handoff.md` (this file)

## Exact commands and local results

```
npm run typecheck:12d-278  # RAN: exit 0
npm run test:12d-278       # RAN: 8/8 pass
sibling run via tsx --test # RAN: 128/128 (11 chain suites)
shell npm run build        # RAN: compiled successfully
```

## Defects found and paid down during this story

- (typecheck, fixed) `ReadingSourceStore` was imported from
  `xiv-reading-binding`, which declares it locally without
  re-exporting (TS2459) — the type import now comes from the
  12D-276 register module where it lives.
- (test expectation, module RIGHT) the "foreign tenant" case refused
  at the prepared cross-gate BEFORE the register was consulted —
  earlier fail-closed than my test assumed. The TEST's expected regex
  was corrected to the cross-gate message; the contract was not
  touched.

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no merge, no
deployment, no learning promotion, no activation of anything, no
credential use. The commit stages ONLY the files above and never
touches `services/ai/.xiv-runtime/` or `services/ai/provision-12d-99.ts`.

## Next candidates

- Adopt the bound bridge as the ONLY admission door (12D-275 without
  a register retired or kept alongside) — CEO decision.
- The supervised READING/REVIEW loop with Ollama qwen2.5-coder:7b as
  first reader (loopback-only) — CEO decision (modelCalls changes
  from 0).
- Pathway-evidence expansion for the 12D-264 ledger.
- The 12D-243/12D-245 operator questions (fail-closed,
  CEO-decision-gated).
- Rail integration for 12D-266 (BLOCKED on CEO authorization +
  credentials).
- GitHub Phase 1 lockdown (blocked on the CEO's `! gh auth login`).