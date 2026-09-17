# 12D-291 — LEGACY SUITE CONVERSION (12d-85…91 node:test paydown) (handoff)

Status: COMMITTED with the commit carrying this file on
`claude/12d-99-supervised-local-worker`. **TEST RUN DISCLOSED**:
`test:12d-291` = **25/25 pass** (the seven converted suites run
together); each converted suite passes standalone: 12d-85 2/2,
12d-86 3/3, 12d-87 4/4, 12d-88 4/4, 12d-89 3/3, 12d-90 3/3,
12d-91 6/6 — the disclosed gap is **PAID, not grandfathered**;
`typecheck:12d-291` = **exit 0**. Full chain regression
(12d-85…91 + 12d-270…291) = **256/256 across 29 suites, zero
failures**. Shell build (`services/xiv-story-shell` `npm run build`)
= **exit 0** (shell tree unchanged by this rung). **CI IS NOT CLAIMED
PASSED** (`ci_quota_exceeded`). Reviewers: CLAUDE_CODE (self-review).
GROK_XAI review PENDING — never fabricated.

## What this rung is

The 12D-288/289/290 handoffs each disclosed: "the 12d-85…91 suites
are not node:test suites" — they ran as bare `tsx <file>` scripts that
print custom `12D-XX …: OK` output, emit NO node:test summary, and are
therefore invisible to chain measurement (a silent breakage would pass
CI as long as the process exited 0). Paid down by converting all
seven to REAL `node:test` suites (`tsx --test`, `node:assert/strict`,
`test()` blocks), preserving every original scenario:

- **runtime-convergence-validator.test.ts** (12d-85): the safe
  converged runtime passes with every guardrail held; the broken
  runtime fails convergence with SYNTAX_RISK + EXPORT_GAP +
  GUARDRAIL_MISSING each detected.
- **offline-brain-agent-council.test.ts** (12d-86): ordinary mission
  seats a verified minimized external reviewer; TOP_SECRET keeps every
  external reviewer disabled; learning promotion (approved ordinary
  promotes; TOP_SECRET refuses; human approval required).
- **offline-brain-execution-ledger.test.ts** (12d-87): ledger hash
  chain verifies + summary guardrails; cross-tenant receipt rejected;
  TOP_SECRET external reviewer receipt rejected; incomplete council
  shows missing seats. (A FRESH ledger per test — the original built
  ONE ledger sequentially, and refusal behavior is independent of that
  ordering.)
- **local-model-collaboration-bus.test.ts** (12d-88): ordinary task
  enables both local collaborators with guardrails; CONFIDENTIAL
  disables the Claude review by default; TOP_SECRET disables it
  outright; pathway promotion (two independent reviews, ordinary
  class, human approved).
- **neural-pathway-growth-engine.test.ts** (12d-89): the eligible →
  active → degraded → rolled-back lifecycle; the weak unreviewed
  unapproved pathway refuses; best active pathway wins selection.
- **ollama-live-runtime-bridge.test.ts** (12d-90): pinned local model
  preferred; reachable loopback Ollama eligible with guardrails;
  unreachable Ollama not eligible.
- **agentic-brain-alignment-control-plane.test.ts** (12d-91): genome
  mutates no weights / no demographics; TOP_SECRET + local-only tools
  aligns OFFLINE_LOCAL; TOP_SECRET + remote tool DENY; parallel
  universe = classical simulator with nothing production; billions-
  ready refused without measured load evidence; the CEO progress
  packet addressed to Devin Xavier Haynes stays evidence-based.

The seven `test:12d-85…91` package.json scripts flipped from
`tsx <file>` to `tsx --test <file>` (the existing `.gitlab-ci.yml`
steps at lines 16-22 now run REAL suites with no CI edit); the rung
entry `test:12d-291` runs all seven together so the paydown is
measurable as a single rung, and `typecheck:12d-291` typechecks the
seven test files against their seven modules. NO contract module
changed — this is a measurement-honesty paydown only.

## Exact files

- `services/ai/runtime/offline-team/runtime-convergence-validator.test.ts` (converted)
- `services/ai/runtime/offline-team/offline-brain-agent-council.test.ts` (converted)
- `services/ai/runtime/offline-team/offline-brain-execution-ledger.test.ts` (converted)
- `services/ai/runtime/offline-team/local-model-collaboration-bus.test.ts` (converted)
- `services/ai/runtime/offline-team/neural-pathway-growth-engine.test.ts` (converted)
- `services/ai/runtime/offline-team/ollama-live-runtime-bridge.test.ts` (converted)
- `services/ai/runtime/offline-team/agentic-brain-alignment-control-plane.test.ts` (converted)
- `services/ai/package.json` — seven script flips + `test:12d-291`,
  `typecheck:12d-291`
- `.gitlab-ci.yml` — `typecheck:12d-291`, `test:12d-291` steps
- `docs/ai-agents/12d-291-legacy-suite-conversion-handoff.md` (this file)

## Exact commands and local results

```
npm run test:12d-291          # RAN: 25/25 pass (7 suites)
npm run typecheck:12d-291     # RAN: exit 0
chain regression 85..91+270..291  # RAN: 256/256 (29 suites, zero failures)
shell npm run build           # RAN: exit 0
```

## Defects found and paid down during this story

- (pre-existing, this rung's target) the seven 12d-85…91 "suites"
  printed custom OK output with no node:test summary — converted to
  REAL node:test suites, every scenario preserved, now chain-measurable.
- (disclosed, NOT this rung's debt) none outstanding from the prior
  handoffs: the 12d-113 audit debt was paid by 12D-289 and the
  12d-134/222 custody-registry debt by 12D-290.

## Approval status

No model calls (`modelCalls 0`), no remote calls (`remoteCalls 0`), no
provisioning, no merge, no deployment, no learning promotion, no
activation, no credential use. The commit stages ONLY the files above
and never touches `services/ai/.xiv-runtime/` or
`services/ai/provision-12d-99.ts`.

## Next candidates

- Review decisions on the FOUR settled drafts (GHG chunk-1/2/3 + the
  ALDI chunk-1, all AWAITING_REVIEW) — the human decision is Devin's.
- Read further CEO-named sources through the cycle (BTS, CFPB,
  Austin/Texas Socrata, NSF NCSES are registered; verify the Socrata
  dataset subjects before reading).
- Adopt the 12D-278 bound bridge as the ONLY admission door — CEO
  decision.
- The 12D-243/12D-245 operator questions (fail-closed,
  CEO-decision-gated); rail integration for 12D-266 (BLOCKED on CEO
  authorization + credentials); GitHub Phase 1 lockdown (blocked on
  `! gh auth login`).