# 12D-303 — Conversation Story-Shell Surface (multi-turn local assistant in the shell)

**Status:** DONE — verified, measured live, committed.
**Lineage:** 12D-302's conversation seam given its story-shell surface — the
12D-272/282/286/301 pattern applied to the multi-turn seam. The shell now carries a
REAL multi-turn exchange with the LOCAL assistant (CEO directive lineage: the
interactive mini-bot surface, layer by layer).
**Policy:** `12d-303-v1`, domain `XIV_OS_ASSISTANT_CONVERSATION_VIEW_MODEL`.

## What was built

1. **`services/ai/runtime/offline-team/xiv-assistant-conversation-view-model.ts`** —
   the pure rendering contract (`buildAssistantConversationViewModel`):
   - Exact-key gate on the 12D-302 packet per status (CONTINUED 15 keys, REFUSED
     9 keys, in order); `priorTurnCount` must be a safe integer 0..6.
   - Digest RE-DERIVED from `replyDraft` before render (never trusted);
     `SECRET_CONTENT_RE` re-applied to the reply; model pinned to the local model;
     honest flags enforced; `stoppedBefore` must pin the operator decision.
   - **Disclosed state IS rendered** (`disclosedStateRendered`): the
     priorTurnCount and its operator-note meaning show, because the operator
     decides what history carries forward.
   - Refusals render honestly; a refusal reason is bounded 1..500 chars at the
     gate; never an empty success. Source purity suite-asserted.

2. **`services/xiv-story-shell/src/app/api/ingest/assistant-conversation/route.ts`**
   — the LOCAL endpoint: parses `{tenantId, conversationId, userMessage,
   priorTurns}`, runs the REAL 12D-302 contract against the INJECTED 12D-289
   loopback caller, returns ONLY the frozen view model. Unparseable bodies refuse
   with modelCalls 0.

3. **`services/xiv-story-shell/src/app/assistant-conversation-panel.tsx`** — the
   client panel: the BROWSER holds the disclosed history (client-side slice to 6
   prior pairs — the contract bound), sends it every turn, renders the running
   exchange turn by turn (operator said / assistant drafted), plus the newest
   verified view or refusal. Conversation id input (1..128); "Clear conversation"
   resets; nothing persisted — reloading drops the conversation (disclosed).

4. `page.tsx` mounts `AssistantConversationPanel` after `AssistantTurnPanel`;
   `package.json` + `.gitlab-ci.yml` wired (`test:12d-303` / `typecheck:12d-303`).

## Measured live (real loopback Ollama, temperature 0)

Turn 1 "What is your honest scope?" → drafted, digest `f4d22d24e2a1…`. Turn 2 "And
who decides on your drafts?" → rendered through the view model: **"The operator
decides on my drafts."** (34 chars, digest `d2cce44d60c1…`, priorTurnCount 1,
modelCalls 1, remoteCalls 0, stopped before the operator decision). A `ghp_`-shaped
string planted in the DISCLOSED history → rendered honest REFUSAL ("a prior turn is
secret-shaped… secrets never go to ANY model"). Scratch:
`.xiv-runtime/run-live-conversation-view-12d-303.ts` (untracked, never committed).

## Verification

- `npm run test:12d-303` — **8/8 pass** (real CONTINUED renders with disclosed
  context; tampered digest + swapped reply refuse; digest-matched secret never
  renders; foreign model / priorTurnCount 7, -1, 2.5 / flag tampering ×10 /
  reordered keys refuse; real refusal + over-500-char reason; junk inputs; frozen
  guardrails; source purity).
- `npm run typecheck:12d-303` — exit 0. Shell build — exit 0 with BOTH assistant
  routes present (`/api/ingest/assistant-turn`, `/api/ingest/assistant-conversation`).
  Suite-caught paydown this rung: the panel's `TurnView` type omitted
  `stoppedBefore` (TS2339 at build) — the build caught it, the type was completed.
- Full chain regression — see commit message. Python backend — 37/37.
- GitLab CI NOT claimed passed (org quota `ci_quota_exceeded`); local verification
  is the measured evidence.

## Next candidates

- 12D-304: provenance pathway evidence over DONE chunks with recorded review refs;
  or read mem0 / cognee / neural-memory through the cycle (registered, unread).
- Review decisions on 4 settled drafts (rakazo chunks 1/2, AGO census, cerememory
  chunk-1) — the CEO's; never self-reviewed.