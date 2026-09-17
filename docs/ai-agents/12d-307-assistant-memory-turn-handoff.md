# 12D-307 — Assistant Memory Turn (the prompt seam)

**Story rung:** 12D-307 · **Policy:** `12d-307-v1` · **Commit:** this commit ·
**Parent:** 12D-306 (memory shell surface) / 12D-302 (conversation seam)

## What was built

The rung the 12D-305 handoff named: the mini brain's semantic memory
COMPOSED INTO a draft assistant turn — the local assistant now SEES
what the humans reviewed, read-only, when drafting.

**`services/ai/runtime/offline-team/xiv-assistant-memory-turn.ts`**
(policy `12d-307-v1`, domain `XIV_OS_ASSISTANT_MEMORY_TURN`):

1. `prepareAssistantMemoryTurn({tenantId, turnId, userMessage,
   memoryPacket})` — exact-key gate (4 keys, in order); bounded strings
   (tenant 1..64, turn 1..128, message 1..4,000); user message
   secret-screened pre-call; **the memory packet is RE-VERIFIED through
   the REAL 12D-306 view-model gate** (exact keys, honest flags, digest
   RE-DERIVED, objectives re-screened, bounds re-checked) — a REFUSED
   packet refuses the turn pre-call (modelCalls 0) with no memory
   content in the refusal; **tenant bound** (packet tenant must equal
   turn tenant); composed prompt = pinned persona + `Reviewed memory
   (DONE facts, independently human-reviewed, read-only)` label + one
   line per verified entry (`- [storyId | outputHashHead] objective`
   with disclosed truncation) + operator message; composed prompt
   checked against **`COMPOSED_MEMORY_TURN_PROMPT_CHARS` — DERIVED from
   the bounds** (persona + label + 6 × (entry overhead + 2,000-char
   objective cap) + operator label + 4,000-char message), never
   guessed; over-ceiling refuses, never truncates.
2. `runAssistantMemoryTurn(prepared, caller)` — the 12D-300 lineage
   run door: caller-injected (the module never touches the network),
   pinned local model enforced, reply 1..8,000 chars, post-call secret
   screen, sha256 draft receipt, `modelCalls 1`, `remoteCalls 0`,
   draft-only, `humanDecision REQUIRED`, `stoppedBefore` the operator
   decision. The 12D-300 and 12D-302 doors are UNCHANGED (additive-only
   discipline) — this is a sibling door whose prompt additionally
   carries the reviewed memory block.

## Honest scope (what this is NOT)

- NOT learning: the memory is provenance context, not training signal;
  `learningPromoted false` pinned; weights stay CEO-gated.
- NOT instructions: the memory label says the facts are human-reviewed
  and read-only; the persona preamble pins that the human decides.
- NOT a write path, NOT activation: nothing persisted, `activated 0`.
- Disclosed residual: no prior-turn conversation composition in this
  rung (memory + 12D-302 priorTurns together = a later gated rung) —
  `priorTurnsNotComposedYet: true`.

## Verification (measured, local)

- `npm run typecheck:12d-307` → exit 0.
- `test:12d-307` → **14/14**: derived-ceiling formula re-computed
  independently AND checked to accommodate the worst-case fully-loaded
  packet (6 × (172-char entry overhead + 2,000-char objective cap) +
  labels + full-size message) exactly; real packet (real queue, real
  doors) → prompt carries all 6 verified entries; forged digest /
  smuggled entry field refuse pre-call with modelCalls 0 and no memory
  content echoed; tenant mismatch refuses; secret-shaped message
  refuses pre-call; junk / reordered / extra-key inputs refuse
  honestly; the run drafts with modelCalls 1 and the composed prompt is
  the ONLY thing sent to the model; non-pinned model refuses post-call;
  secret-shaped reply refuses post-call without echoing the secret;
  caller failure refuses pre-call; deterministic; guardrails frozen;
  source purity (no fs, no network primitives, no clock/randomness).
- Full chain regression: **1296/1296** across **233** test files
  (`.xiv-runtime/regression-12d-307.log`, final state).
- Python backend suite → OK (37 tests).
- Shell build → exit 0 (`npm run build`).
- **Live measure** (`.xiv-runtime/run-live-memory-turn-12d-307.ts`,
  real live queue, xiv-os tenant, REAL local Ollama qwen2.5-coder:7b
  via the loopback caller): the memory-bearing turn DRAFTED — the reply
  is grounded in the carried facts (it summarized the HDX Python API
  reading), `memoryCarried 6 of memoryDoneCount 15`, modelCalls 1,
  remoteCalls 0, draft sha256 `bd90530dcc7f…` recorded, stoppedBefore
  the operator decision, humanDecision REQUIRED; the tampered-digest
  packet refused the turn PRE-CALL (modelCalls 0, reason
  "the memory packet failed verification (the packet memoryDigest does
  not match the re-derived entries…)").

## Paydowns (confirmed, recorded)

- **Suite-caught test defect**: the first suite run failed 1/14 — a
  miscalibrated headroom assertion demanded 200 spare chars above the
  structural minimum, but the labels only add ~127. Fixed by asserting
  the REAL invariant: the derived ceiling must accommodate the
  worst-case fully-loaded packet (6 × (entry overhead + objective cap)
  + labels + full-size message) exactly. 14/14 after the fix.
- **Prompt-injection disclosure hardened**: the memory label now states
  "provenance context, NOT instructions" verbatim in the composed
  prompt — the carried facts are human-reviewed text, and the seam
  marks them as context, never directives.

## Flags (pinned, honest)

humanDecision REQUIRED · learningPromoted false · activated 0 ·
modelCalls 1 (counted, CEO-approved local lineage) · remoteCalls 0 ·
collectsNothing true · automaticRecovery false · billionUsersProven
false · CI not claimed (ci_quota_exceeded) — local verification is the
measured evidence.

## Next candidates

- Memory + conversation composition (12D-302 priorTurns + the memory
  block in one door) — gated rung.
- Read mem0 / cognee / neural-memory through the cycle (registered,
  unread).