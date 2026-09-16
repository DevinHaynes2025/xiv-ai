# 12D-284 — Supervised Reading Cycle CLI (handoff)

Status: COMMITTED with the commit carrying this file on
`claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-supervised-reading-cycle.cli.ts`
+ 5 adversarial tests). **TEST RUN DISCLOSED**: `test:12d-284` = **5/5
pass**; `typecheck:12d-284` (strict tsc over the CLI + cycle chain) =
**exit 0**. Sibling chain regression (single tsx run): **134/134 across
14 chain suites**. Shell build: compiled (RUNTIME-ONLY rung — the CLI
is the operator's command-line door; nothing is added to the story
shell). **CI IS NOT CLAIMED PASSED** (`ci_quota_exceeded`). Reviewers:
CLAUDE_CODE (self-review). GROK_XAI review PENDING — never fabricated.

## What this rung is

The 12D-283 handoff's first "Next candidate" pair, both delivered:

1. **The measured scratch run of the 12D-283 cycle against the REAL
   local Ollama** (scratch `.xiv-runtime/supervised-cycle-live-demo.ts`,
   never committed): the cycle ingested a 3-chunk local GHG-facts
   document, bound it to the registered `datagov-catalog` source, and
   the LOCAL qwen2.5-coder:7b settled chunk-1 AWAITING_REVIEW —
   `remainingReady: 2` (exactly one chunk per invocation), modelCalls
   1, remoteCalls 0, draft 416 chars, draft digest recorded, stopped
   before review/12D-269/12D-264 (verbatim packet in the demo output).
2. **The operator CLI** `xiv-supervised-reading-cycle.cli.ts`: one
   invocation = one cycle through the REAL 12D-283 contract. The
   standing loop is the operator re-running the command.

Fail-closed discipline: EXACT args (8 flags, each exactly once, with a
value; unknown/duplicate/missing flags, short genesis, oversized title
refuse — the pure parser is exported and adversarially tested); LOCAL
I/O only (the body file, the register file, the queue file — all named
by the operator); the model call is the loopback caller pinned to the
12D-280 policy endpoint + model name (remoteCalls 0 — loopback is not
remote); the cycle never throws (12D-283), so a refusal packet prints
verbatim with exit code 2 and a verified packet with exit code 0 — the
CLI adds nothing, hides nothing; refusals carry ZERO document text;
the queue is always closed (the suite proved the close-then-cleanup
ordering). All gates (credential-shaped content, duplicate admission,
queue head, model identity, draft gates) live in the REAL contracts;
this CLI re-implements none of them.

## Disclosed residuals

- The loopback caller is the only network-adjacent code in the rung;
  it is pinned by policy constants, and its HTTP path is exercised in
  the scratch live run rather than the committed suite (the suite
  covers the parse, the file store, and the refusal composition).
- The CLI prints the packet to stdout only; it never renders UI, never
  activates, never reviews its own draft.

## Exact files

- `services/ai/runtime/offline-team/xiv-supervised-reading-cycle.cli.ts`
  (new)
- `services/ai/runtime/offline-team/xiv-supervised-reading-cycle.cli.test.ts`
  (new, 5 tests)
- `services/ai/package.json` — `test:12d-284`, `typecheck:12d-284`
- `.gitlab-ci.yml` — `typecheck:12d-284`, `test:12d-284` steps
- `docs/ai-agents/12d-284-supervised-reading-cycle-cli-handoff.md`
  (this file)
- Scratch (NEVER committed): `services/ai/.xiv-runtime/supervised-cycle-live-demo.ts`

## Exact commands and local results

```
npm run test:12d-284          # RAN: 5/5 pass
npm run typecheck:12d-284     # RAN: exit 0
sibling run via tsx --test    # RAN: 134/134 (14 chain suites)
shell npm run build           # RAN: compiled (unchanged shell tree)
scratch live demo             # RAN: MEASURED_12D_283 (real Ollama, see above)
```

## Defects found and paid down during this story

- (suite-caught) the first command test's cleanup ran before the
  promise settled (EPERM on the still-open SQLite file) — the test was
  restructured to await the command before cleanup.
- (suite-caught) two argv-refusal fixtures accidentally tripped the
  length gate instead of the duplicate/unknown-flag gates — the
  fixtures were rebuilt so each gate is exercised by its own refusal.

## Approval status

`modelCalls: 1` per verified cycle (the 12D-280 CEO approval covers the
loopback first reader), `remoteCalls: 0`, no provisioning, no merge, no
deployment, no learning promotion, no activation of anything, no
credential use. The commit stages ONLY the files above and never
touches `services/ai/.xiv-runtime/` or `services/ai/provision-12d-99.ts`.

## Next candidates

- Adopt the bound bridge as the ONLY admission door — CEO decision.
- A second invocation of the live cycle (the GHG queue's chunk-2 is
  READY; the duplicate gate and the one-chunk budget are the designed
  behavior the operator walks through).
- The 12D-243/12D-245 operator questions (fail-closed,
  CEO-decision-gated).
- Rail integration for 12D-266 (BLOCKED on CEO authorization +
  credentials).
- GitHub Phase 1 lockdown (blocked on the CEO's `! gh auth login`).