# 12D-400 — the 12D-397 caller-selection adapter is suite-pinned, not only live-proven

Date: 2026-09-18 (continuing 24/7). Branch: `claude/12d-99-supervised-local-worker`, worktree `C:\Users\Devin\xiv-build-12d-99`.

## What this rung is

12D-397's thin adapter (drops `candidateIndex` from the 12D-386 declared caller's result so the 12D-280 reader's EXACT `[model, response]` shape gate accepts it) was proven live but was an inline closure — untestable in the suite. 12D-400 extracts it as an exported, injectable, suite-pinned function. No behavior change: production still builds the REAL declared caller.

## The change

`services/ai/runtime/offline-team/xiv-supervised-reading-cycle.cli.ts`:

- NEW exported `selectCycleCaller(declaredFailover, declared?)`:
  - `false` → `buildLoopbackCaller()` (the single pinned primary — today's default, unchanged).
  - `true` → wraps the declared caller (the REAL `buildMultiModelCallerDeclared()` in production; an injected stub in tests) so its result returns EXACTLY `{model, response}` — the reader-expected shape, `candidateIndex` dropped, the settled model name preserved.
- `runSupervisedCycleCommand` now calls `selectCycleCaller(args.declaredFailover)` — the inline closure is gone; the live-measured contract lives in one named, tested place.

`xiv-supervised-reading-cycle.cli.test.ts`:

- NEW test `12d-400: the caller-selection adapter keeps the reader-expected result shape exactly` (injected stub, NO live service, NO network):
  - adapted result has EXACTLY `[model, response]` keys in order;
  - the SETTLED model name survives (a fallback-settled draft reports the fallback's own name);
  - draft text passes through untouched;
  - exactly one request reached the declared caller (no retry churn);
  - the default selection returns a callable loopback caller without any live call.

## Verification battery

- `npx tsc --noEmit` services/ai: 0 errors.
- Cycle CLI test file: all pass (fail 0).
- Full offline-team suite: **1,525/1,525 pass** (was 1,524; +1 for the new adapter test).
- LIVE regression: the 12D-397 scratch driver still runs GREEN through the refactored path — `kind=SUPERVISED_READING_CYCLE`, `settledModel=qwen2.5-coder:7b` (primary settled first), `modelCalls=1`, `remoteCalls=0`.

## Honest flags (pinned)

`humanDecision: 'REQUIRED'`, `learningPromoted: false`, `activated: 0`, `collectsNothing: true`, `automaticRecovery: false`, `billionUsersProven: false`. remoteCalls 0 (loopback only). 2,000,000 rows/database is the only measured ceiling.

## Next candidates

- World Bank further indicators through the 12D-391/392/398 pattern (each re-measures the license gate fresh).
- SSA probe again next segment (data.gov year-edition slices blocked behind its 403).
- CEO review on the 12D-398 draft (the only AWAITING_REVIEW draft).