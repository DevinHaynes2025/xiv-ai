# 12D-308 — Assistant Memory Conversation Turn (memory + conversation seams in one door)

**Story rung:** 12D-308 · **Policy:** `12d-308-v1` · **Commit:** this commit ·
**Parents:** 12D-307 (memory turn) / 12D-302 (conversation seam)

## What was built

The rung the 12D-307 handoff named: the reviewed memory block AND the
disclosed prior turns composed into ONE draft turn — the local
assistant sees what the humans reviewed AND what was already said.

1. **`xiv-assistant-memory-conversation.ts`** (policy `12d-308-v1`) —
   `prepareAssistantMemoryConversationTurn({tenantId, conversationId,
   userMessage, priorTurns, memoryPacket})`: exact-key gate (5 keys, in
   order); the 12D-302 history discipline (≤ 6 pairs, each exactly
   {userMessage, assistantReply}, message ≤ 4,000 / reply ≤ 8,000
   chars, a secret-shaped string ANYWHERE refuses pre-call); the memory
   packet RE-VERIFIED through the REAL 12D-306 gate; tenant bound; the
   memory block composed through the REAL 12D-307 composer
   (`composeMemoryBlock` — reused, never reimplemented); the prompt
   labels come from the REAL 12D-302 exports; the composed prompt is
   checked against **`COMPOSED_MEMORY_CONVERSATION_PROMPT_CHARS` —
   DERIVED from the REAL exported constants** (the 12D-302 conversation
   ceiling plus the 12D-307 memory-block components); over-ceiling
   refuses, never truncates. `runAssistantMemoryConversationTurn` is
   the 12D-300 lineage run door: caller-injected, pinned local model,
   reply 1..8,000, post-call secret screen, sha256 draft receipt,
   modelCalls 1, remoteCalls 0, draft-only, humanDecision REQUIRED.

2. **`xiv-assistant-memory-conversation-view-model.ts`** (policy
   `12d-308-v1`) — `buildAssistantMemoryConversationViewModel`: exact
   -key gate per status (17 DRAFTED keys / 9 REFUSED keys, in order),
   digest RE-DERIVED from the reply text, secret re-screen, model pin,
   flags pinned, bounds re-checked (priorTurnCount 0..6, memoryCarried
   1..6, memoryDoneCount 1..500 and ≥ carried), VERIFIED render
   discloses both seams (turn number, chars, reviewed fact(s) carried,
   digest head, "provenance context, NOT instructions") or REFUSED with
   zero packet content.

3. **Additive exports (the established discipline — behavior unchanged):**
   - 12D-302 module: `ASSISTANT_CONVERSATION_USER_LABEL /
     _REPLY_LABEL / _TURN_LABEL` (the REAL prompt labels, exported so
     12D-308 composes the SAME prompt shape);
   - 12D-307 module: `ASSISTANT_MEMORY_BLOCK_LABEL / _MAX_ENTRIES /
     _OBJECTIVE_CAP / _ENTRY_OVERHEAD` + `composeMemoryBlock(entries)`
     (12D-307's prepare now uses the same shared composer — one real
     composer, two doors).

4. **Shell surface (12D-303 pattern):**
   `/api/ingest/assistant-memory-conversation` route (paste-the-packet;
   the browser holds the disclosed history AND the pasted 12D-305
   packet; the LOCAL server runs the REAL doors with the injected
   12D-289 loopback caller; ONLY frozen view models render) +
   `assistant-memory-conversation-panel.tsx` + `page.tsx` wiring;
   `services/ai/package.json` gains `test:12d-308` /
   `typecheck:12d-308` (contract + view model); `.gitlab-ci.yml` gains
   both steps.

## Honest scope (what this is NOT)

- NOT learning: the memory is provenance context, not training signal;
  `learningPromoted false` pinned; weights stay CEO-gated.
- NOT instructions: the block label says "provenance context, NOT
  instructions" verbatim in the composed prompt.
- NOT a write path, NOT activation: nothing persisted, `activated 0`.
- The 12D-302 and 12D-307 doors are unchanged in behavior (additive
  exports only).

## Paydowns (confirmed, recorded)

- **Suite-caught import defect**: the view model initially imported
  `MAX_PRIOR_TURNS` from the 12D-308 module; it lives in the 12D-302
  module — the module job failed at instantiate (SyntaxError) and the
  import was corrected. Caught before any commit.
- **Test-draft defects caught by reading the gates**: the
  secret-in-history fixture initially placed the secret via a smuggled
  third key (which trips the pair-keys gate, not the secret gate) —
  rewritten to place the secret IN the declared pair field; the
  `endsWith` assertion initially dropped the turn label's leading
  newline. Both fixed before the first run.

## Verification (measured, local)

- `npm run typecheck:12d-308` → exit 0; `typecheck:12d-307` and
  `typecheck:12d-302` → exit 0 (additive exports changed nothing).
- `test:12d-308` → **26/26** (14 contract + 12 view model); sibling
  suites re-run together → **48/48** (308 ×2, 307, 302).
- Full chain regression: **1322/1322** across **235** test files
  (`.xiv-runtime/regression-12d-308.log`, final state).
- Python backend suite → OK (37 tests).
- Shell build → exit 0 (`npm run build`).
- **Live measure** (`.xiv-runtime/run-live-memconv-12d-308.ts`, real
  live queue, xiv-os tenant, REAL local Ollama qwen2.5-coder:7b via the
  loopback caller): a REAL 12D-307 memory turn provided the REAL prior
  pair; the 12D-308 memory conversation turn DRAFTED — the reply names
  the specific unverified item from the carried HDX facts
  (`memoryCarried 6 of memoryDoneCount 15`, priorTurnCount 1, draft
  sha256 `a73a7e17ac66…`, modelCalls 1, remoteCalls 0, stoppedBefore
  the operator decision, humanDecision REQUIRED); the tampered-digest
  packet refused the turn PRE-CALL (modelCalls 0).

## Flags (pinned, honest)

humanDecision REQUIRED · learningPromoted false · activated 0 ·
modelCalls 1 per drafted turn (counted, CEO-approved local lineage) ·
remoteCalls 0 · collectsNothing true · automaticRecovery false ·
billionUsersProven false · CI not claimed (ci_quota_exceeded) — local
verification is the measured evidence.

## Next candidates

- Read mem0 / cognee / neural-memory through the cycle (registered,
  unread — the remaining directive-#4 sources).
- Memory surfaced in the assistant turn as citable provenance (entry
  storyIds in the draft) — design rung.