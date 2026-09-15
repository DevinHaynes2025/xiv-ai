# 12D-253 — XIV Multi-Agent Consensus Arena (handoff)

Status: COMMITTED on `claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-multi-agent-arena.ts` + 13
adversarial tests). **TEST RUN DISCLOSED**: `test:12d-253` = **13/13
pass**, `typecheck:12d-253` (strict) = **exit 0**; sibling regressions
all green — 15 suites, 167 tests, 0 failures (counts below). CI IS NOT
CLAIMED PASSED (`ci_quota_exceeded`). Reviewers: CLAUDE_CODE
(self-review; every pre-run defect listed). GROK_XAI review PENDING —
never fabricated.

## What it is

The fail-closed CONTRACT layer for the CEO-directed 4-Agent Consensus
Arena (Orchestrator → Generator → Adversary → Judge). **This module
wires NO model and calls NOTHING remote** — `modelCalls: 0`,
`remoteCalls: 0`. It is the boundary the (future, per-use-authorized,
local) agents must pass through; the envelopes today are
operator-authored. Four structural rules, each enforced in code:

1. **Zero Free-Text Chat** — every envelope is an exact-key JSON object
   (`envelopeVersion, role, turn, goalDigest, parentDigest, payload`),
   with the payload kind BOUND to the role (a GENERATOR cannot speak a
   VERDICT; the ORCHESTRATOR speaks only PLAN_TOPOLOGY — plan topology,
   never code or commands). Any extra key, reordered key, or wrong pair
   refuses.
2. **Turn Limits** — the Generator↔Adversary debate runs at most 3
   turns. A FAIL verdict on turn 3 CLOSES the transcript: no further
   steps of any kind, gate = HUMAN_DECISION_REQUIRED, nothing released.
   An endless debate loop is structurally impossible.
3. **Immutable Memory** — the transcript is an append-only hash chain:
   every envelope's `parentDigest` is the previous envelope's digest
   (or `ARENA_GENESIS`). `verifyArenaTranscript` replays the whole
   chain through the same gates; any mutation, drop, or forgery refuses.
4. **Consensus Gate + sole-judge release** — `gateConsensus` returns
   AUTHORIZED only when the transcript ENDS with a judge CONSENSUS step
   AND the last adversary verdict is an explicit PASS. `deriveArenaReceipt`
   additionally requires a fully verified 12D-241 StoryShellPacket whose
   packetId the judge step binds, and derives a deterministic receipt
   over `{transcriptDigest, packetId}` — the released packet is
   cryptographically bound to exactly the debate that authorized it.

## Honest flag pinned everywhere

`humanDecision: 'REQUIRED'`, `learningPromoted: false`, `remoteCalls:
0`, `modelCalls: 0`, `billionUsersProven: false`,
`automaticRecovery: false`. AUTHORIZED means **ready for human review,
never an approval** — the released packet still renders HUMAN DECISION
REQUIRED (12D-241/12D-242 discipline).

## Defects found and paid down during this story

- **(self-review, pre-run):** a stray `light: ;` label left inside the
  CONSENSUS payload gate — dead syntax that would have embarrassed the
  first tsc run; removed before running anything.
- **(self-review, pre-run):** the receipt originally wrote
  `if (!verdict.ok) throw` — dead code, because the 12D-242 wire
  verifier THROWS on tamper and never returns `ok:false`. Replaced with
  the throw-as-refusal contract plus a positive `verdict.packetId`
  binding (the receipt now binds the VERIFIED digest, not the packet's
  self-declared field).
- **(self-review, pre-run, test-side):** the debate-builder helper
  chained turn N's Generator to the *Generator* of turn N-1 instead of
  the Adversary — a stale-parent bug that broke the chain on every
  multi-turn fixture; every generator/adversary step now links to the
  current head.
- **(suite-caught, twice):** tamper tests expected the *chain* message
  where the *role-sequence* gate fires first (a judge behind a FAIL, a
  dropped adversary) and expected a gate VALUE from an internally
  inconsistent truncated transcript — the verifier correctly refuses
  all three; fixtures corrected, regexes widened to the real gate
  messages. The module needed no changes for any suite-caught finding.

## Disclosed residuals (verbatim carry-overs)

- A debate between impostor agents authorizes nothing real: the arena
  authenticates the STRUCTURE of consensus, not the identity or honesty
  of whichever agent authored an envelope (12D-233 residual).
- Possession of a transcript is not proof a debate happened — this
  contract records; it does not witness (12D-236 residual).
- CI remains quota-blocked; GROK_XAI review remains PENDING. Neither is
  ever claimed.
- Model wiring is a FUTURE story requiring explicit per-use
  authorization; no API keys exist and none may be pasted in chat.

## Exact files

- `services/ai/runtime/offline-team/xiv-multi-agent-arena.ts` (new)
- `services/ai/runtime/offline-team/xiv-multi-agent-arena.test.ts`
  (new, 13 tests)
- `docs/ai-agents/12d-253-multi-agent-arena-handoff.md` (this file)
- `services/ai/package.json` — `test:12d-253`, `typecheck:12d-253`
- `.gitlab-ci.yml` — `typecheck:12d-253`, `test:12d-253`

## Exact commands and local results

```
npm run test:12d-253      # RAN: 13/13 pass
npm run typecheck:12d-253 # RAN: strict, exit 0
```

Sibling regressions this cycle (run from `services/ai`): 12d-233 13/13,
12d-236 13/13, 12d-237 12/12, 12d-238 11/11, 12d-239 13/13, 12d-240
13/13, 12d-241 13/13, 12d-242 14/14, 12d-244 14/14, 12d-247 12/12,
12d-248 7/7, 12d-249 9/9, 12d-250 8/8, 12d-251 7/7, 12d-252 8/8 — all
green. 167 sibling tests, 0 failures; 180 including 12D-253.

CI: NOT RUN, NOT CLAIMED — `ci_quota_exceeded` persists.

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no production
mutation, no merge, no deployment, no learning promotion, no external
fetch, no installer execution, no model wiring. The commit stages ONLY
the files above and never touches `services/ai/.xiv-runtime/` or
`services/ai/provision-12d-99.ts`.

## Next candidates

The story-shell front-end (12D-254: wire the 12D-242 view model into
the scaffolded `services/xiv-story-shell`), the arena CLI adoption
layer (mirroring 12D-250/252), and the still-open 12D-243/12D-245
operator questions. The GitHub Phase 1 lockdown remains blocked on the
CEO's `! gh auth login`.