# 12D-256 — Multi-Agent Arena CLI (handoff)

Status: COMMITTED on `claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-multi-agent-arena.cli.ts` + 9
adversarial tests). **TEST RUN DISCLOSED**: `test:12d-256` = **9/9
pass**, `typecheck:12d-256` (strict) = **exit 0**; sibling regressions:
see the counts section below (filled in only after the sweep ran).
CI IS NOT CLAIMED PASSED (`ci_quota_exceeded`). Reviewers: CLAUDE_CODE
(self-review; defects listed). GROK_XAI review PENDING — never
fabricated.

## What it is

The operator adoption layer for the 12D-253 Consensus Arena, in the
12D-238/12D-250/12D-252 CLI pattern:

```
node xiv-multi-agent-arena.cli.ts --transcript=<path> --packet=<path>
```

One explicit action per invocation, operator-invoked, non-daemonic,
LOCAL plane only. It reads ONE debate transcript and ONE packet file
from local disk, replays the append-only hash chain fail-closed
(12D-253 full replay), gates the consensus, and — ONLY on AUTHORIZED
consensus with a fully verified, judge-bound packet — prints the frozen
verdict packet carrying the deterministic arena receipt (byte-compared
against direct derivation in the happy-path test).

Fail-closed shape (verbatim 12D-252 discipline): strict `--key=value`
args (only the FIRST `=` splits, known keys only — exactly `transcript`
and `packet`), per-argument refusals by name, malformed files refuse
(invalid JSON, arrays, unreadable paths), a tampered transcript refuses
on chain replay, an EXHAUSTED debate or ABORTED judge refuses with the
gate's reason (a debate that authorized nothing gets NO verdict packet
— the refusal IS the honest report), a non-binding packet refuses, the
CLI never writes, and failures print an error packet to stderr and
exit 2.

## Defects found and paid down during this story

- **(self-review, pre-run, module docstring):** the first draft claimed
  a HUMAN_DECISION_REQUIRED gate would be "reported honestly" in a
  result packet — but `deriveArenaReceipt` throws on such transcripts,
  so the actual behavior is refusal + exit 2. Fixed the docstring to
  match the code: the refusal names the gate's reason; nothing is
  released. (Behavior was already fail-closed; the comment was wrong.)
- **(first-run tsc catch):** the policy test referenced
  `ARENA_CLI_HONEST_FLAGS` without importing it — TS2304, fixed.

## Disclosed residuals (verbatim carry-overs)

- Possession of a transcript is not proof a debate happened; the arena
  authenticates the STRUCTURE of consensus, not the honesty of the
  agents (12D-233/253 residuals).
- AUTHORIZED means ready for human review, never an approval.
- CI remains quota-blocked; GROK_XAI review remains PENDING. Neither is
  ever claimed.

## Exact files

- `services/ai/runtime/offline-team/xiv-multi-agent-arena.cli.ts` (new)
- `services/ai/runtime/offline-team/xiv-multi-agent-arena.cli.test.ts`
  (new, 9 tests)
- `docs/ai-agents/12d-256-arena-cli-handoff.md` (this file)
- `services/ai/package.json` — `test:12d-256`, `typecheck:12d-256`
- `.gitlab-ci.yml` — `typecheck:12d-256`, `test:12d-256`

## Exact commands and local results

```
npm run test:12d-256      # RAN: 9/9 pass
npm run typecheck:12d-256 # RAN: strict, exit 0
```

Sibling regressions this cycle (run from `services/ai`): 12d-233 13/13,
12d-236 13/13, 12d-237 12/12, 12d-238 11/11, 12d-239 13/13, 12d-240
13/13, 12d-241 13/13, 12d-242 14/14, 12d-244 14/14, 12d-247 12/12,
12d-248 7/7, 12d-249 9/9, 12d-250 8/8, 12d-251 7/7, 12d-252 8/8,
12d-253 13/13, 12d-254 7/7 — all green. 180 sibling tests, 0 failures;
189 including 12D-256.

CI: NOT RUN, NOT CLAIMED — `ci_quota_exceeded` persists.

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no production
mutation, no merge, no deployment, no learning promotion, no external
fetch, no installer execution. The commit stages ONLY the files above
and never touches `services/ai/.xiv-runtime/` or
`services/ai/provision-12d-99.ts`.