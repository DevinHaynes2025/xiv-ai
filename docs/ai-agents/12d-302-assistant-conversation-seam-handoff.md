# 12D-302 — Assistant Conversation Seam (bounded, disclosed multi-turn memory)

**Status:** DONE — verified, measured live, committed.
**Directive lineage:** CEO directive 2026-09-17 #4 (agents with "mini brains" that
"reason with each other and interact with humans"). Honest mapping: the agent↔agent
meeting path stays the 12D-86 meeting-bus lineage; what THIS rung builds is the honest
human↔assistant multi-turn seam — bounded, disclosed, draft-only. Vision lines (mini
clouds, trillions as one, dead/living souls coexisting, atomic level, universe layer)
stay VISION, never capability claims.
**Policy:** `12d-302-v1`, domain `XIV_OS_ASSISTANT_CONVERSATION_SEAM`.

## What was built

`services/ai/runtime/offline-team/xiv-assistant-conversation.ts` — a pure module on
top of the REAL 12D-300 turn (no re-implementation of the run):

- **`prepareAssistantConversationTurn(raw)`** — exact keys `{tenantId, conversationId,
  userMessage, priorTurns}` in order; conversationId 1..128 chars; `priorTurns` at
  most 6 exactly-shaped pairs `{userMessage, assistantReply}` (2 keys, in order);
  every prior message ≤ 4,000 chars and reply ≤ 8,000 chars.
- **HISTORY RE-SCREENED** — every prior userMessage AND assistantReply is screened
  against `SECRET_CONTENT_RE`, plus the new user message: a secret-shaped string
  ANYWHERE in the conversation history refuses the turn BEFORE any model call.
- **DERIVED composed-prompt ceiling** — `COMPOSED_CONVERSATION_PROMPT_CHARS` is
  computed from the bounds (preamble + 6×(labels + 4,000 + 8,000) + turn label +
  4,000), not a magic number; the suite pins that a maximal LEGAL input still
  prepares and that the derivation is exact. Over the ceiling refuses; never
  truncates.
- **`runAssistantConversationTurn(prepared, caller)`** — the run goes through the
  same caller seam, model pin (`qwen2.5-coder:7b`), post-call secret screen, and
  draft-only packet shape as 12D-300; returns a `CONTINUED` packet with
  `priorTurnCount` carried; caller failures refuse pre-call (modelCalls 0, no
  silent retry).
- **State is held by the CALLER and re-disclosed on every call** — this module
  never stores conversation state (`noPersistencePath`). Disclosed residual: one
  operator↔assistant line; agent↔agent meetings remain the separate 12D-86
  lineage rung.

## Measured live (real loopback Ollama, temperature 0)

Three turns of one conversation, prior context disclosed each turn:
1. "What can you do…?" → CONTINUED (priorTurnCount 0, draftSha256 `7cb1ffb9…`)
2. "What is your measured ceiling?" → CONTINUED (priorTurnCount 1, **"My measured
   ceiling is 2,000,000 rows per database."**, draftSha256 `db87294b…`)
3. "Restate in one sentence what you cannot do." → CONTINUED (priorTurnCount 2,
   **"I cannot handle databases with more than 2,000,000 rows."**, draftSha256
   `b74979d2…`)
modelCalls 3 total (1/turn, counted), remoteCalls 0, stopped before any operator
action. **Honest drift disclosed:** turn 1's draft embellished beyond the pinned
persona ("Execute SQL queries", "Machine Learning") — base-model drift; the
draft-only guard means it never acts, `humanDecision REQUIRED` is the guard, and no
capability is claimed by XIV AI OS on the basis of a draft.
Scratch: `.xiv-runtime/run-live-conversation-12d-302.ts` (untracked, never committed).

## Directive-#4 source batch (measured, register-side)

10 sources registered through the REAL 12D-276 contract — licenses verified on the
public pages this turn: mem0 Apache-2.0 (named twice in the directive, registered
once), cognee Apache-2.0, OpenViking **AGPLv3 main** (ov_cli/examples Apache-2.0 —
reference only, no AGPL code copied), cerememory MIT, Memary MIT, openhuman GPL-3.0
(reference only), neural-memory MIT, open-brain MIT, openwiki MIT, langchain-ai org
(per-repo licenses). Register census: **187 entries** (47 PUBLIC_WEB, 140
OPEN_SOURCE_REPO), capacity 10,000. **cerememory chunk-1 read through the REAL
12D-283 cycle** (the "living memory database" — five neuroscience-inspired stores
mapped honestly to our distinguished record classes in the reading note) —
AWAITING_REVIEW, 12D-285 receipt queue-verified, stopped before review.

## Verification

- `npm run test:12d-302` — **8/8 pass** (context carried; secrets in history refuse
  pre-call at all three positions; bounds refuse; derived-ceiling proof; caller
  failure / foreign model / post-call secret; junk inputs; frozen guardrails;
  source purity).
- `npm run typecheck:12d-302` — exit 0. Full chain regression — see commit message.
- CI wired (`typecheck:12d-302`, `test:12d-302`); GitLab CI NOT claimed passed
  (org quota `ci_quota_exceeded`).

## Next candidates

- 12D-303: conversation view model + shell route/panel (12D-301 pattern) so the
  shell carries a real multi-turn exchange; or provenance pathway evidence over
  DONE chunks.
- Review decisions on 4 settled drafts (rakazo chunks 1/2, AGO census,
  cerememory chunk-1) — the CEO's; never self-reviewed.
- Read mem0 / cognee / neural-memory through the cycle (registered, unread).