# 12D-310 — Assistant Memory CITED Turn (the memory block as citable provenance)

**Story rung:** 12D-310 · **Policy:** `12d-310-v1` · **Commit:** this commit ·
**Parents:** 12D-307 (memory turn) / 12D-309 (the design rung named this)

## What was built

The 12D-309 handoff's design rung: the reviewed memory block is now
**citable provenance** — the assistant turn not only SEES the reviewed
facts (12D-307), the draft cites the exact reviewed storyIds it relied
on, and the door FAILS CLOSED against fabricated provenance.

1. **`xiv-assistant-memory-cited-turn.ts`** (policy `12d-310-v1`) —
   `prepareAssistantMemoryCitedTurn({tenantId, turnId, userMessage,
   memoryPacket})`: exact-key gate (4 keys, in order); the memory
   packet RE-VERIFIED through the REAL 12D-306 gate; tenant bound; the
   memory block composed through the REAL 12D-307 composer
   (`composeMemoryBlock` — reused, never reimplemented, no committed
   module edited); the prompt adds **`CITATION_LABEL`** — OUR OWN
   label instructing the model to cite as `[mem:<storyId>]` using ONLY
   the storyIds listed in the block, never to invent or modify an id;
   the composed prompt is checked against
   **`COMPOSED_MEMORY_CITED_TURN_PROMPT_CHARS` — DERIVED** from the
   REAL 12D-307 bound plus the citation label; over-ceiling refuses,
   never truncates. `runAssistantMemoryCitedTurn` is the 12D-300
   lineage run door PLUS the citation gate: after the model pin, the
   post-call secret screen, and the reply bounds, every
   `[mem:<storyId>]` in the reply is extracted with a strict pattern
   (`extractCitedStoryIds`, distinct, in order) and verified against
   the VERIFIED carried set — **a draft citing a storyId outside the
   carried set refuses POST-CALL** (fabricated provenance never
   passes; the caller ran — disclosed in the reason, never echoed).
   A reply citing NOTHING drafts honestly with `citedCount 0` — the
   render discloses it as an UNGROUNDED draft rather than dressing it
   up as memory-grounded.

2. **`xiv-assistant-memory-cited-turn-view-model.ts`** (policy
   `12d-310-v1`) — `buildAssistantMemoryCitedTurnViewModel`: exact
   -key gate per status (18 DRAFTED keys / 9 REFUSED keys, in order),
   digest RE-DERIVED from the reply text, secret re-screen, model pin,
   flags pinned, the citation structure re-gated (count === array
   length, every id bounded and id-shaped, all distinct, count ≤
   carried), citedCount 0 rendered honestly as an UNGROUNDED draft.

3. Runtime-only rung (disclosed residual): NO shell surface yet — the
   12D-307 precedent; a cited shell panel is a later rung.

## The live finding (measured, honest — the gate earning its keep)

Three LIVE attempts against the REAL local Ollama
(qwen2.5-coder:7b, loopback, remoteCalls 0), real queue packet
(memoryCarried 6 of memoryDoneCount 15):

- **Attempt 1: the model FABRICATED 2 storyIds** — the citation gate
  refused the draft POST-CALL (`fabricated provenance never passes`).
  A real 7B model invents ids when told to cite; the fail-closed gate
  caught it, exactly as designed.
- **Attempts 2 and 3: the model cited HASH HEADS, then nothing** —
  both drafted with `citedCount 0` and are disclosed as UNGROUNDED
  drafts (draft sha256s recorded; modelCalls 1 each).
- **The fabricated-citation negative** (fake caller, never the real
  model): a reply citing `doc-fabricated-chunk-9` refused POST-CALL.

The suite proves the valid-citation DRAFTED path (exact ids verified,
`citedStoryIds` carried in the packet); the live runs prove the gate
catches REAL fabrication and discloses imperfect grounding instead of
laundering it. A 7B local model cannot reliably produce exact storyId
citations — which is precisely why the door must verify, never trust.

## Verification (measured, local)

- `npm run typecheck:12d-310` → exit 0; sibling typechecks 12d-307,
  12d-308, 12d-302, 12d-306 → exit 0 (no committed module changed).
- `test:12d-310` → **27/27** (15 contract + 12 view model); sibling
  suites together → **75/75** (310 ×2, 308 ×2, 307, 302).
- Full chain regression: **1349/1349** across **237** test files
  (`.xiv-runtime/regression-12d-310.log`, scratch, never committed).
- Python backend suite → OK (37 tests).
- Shell build → exit 0 (unchanged shell tree).
- **Live measure**: `.xiv-runtime/run-live-cited-12d-310.ts` — see the
  live finding above.

## Honest scope (what this is NOT)

- NOT learning: the citations are provenance links to independently
  human-reviewed DONE facts; `learningPromoted false` pinned.
- NOT a verification that the model's USE of a fact is faithful — the
  gate verifies the cited ID exists in the carried set; whether the
  draft's reasoning is right remains the operator's call
  (humanDecision REQUIRED).
- NOT conversation composition: a cited CONVERSATION door is a later
  rung; no committed module was edited (additive-only discipline — the
  12D-307/308 doors and view models are unchanged, re-verified).

## Flags (pinned, honest)

humanDecision REQUIRED · learningPromoted false · activated 0 ·
modelCalls 1 per drafted attempt (counted, CEO-approved local lineage)
· remoteCalls 0 · collectsNothing true · automaticRecovery false ·
billionUsersProven false · CI not claimed (ci_quota_exceeded) — local
verification is the measured evidence.

## Next candidates

- Cited memory CONVERSATION door (12D-308 + the citation gate).
- Shell surface for the memory turn family (12D-307/310 precedent).
- Review decisions on 21 settled drafts (mem0 ×6, cognee ×8,
  neural-memory ×7) — the CEO's; on approval they flow 12D-269 →
  12D-264 and become memory-eligible.
- Remaining unread directive-#4 sources: OpenViking (AGPLv3 —
  reference only), Memary, openhuman, open-brain, openwiki.