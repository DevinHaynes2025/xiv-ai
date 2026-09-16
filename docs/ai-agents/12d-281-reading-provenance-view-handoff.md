# 12D-281 — Reading Provenance View (handoff)

Status: COMMITTED with the commit carrying this file on
`claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-reading-provenance-view.ts` + 10
adversarial tests). **TEST RUN DISCLOSED**: `test:12d-281` = **10/10
pass**; `typecheck:12d-281` (strict tsc, covering this module, the
12D-264 ledger, the growth engine, the 12D-279 evidence module, the
12D-278 bound admission, the 12D-277 binding, the 12D-276 register, the
12D-274 ingest, the evidence bridge, the 12D-269 approval link, and the
queue) = **exit 0**. Sibling chain regressions (single tsx run,
including the new 12D-280 suite): **115/115** across 12 chain suites.
Shell build: compiled (unchanged shell tree — this rung is
RUNTIME-ONLY; the view module is database-free and shell-importable BY
DESIGN, but no shell surface is added in this rung). **CI IS NOT
CLAIMED PASSED** (`ci_quota_exceeded`). Reviewers: CLAUDE_CODE
(self-review). GROK_XAI review PENDING — never fabricated.

## What this rung is

The provenance VIEW of the ledgered reading evidence (the first "Next
candidate" of the 12D-279 and 12D-280 handoffs): an operator-facing
summary of WHICH ledgered pathway candidates trace back, ref by ref,
to a registered reading source.

`summarizeReadingProvenance(store, ledgerGenesis)`:

- **THE REAL LEDGER REPLAY IS THE TRUTH**: the chain is verified by
  the 12D-264 ledger module's own line parser (via the additively
  exported `replayPathwayLedgerEntries` — same `parseLedgerLine` links
  the census walks). A tampered ledger refuses here exactly as it does
  for the census (proven: a flipped confidence byte refuses); the view
  never re-implements the chain and never repairs anything.
- **PROVENANCE IS COUNTED, NEVER INVENTED**: an entry counts as
  reading provenance ONLY if its own evidenceRefs carry a
  `reading-source:` ref; everything else counts as an otherEntry
  (proven: a plain ledgered candidate beside a reading entry reads
  1 reading + 1 other).
- **CARRIED, THEN CHECKED**: the carried refs are the record's
  provenance — and they are CHECKED at the view: an empty/oversized
  source id and a malformed register/document digest ref refuse, even
  on entries that claim no reading provenance (the digest-shaped refs
  are validated on EVERY entry; a defect found and paid down during
  this story).
- **VIEW-ONLY**: the ledger store is only ever LOADED — save is never
  called, nothing is written, nothing activates, nothing is repaired
  (proven with a save-counting spy store).
- **BOUNDED, NEVER TRUNCATED**: over the 256-entry view budget the
  WHOLE view refuses ("open a narrower view") — proven with a 257-entry
  ledger.
- **MEASURED COUNTS ONLY**: the packet reports exactly what the
  verified ledger holds — entries, reading-provenance entries,
  otherEntries, bySource counts, per-entry records; an empty ledger
  refuses rather than fabricating a zero-entry success.
- `modelCalls: 0`, `remoteCalls: 0`, `learningPromoted: false`,
  `activated: 0`, `humanDecision: 'REQUIRED'`; pure composition (no
  fs, no network, no clock, no randomness); database-free (injected
  store, read-only) — the module class a shell surface MAY import,
  though this rung adds no shell surface.

## Disclosed residuals

- The view reads the provenance refs AS CARRIED in the ledgered
  candidates' evidenceRefs. It does NOT re-verify that a
  register-entry digest still exists in a reading register, or that a
  document digest matches a live binding — re-derivation happened
  behind the 12D-276/277/278 doors; the view is a lens over the
  ledger's own bytes, not a re-proof of the chain that fed them.
- The record carries the FIRST ref of each kind; extra provenance refs
  (if any) stay in the candidate bytes and are not enumerated in the
  record (they remain inspectable in the ledger line itself).
- The 256-entry view bound is a policy choice (an operator opens
  narrower views of a fuller ledger); it is disclosed in the policy,
  not hidden.

## Exact files

- `services/ai/runtime/offline-team/xiv-reading-provenance-view.ts`
  (new)
- `services/ai/runtime/offline-team/xiv-reading-provenance-view.test.ts`
  (new, 10 tests — reading provenance read from a verified ledger
  (full REAL chain: register → prepare → bound admit → claim → settle
  → review → 12D-279 evidence → 12D-269 recorded approval → 12D-264
  append); plain candidate as otherEntry; tampered-ledger refusal;
  empty-ledger refusal; malformed carried source-id ref; malformed
  carried digest ref; over-budget view refusal; never-saves spy;
  malformed store/genesis refusals; determinism + policy/guardrail
  pins)
- `services/ai/runtime/offline-team/xiv-pathway-ledger.ts` — ONE
  additive export: `replayPathwayLedgerEntries` (read-only verified
  replay; no behavior change; the 12D-264 suite still passes)
- `services/ai/package.json` — `test:12d-281`, `typecheck:12d-281`
- `.gitlab-ci.yml` — `typecheck:12d-281`, `test:12d-281` steps
- `docs/ai-agents/12d-281-reading-provenance-view-handoff.md` (this
  file)

## Exact commands and local results

```
npm run typecheck:12d-281  # RAN: exit 0
npm run test:12d-281       # RAN: 10/10 pass
sibling run via tsx --test # RAN: 115/115 (12 chain suites, incl. 12D-280)
shell npm run build        # RAN: compiled (unchanged shell tree)
```

## Defects found and paid down during this story

- (suite-caught) the first view validated digest-shaped provenance
  refs only on entries that CLAIMED reading provenance — a plain
  candidate carrying a malformed `reading-document-sha256:` ref sailed
  through. The suite caught it; the view now validates digest-shaped
  refs on EVERY entry.
- (suite-caught, paid down during 12D-282 authoring, BEFORE the 12D-281
  commit) the first view refused a `null` ledger store but accepted an
  empty ARRAY of lines as a zero-entry success — contradicting the
  "an empty ledger refuses rather than fabricating a zero-entry
  success" rule above. The 12D-282 view-model suite caught it; the
  view now refuses `entries.length === 0` ("no pathway ledger found;
  the view never fabricates a zero-entry success"), and the 12D-281
  suite covers the empty-array case.

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no merge, no
deployment, no learning promotion, no activation of anything, no
credential use. The commit stages ONLY the files above and never
touches `services/ai/.xiv-runtime/` or `services/ai/provision-12d-99.ts`.

## Next candidates

- A shell surface for this view (operator-facing provenance census) —
  the view module is deliberately database-free and shell-importable;
  the surface itself is its own rung.
- The measured scratch run of 12D-280 against the REAL local Ollama is
  DONE (2026-09-16, presidio-bound chunk settled AWAITING_REVIEW,
  disclosed in the 12D-280 handoff); a standing supervised
  read→first-read→review loop is the natural next rung (CEO-gated for
  anything beyond loopback).
- Adopt the bound bridge as the ONLY admission door — CEO decision.
- The 12D-243/12D-245 operator questions (fail-closed,
  CEO-decision-gated).
- Rail integration for 12D-266 (BLOCKED on CEO authorization +
  credentials).
- GitHub Phase 1 lockdown (blocked on the CEO's `! gh auth login`).