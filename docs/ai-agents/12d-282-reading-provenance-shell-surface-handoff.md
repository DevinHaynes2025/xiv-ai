# 12D-282 — Reading Provenance Shell Surface (handoff)

Status: COMMITTED with the commit carrying this file on
`claude/12d-99-supervised-local-worker` — the shell surface for the
12D-281 reading provenance view (the first "Next candidate" of the
12D-281 handoff): `services/xiv-story-shell/src/app/provenance-panel.tsx`
+ `src/app/api/ingest/provenance/route.ts` + page.tsx wiring, over the
new view-model contract `services/ai/runtime/offline-team/
xiv-reading-provenance-view-model.ts` (+ 8 adversarial tests).
**TEST RUN DISCLOSED**: `test:12d-282` = **8/8 pass**; `typecheck:12d-282`
(strict tsc over the view-model chain) = **exit 0**; the 12D-281 suite
re-run with the empty-array paydown = **10/10 pass**; sibling chain
regression (single tsx run) = **119/119 across 13 suites**; shell build =
**compiled**. **CI IS NOT CLAIMED PASSED** (`ci_quota_exceeded`).
Reviewers: CLAUDE_CODE (self-review). GROK_XAI review PENDING — never
fabricated.

## What this rung is

The operator's window into reading provenance, in the story shell,
following the 12D-272 pattern exactly: the browser submits raw ledger
bytes (ledger genesis + ledger lines); the LOCAL route handler
re-verifies the WHOLE submission through the REAL 12D-264 replay and
the REAL 12D-281 view in the server process; only a frozen view model
reaches the browser; a refused submission's content never crosses.
No persistence, no write path, no remote calls (remoteCalls 0,
modelCalls 0).

- `buildReadingProvenanceViewModel(raw)` — the only door from raw
  ledger material to the UI: exact-keys input gate (`ledgerGenesis`,
  `lines`, in order), transient read-only store (save refuses — a
  provenance view can never append), replay + view, frozen VERIFIED
  display (measured counts, bySource, records carrying exactly the
  refs the ledgered candidates carry) or REFUSED with zero ledger
  content. The door NEVER THROWS.
- The 12D-282 authoring suite caught a REAL 12D-281 defect BEFORE the
  12D-281 commit: an empty lines ARRAY was accepted as a zero-entry
  success (only the null store refused). Paid down: the view refuses
  `entries.length === 0`; the 12D-281 suite covers the empty-array
  case; the 12D-281 handoff records the paydown.

## Disclosed residuals

- Provenance is CARRIED, NOT RE-PROVEN (12D-281 residual, pinned in
  the render): the view does not re-verify that a register digest
  still exists in a register or that a document digest matches a live
  binding; each record carries the FIRST ref of each kind.
- The panel renders the records' digests and source ids — that IS the
  provenance the operator asked to see; no document text ever renders.

## Exact files

- `services/ai/runtime/offline-team/xiv-reading-provenance-view-model.ts`
  (new)
- `services/ai/runtime/offline-team/xiv-reading-provenance-view-model.test.ts`
  (new, 8 tests)
- `services/xiv-story-shell/src/app/provenance-panel.tsx` (new)
- `services/xiv-story-shell/src/app/api/ingest/provenance/route.ts` (new)
- `services/xiv-story-shell/src/app/page.tsx` (two-line wiring: import
  + panel mount)
- `services/ai/package.json` — `test:12d-282`, `typecheck:12d-282`
- `.gitlab-ci.yml` — `typecheck:12d-282`, `test:12d-282` steps
- `docs/ai-agents/12d-282-reading-provenance-shell-surface-handoff.md`
  (this file)

## Exact commands and local results

```
npm run test:12d-282          # RAN: 8/8 pass
npm run test:12d-281          # RAN: 10/10 pass (with the empty-array paydown)
sibling run via tsx --test    # RAN: 119/119 (13 chain suites)
npm run typecheck:12d-282     # RAN: exit 0
shell npm run build           # RAN: compiled
```

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no merge, no
deployment, no learning promotion, no activation of anything, no
credential use. The commit stages ONLY the files above and never
touches `services/ai/.xiv-runtime/` or `services/ai/provision-12d-99.ts`.

## Next candidates

- The measured scratch run of the CEO's local GHG CSV through the real
  chain (12D-274 → 12D-278 → 12D-280 first reader) — scratch demo
  authored under `.xiv-runtime/`, run when the machine allows.
- A standing supervised read→first-read→review loop (CEO-gated beyond
  loopback).
- Adopt the bound bridge as the ONLY admission door — CEO decision.
- The 12D-243/12D-245 operator questions (fail-closed,
  CEO-decision-gated).
- Rail integration for 12D-266 (BLOCKED on CEO authorization +
  credentials).
- GitHub Phase 1 lockdown (blocked on the CEO's `! gh auth login`).