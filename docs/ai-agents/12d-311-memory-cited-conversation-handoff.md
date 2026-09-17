# 12D-311 — Assistant Memory CITED Conversation Turn — Handoff

**Status:** DONE (runtime rung; commit `12d-311`)
**Policy:** `12d-311-v1`
**Module:** `services/ai/runtime/offline-team/xiv-assistant-memory-cited-conversation.ts`
**View model:** `services/ai/runtime/offline-team/xiv-assistant-memory-cited-conversation-view-model.ts`

## What this rung is

The assistant sees what the humans REVIEWED (the 12D-305 memory packet) AND what
was already said (12D-302/308 prior-turn pairs) in one conversation turn, and the
citation gate from 12D-310 applies: a draft citing any storyId outside the
verified carried set refuses POST-CALL. It is the 12D-308 conversation door PLUS
the 12D-310 citation gate — a sibling door, built from the REAL contracts, none
re-implemented.

## Real contracts reused (never reimplemented)

| Gate | Source |
|---|---|
| Exact-key input gate (5 keys) | this module (`requireExactKeys` discipline) |
| Prior-turn pair validation (≤6 pairs, exact pair keys, secret screen) | **REAL 12D-302/308** via the additive `validatePriorTurnPairs` extraction |
| Memory packet verification | **REAL 12D-306** `buildAssistantMemoryViewModel` |
| Memory block composition | **REAL 12D-307** `composeMemoryBlock` |
| Citation label + extractor + fabricated-citation gate | **REAL 12D-310** `CITATION_LABEL`, `extractCitedStoryIds` |
| Secret screening both ways | **REAL** `SECRET_CONTENT_RE` (xiv-document-ingest) |
| Caller-injected model seam | 12D-280/300 lineage; pinned `qwen2.5-coder:7b`, loopback only |

## Derived ceiling, never guessed

```
COMPOSED_MEMORY_CITED_CONVERSATION_PROMPT_CHARS =
  COMPOSED_MEMORY_CONVERSATION_PROMPT_CHARS + CITATION_LABEL.length
```

Over-ceiling refuses, never truncates.

## Additive discipline verified

`xiv-assistant-memory-conversation.ts` (12D-308) gained ONLY the additive
`validatePriorTurnPairs` export + `PriorTurnPairsResult` type (the body moved out
verbatim — refusal messages byte-identical). The 12D-308 suite was re-run: 26/26.
Its prompt does NOT contain `CITATION_LABEL` (asserted in the 12D-311 tests), and
the 12D-308 view model still renders its own kind.

## Measured evidence

- `npm run typecheck:12d-311` → exit 0
- `npm run test:12d-311` → **27/27** (16 contract + 11 view-model)
- Sibling suites (311×2, 310×2, 308×2, 307, 302) → **102/102**
- Sibling typechecks (12d-310, 12d-307, 12d-302, 12d-306) → exit 0
- Full chain regression → **1376/1376 across 239 files** (the 12D-310 baseline
  1349 + the 27 new tests), 0 failures (`regression-12d-311.log`)
- Python backend suite → OK (37 tests)
- Story shell build → exit 0 (no shell surface changed — runtime-only rung)

## LIVE finding (real Ollama, loopback, remoteCalls 0)

Real 12D-305 packet from the live reading queue + one real prior pair (the live
12D-307 draft) + real `qwen2.5-coder:7b`:

- **DRAFTED, citedCount 0** — even with the citation instruction naming the exact
  `[mem:<storyId>]` form, the model answered without copying any storyId. Honest
  outcome: an UNGROUNDED draft, disclosed in the packet (citedCount 0), never
  hidden. Same live finding as 12D-310: a 7B local model does not reliably copy
  exact storyIds — precisely why the door verifies, never trusts.
- **Fabricated-citation negative refused POST-CALL** (fake caller): "the draft
  cites 1 storyId(s) not in the verified carried memory set; the draft is
  withheld — fabricated provenance never passes; the caller ran (post-call)".
- modelCalls 1, remoteCalls 0, learningPromoted false, stoppedBefore "the
  operator decision — a draft is text, never an action", humanDecision REQUIRED.

## Honest scope

- Runtime-only rung: NO shell surface built (disclosed in guardrails as
  `shellSurfaceNotBuiltYet: true`).
- The 21 settled drafts from 12D-309 still AWAIT the CEO's review decisions —
  never self-reviewed, no receipts fabricated.

## Next candidates

1. Shell surface for the memory turn family (12D-307/308/310/311 view models).
2. CEO review decisions on the 21 settled drafts (mem0 ×6, cognee ×8,
   neural-memory ×7).
3. Remaining directive-#4 sources: OpenViking (AGPLv3 — reference-only),
   Memary, openhuman, open-brain, openwiki.