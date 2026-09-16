# 12D-286 — Reading Draft Receipt Shell Surface (handoff)

Status: COMMITTED with the commit carrying this file on
`claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-reading-draft-receipt-view-model.ts`
+ 9 adversarial tests; shell route + panel + page wiring). **TEST RUN
DISCLOSED**: `test:12d-286` = **9/9 pass**; `typecheck:12d-286` (strict
tsc over the view model + the split receipt core + the queue door +
the ingest/binding/admission/register/queue chain) = **exit 0**; the
12D-285 suite still **9/9** after the split (`typecheck:12d-285`
exit 0). Sibling regression: **175/175 across 18 chain suites**
(12 reading-chain suites + xiv-bound-reading-evidence + the two
pathway suites + queue-census/offline-story-queue/shell-ingest/
tenant-routed-queue). Shell build: **compiled** with the new
`/api/ingest/draft-receipt` route mounted. **CI IS NOT CLAIMED PASSED**
(`ci_quota_exceeded`). Reviewers: CLAUDE_CODE (self-review). GROK_XAI
review PENDING — never fabricated.

## What this rung is

The first candidate from the 12D-285 handoff: a shell surface for the
draft receipt, built on the 12D-272 view-model pattern. The PURE part
is shell-importable; the queue door stays runtime-side:

1. **`buildReadingDraftReceiptViewModel(raw)`** — the only door from a
   raw draft-receipt submission to the UI. Never throws. The exact-keys
   gate runs first, then the REAL 12D-285 pure receipt door
   (`buildReadingDraftReceipt`) re-derives the digest from the submitted
   draft text, re-applies the credential-shaped-content gate, and holds
   the 8000-char budget. A verified view renders ONLY receipt metadata
   (digest, draftChars, model label, ids, review hint) — **the draft
   text is NEVER echoed back, verified or refused**. A refused view
   carries ZERO draft content (not the text, not the claimed digest,
   not the ids). Determinism proven on both branches.
2. **The queue door stays runtime-side** (restated in the module and
   pinned in the render's operator note): the shell holds no queue, so
   the queue cross-check (story exists, AWAITING_REVIEW, settled
   outputHash === draftSha256) happens in the operator's runtime via
   `verifyReadingDraftReceiptAgainstQueue` when the receipt is
   presented to the 12D-100 review door. The shell decides nothing and
   approves nothing — a receipt proves bytes, not quality.

Shell wiring (the 12D-282 pattern): `/api/ingest/draft-receipt` route
handler (runs the REAL door in the LOCAL server process; the browser
never runs the re-derivation and never receives refused content),
`draft-receipt-panel.tsx` (client surface, paste-or-file, honest refusal
render), and page.tsx wiring under the provenance panel.

## Defect found and paid down during this story

- (build-caught) The 12D-285 module coupled the PURE receipt door and
  the RUNTIME-SIDE queue door in one file that top-level imports
  `offline-story-queue` (SQLite-backed). Importing the pure door for the
  shell transitively pulled the queue into the Next build and the build
  failed with `Cannot find module 'node:sqlite'` (the 12D-273 lesson,
  pinned in the tree: "the story shell must never pull
  offline-story-queue"). **Paydown**: the pure door moved to
  `xiv-reading-draft-receipt-core.ts` (byte-for-byte the same contract;
  imports only node:crypto + the document-ingest gate — no queue), the
  committed `xiv-reading-draft-receipt.ts` keeps the queue door and
  RE-EXPORTS the core's pure door so the 12D-285 imports keep working
  unchanged, and the view model imports the core. Because the core
  mirrors `OLLAMA_FIRST_READER_POLICY.maxDraftChars` and the first-reader
  module also imports the queue, the mirror is PINNED in the core and
  RE-CHECKED against the REAL policy in the runtime-side module — a
  silent drift between the two fails fast there instead of diverging.
- (suite-caught) The first credential-shaped test fixture used
  `BEGIN RSA PRIVATE KEY` without the `-----` fencing the gate actually
  matches — the gate was correct; the fixture was rewritten to the real
  PEM shape. Measured 9/9 after both fixes.

## Disclosed residuals

- The verified view proves the reviewer holds text matching the CLAIMED
  digest — it does NOT run the queue cross-check (no queue in the
  shell) and proves nothing about authorship beyond the carried model
  label or about quality. The 12D-100 review door and the human
  decision stay downstream, untouched.
- The route accepts raw JSON text; there is no rate limit and no
  persistence — a refused submission leaves nothing behind, and a
  verified receipt is rendered, not stored.

## Exact files

- `services/ai/runtime/offline-team/xiv-reading-draft-receipt-core.ts`
  (new — the pure receipt door, split out; queue-free)
- `services/ai/runtime/offline-team/xiv-reading-draft-receipt.ts`
  (rewritten — queue door + re-exports of the core; contract unchanged)
- `services/ai/runtime/offline-team/xiv-reading-draft-receipt-view-model.ts`
  (new, + 9-test suite)
- `services/xiv-story-shell/src/app/api/ingest/draft-receipt/route.ts`
  (new)
- `services/xiv-story-shell/src/app/draft-receipt-panel.tsx` (new)
- `services/xiv-story-shell/src/app/page.tsx` (wiring)
- `services/ai/package.json` — `test:12d-286`, `typecheck:12d-286`
- `.gitlab-ci.yml` — `typecheck:12d-286`, `test:12d-286` steps
- `docs/ai-agents/12d-286-reading-draft-receipt-shell-handoff.md` (this file)

## Exact commands and local results

```
npm run test:12d-286          # RAN: 9/9 pass
npm run test:12d-285          # RAN: 9/9 pass (unchanged after the split)
npm run typecheck:12d-286     # RAN: exit 0
npm run typecheck:12d-285     # RAN: exit 0
sibling regression (tsx)      # RAN: 175/175 (18 chain suites)
shell npm run build           # RAN: compiled, /api/ingest/draft-receipt mounted
```

## Approval status

`modelCalls: 0` for this rung's own doors (the view model and the shell
route call no model), `remoteCalls: 0`, no provisioning, no merge, no
deployment, no learning promotion, no activation of anything, no
credential use. The commit stages ONLY the files above and never
touches `services/ai/.xiv-runtime/` or `services/ai/provision-12d-99.ts`.

## Next candidates

- A second invocation of the live 12D-283/284 cycle (the GHG queue's
  chunk-2 is READY) and a receipt built from its real draft, rendered
  through this new shell surface.
- Register the CEO-named public sources from the 2026-09-16 directive
  (github.com/GSA, NIST detection_limits, arxiv 2403.12029,
  caltech-fish-counting, BTS, CFPB, JPL SBDB, Austin/Texas Socrata,
  SBA, NSF NCSES, archives.gov, NYC SBS) as build references — licenses
  verified where checkable, disclosed where not — and run the
  supervised reading cycle on one of them end-to-end with a real
  receipt.
- Adopt the 12D-278 bound bridge as the ONLY admission door — CEO
  decision.
- The 12D-243/12D-245 operator questions (fail-closed,
  CEO-decision-gated).
- Rail integration for 12D-266 (BLOCKED on CEO authorization +
  credentials).
- GitHub Phase 1 lockdown (blocked on the CEO's `! gh auth login`).