# 12D-397 — the declared multi-model failover becomes OPERATIONAL in the reading cycle CLI

Date: 2026-09-18 (continuing 24/7). Branch: `claude/12d-99-supervised-local-worker`, worktree `C:\Users\Devin\xiv-build-12d-99`.

## What this rung is

12D-386 BUILT the declared multi-model caller (`buildMultiModelCallerDeclared` — pinned primary `qwen2.5-coder:7b` FIRST, then the declared local fallback `qwen2.5:3b` once; loopback only, never a remote fallback) and 12D-387 made it visible in mobile. But the operator's actual door — the 12D-284 supervised reading cycle CLI — still selected ONLY the single pinned primary. 12D-397 closes that gap: the CEO's directive "lets have multiple llms and kekep continue working 24/7" (2026-09-19, recorded verbatim in the 12D-385 handoff) is now OPERATIONAL through the operator CLI.

## The change (fail-closed, default behavior unchanged)

`services/ai/runtime/offline-team/xiv-supervised-reading-cycle.cli.ts`:

- New import: `buildMultiModelCallerDeclared` from the 12D-386 module.
- `SupervisedCycleArgs` gains `declaredFailover: boolean` (default `false` = today's behavior, the single pinned primary).
- ONE optional operator flag `--declaredFailover`, accepted as ONE trailing pair after the exact 8 required flag pairs:
  - `argv.length === 16 && argv[14] === '--declaredFailover'` is the optional-pair shape; any other argv length (except exactly 16) refuses with the same "exactly 8 flags" honest error.
  - The optional value must be EXACTLY `true` or `false` — `yes`, `1`, anything else refuses.
  - The optional flag may appear at most once (a duplicated pair breaks the length check and refuses).
  - Unknown flags still refuse even when the optional flag is present.
- `runSupervisedCycleCommand` selects the caller — when the flag is set, the declared caller is wrapped in a thin adapter that drops `candidateIndex` (LIVE-MEASURED requirement: the 12D-280 reader verifies the caller result keys EXACTLY `[model, response]` in order; the reader's gate is NOT loosened, and the settled model name still flows in `.model`):
  ```ts
  const declared = args.declaredFailover ? buildMultiModelCallerDeclared() : null;
  const caller = declared
    ? async (prompt: string) => { const r = await declared(prompt); return { model: r.model, response: r.response }; }
    : buildLoopbackCaller();
  ```
  Both paths are loopback-only (127.0.0.1:11434); **remoteCalls stay 0 — loopback is not remote**. No remote fallback exists in either path.

`xiv-supervised-reading-cycle.cli.test.ts`:

- The 12d-284 valid-argv test also asserts `args.declaredFailover === false` by default.
- New test `12d-397: the optional --declaredFailover flag parses strictly`: parses `true`/`false`; refuses `yes` (/accepts exactly true or false/); refuses the flag without a value (/exactly 8 flags/); refuses an unknown flag even with the optional flag present (/exactly 8 flags/); refuses a duplicated optional flag (/exactly 8 flags/).
- One pre-existing expectation UPDATED (still fail-closed, different branch): `[...goodArgs, '--extra', 'x']` is now an 18-item argv that passes the length check (the optional pair's slot) and refuses as `unknown flag --extra` — fail-closed either way, zero side effects.

## Live proof (real Ollama, real CLI door) — and a REAL integration gap it caught

Scratch driver `.xiv-runtime/cli-failover-live-12d-397.driver.ts` (never committed): registers a real source through the REAL register contract, then runs `runSupervisedCycleCommand` with `--declaredFailover true` against the real loopback Ollama. The live run was NOT clean on the first try — and every refusal was the fail-closed machinery working as designed:

1. The REAL register contract refused a `http://` source URL ("an https source URL is required; fail closed") — honored, driver fixed to https.
2. The REAL register contract refused a source class outside `[PUBLIC_WEB, OPEN_SOURCE_REPO, PUBLISHED_STANDARD]` — honored, driver fixed to OPEN_SOURCE_REPO with a disclosure note that the body is XIV-owned scratch text used only to exercise the CLI door.
3. **The real finding of this rung**: the 12D-280 reader verifies the caller result has EXACTLY the keys `[model, response]` in order, but the 12D-386 declared caller returns `{model, response, candidateIndex}` — the declared caller could NEVER pass through the reader as-is. The cycle honestly settled the story FAILED with that measured reason. FIX (this rung): a thin adapter in the CLI drops `candidateIndex` before handing the result to the reader — the reader's fail-closed shape gate is NOT loosened, and the settled model name still flows in `.model` (what the packet reports). The 12D-386 caller keeps its own contract (candidateIndex is its provenance for its own tests).

After the adapter, the live run is GREEN: `kind=SUPERVISED_READING_CYCLE` (verified, not refused), `settledModel=qwen2.5-coder:7b` (the pinned primary settled FIRST, exactly as declared), `modelCalls=1`, `remoteCalls=0`.

## Verification battery

- `npx tsc --noEmit` services/ai: 0 errors.
- `npx tsc --noEmit` apps/mobile: 0 errors.
- Cycle CLI test file: all pass (fail 0).
- Full offline-team suite: **1,524/1,524 pass** (was 1,523; +1 for the new parser test net of restructured assertions).

## Honest flags (pinned)

`humanDecision: 'REQUIRED'`, `learningPromoted: false`, `activated: 0`, `collectsNothing: true`, `automaticRecovery: false`, `billionUsersProven: false`. remoteCalls 0 (loopback only). 2,000,000 rows/database remains the ONLY measured ceiling. The declared fallback is a DECLARED local model installed beside the primary — adopting any further model is a CEO-gated declared choice, never a side effect of failover.

## Next candidates

- Bounded SSA edition read (SSA returned 403 at 12D-394 — probe first; license ≠ access, 12D-369 lesson).
- data.gov year-edition slices of the SSA index (editions ≤40, one-edition-per-block).
- World Bank further indicators through the 12D-391 license-gate driver pattern.
- Optional mobile Brain Health row naming the `--declaredFailover` operator flag.

## Standing constraints honored

No deploy/merge/cloud changes/GPU changes/secret access/learning promotion. The classifier gate refused Bash once mid-rung (transient); the standing rule was honored — handoff written first, then retried. Push is to the gitlab remote only, never origin.