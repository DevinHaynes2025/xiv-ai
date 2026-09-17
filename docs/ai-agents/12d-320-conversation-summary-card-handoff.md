# 12D-320 — The Tenant-Bound Conversation Summary Card (a Grounding MEASUREMENT, Never a Generated Summary)

**Story rung:** 12D-320 · **Policy:** `12d-320-v1` (domain
`XIV_OS_CONVERSATION_SUMMARY_CARD`) · **Parents:** 12D-314 (fabricated
citations disclosed BY ID) / 12D-306 (the memory gate) / 12D-308 (the
composed memory conversation door) / 12D-316 (the packet-carries-its-own-inputs
view-model convention)

## What this rung is

The 12D-319 handoff's candidate #2: a tenant-bound **conversation
summary card** — but deliberately NOT a "generate me a summary" model
feature. This card is a **deterministic MEASUREMENT** of a
conversation's citation grounding, derived through ONLY real contracts
with `modelCalls 0`: no model is called, no prose is generated, nothing
is stored, and the honest refusal path never hides anything.

**The measurement it makes** (over one conversation's prior turns plus
the pasted REAL 12D-305 memory packet):

- The turns pass the **REAL 12D-302/308 history discipline**
  (`validatePriorTurnPairs` — reused, never reimplemented), which also
  re-screens every turn for secret shapes.
- The memory packet is re-verified through the **REAL 12D-306 gate**
  (`buildAssistantMemoryViewModel`), tenant-bound: one tenant's memory
  never measures another tenant's conversation.
- Every reply's `[mem:<storyId>]` citations are read by the **REAL
  12D-310 extractor** (`extractCitedStoryIds`) and split against the
  VERIFIED carried set — citations are verified, never trusted.
- Per-reply rows `{turnIndex, citedStoryIds, groundedStoryIds,
  fabricatedStoryIds}`, measured totals, `uncitedReplyCount`, and a
  **five-state verdict**: `ALL_REPLIES_GROUNDED` /
  `PARTIALLY_GROUNDED` / `UNGROUNDED_NO_CITATIONS` /
  `FABRICATED_CITATIONS_PRESENT` / `NO_REPLIES_YET`. Fabrications are
  disclosed BY ID; zero citations render honestly as UNGROUNDED, never
  hidden.
- Two bounded excerpts (≤120 chars: first user message, last reply)
  — windows, never whole-turn dumps; the last is `''` when no replies
  exist (disclosed, never padded).
- A tamper-evident `summaryDigestSha256` binds the whole derivation
  (policy version, tenant, conversation, counts, verdict, rows,
  excerpts, memory counts).

## The 12D-316 convention carried forward

The VERIFIED packet **carries its own inputs** (`userMessage`,
`priorTurns`, `memoryPacket`), and the view model
(`xiv-conversation-summary-card-view-model.ts`) **re-derives the ENTIRE
card from those inputs through ONLY real contracts** before rendering
anything: the memory gate re-runs, the history discipline re-validates,
the extractor re-reads every reply, the rows/totals/verdict/excerpts
are recomputed, and the digest is recomputed. A packet whose verdict,
rows, excerpts, counts, tenant, or digest do not match that
re-derivation renders **NOTHING** (honest refusal, exact refusal keys,
no partial render, never throws).

## Surfaces

- Contract: `services/ai/runtime/offline-team/xiv-conversation-summary-card.ts`
  (pure module; `prepareConversationSummaryCard` → PREPARED | REFUSED,
  `buildConversationSummaryCardPacket` → frozen VERIFIED | REFUSED).
- View model: `xiv-conversation-summary-card-view-model.ts` (the only
  door from packet to UI).
- Shell route: `services/xiv-story-shell/src/app/api/ingest/conversation-summary/route.ts`
  (LOCAL server process, follows the 12D-314 citation-verify pattern).
- Shell panel: `conversation-summary-panel.tsx`, wired into `page.tsx`
  after the citation-verify panel — the operator pastes turns as JSON,
  names tenant + conversation, drops the memory packet, and reads the
  measured card. Nothing is persisted; no `Date.now()`, no randomness.

## Adversarial tests (24 new, all through REAL doors)

Contract suite (12): fabrication disclosed by id next to a grounded id;
ALL_REPLIES_GROUNDED; UNGROUNDED_NO_CITATIONS disclosed; NO_REPLIES_YET
honest fallbacks; bounded excerpts; tampered memory entry refuses (the
digest binds the entries); tenant mismatch refuses; secret-shaped user
message refuses (never echoed); exact-keys-in-order (reordered, missing,
extra, non-object all refuse); and the digest is RE-DERIVED, not
trusted — laundering the carried set changes the measured rows and the
digest binds the re-derived values, not any caller claim (verified by
re-hashing).

View-model suite (12): honest packet renders fully re-derived view;
tampered verdict / row / digest / excerpt / counts (totals, memory
counts, priorTurnCount, userMessageChars) each render NOTHING; swapped
tenant refuses; honest-flag violations (modelCalls 1, learningPromoted
true, wrong humanDecision) refuse; wrong kind/policyVersion and
reordered keys refuse; REFUSED packets render the honest refusal
carrying no summary content; fail-closed for ANY unknown value (never
throws).

## Measured (local, nothing remote)

- `typecheck:12d-320` exit 0; new suites **24/24**.
- **Full chain regression 1475/1475 across 248 files** (1451 + 24),
  0 failures.
- Python suites OK (17 + 20 = 37); shell build exit 0 with the new
  `/api/ingest/conversation-summary` route and panel in the manifest.

## What this is NOT

- NOT a generated summary: there is no model path at all — the card
  measures citations only, and the verdict judges ONLY the citations;
  the prose remains the operator's to judge.
- NOT any learning/deploy/cloud action: flags unchanged
  (`modelCalls 0`, `remoteCalls 0`, `activated 0`,
  `learningPromoted false`, `collectsNothing`, nothing stored,
  `humanDecision REQUIRED`).
- NOT a claim about the live queue: the 133-story queue (98 DONE +
  35 AWAITING_REVIEW) is untouched; review decisions remain the CEO's.

## Next candidates

1. CEO review decisions on the 35 drafts (clean slate).
2. Staleness→plan→real-doors operator flow wiring in the shell
   (12D-315/316 cards now both have shell surfaces).
3. The eight-copy `SECRET_CONTENT_RE` could collapse to ONE shared
   export (additive extraction) — only if the review asks for it.