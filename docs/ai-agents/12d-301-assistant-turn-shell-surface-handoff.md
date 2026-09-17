# 12D-301 — Assistant Turn Story-Shell Surface (the local assistant made interactive)

**Status:** DONE — verified, measured live, committed.
**Lineage:** 12D-300 (the local assistant turn, the CEO's "mini grok bot" seed) made
INTERACTIVE in the story shell — the 12D-272/282/286 shell-surface pattern applied to
the assistant. This is the surface where "all users will be able to be interactive with
an actual xiv ai agentic bot" (CEO directive 2026-09-17 #3) begins, honestly scoped:
the assistant DRAFTS, the operator decides.

## What was built

1. **`services/ai/runtime/offline-team/xiv-assistant-turn-view-model.ts`** — the pure,
   fail-closed rendering contract (`buildAssistantTurnViewModel`, policy `12d-301-v1`):
   - Exact-key gate on the packet per status (DRAFTED 14 keys, REFUSED 9 keys, in
     order); anything else refuses — the packet must be one the REAL 12D-300
     contract produced.
   - **Re-verification before render (the 12D-286 discipline, one deliberate
     difference):** the digest is RE-DERIVED from `replyDraft` (never trusted); the
     credential-shaped gate (`SECRET_CONTENT_RE`) is RE-APPLIED to the reply; the
     model label must be the pinned local model; flags must be the pinned honest
     values (modelCalls 1 / remoteCalls 0 / activated 0 / learningPromoted false /
     humanDecision REQUIRED); `stoppedBefore` must pin the operator decision
     boundary.
   - **The reply IS rendered** — unlike the 12D-286 receipt view (draft text never
     echoed), an assistant turn's draft IS the operator's answer; it renders only
     after the re-verification above. Disclosed in the module header and suite-pinned.
   - Refusals render as refusals with the 12D-300 contract's own reason (never an
     empty success; reasons never carry the screened content). A refusal reason is
     itself bounded 1..500 chars at the render gate.
   - PURE: no fs, no network, no clock, no randomness (suite-asserted). modelCalls 0
     in the view model itself.

2. **`services/xiv-story-shell/src/app/api/ingest/assistant-turn/route.ts`** — the
   LOCAL endpoint: parses `{tenantId, turnId, userMessage}` JSON, runs the REAL
   12D-300 `prepareAssistantTurn` → `runAssistantTurn` against the INJECTED
   **12D-289 loopback caller** (`buildLoopbackCaller` — the authorized loopback
   surface, pinned local model, temperature 0), and returns ONLY the frozen view
   model. A refused turn never produces a draft; an unparseable body refuses with
   modelCalls 0.

3. **`services/xiv-story-shell/src/app/assistant-turn-panel.tsx`** — the client
   panel: type a message → POST → render the verified draft (reply text, digest,
   `stoppedBefore`, honest flags) or the refusal. Draft-only; nothing persisted.

4. `page.tsx` mounts `AssistantTurnPanel` after `DraftReceiptPanel`;
   `package.json` gains `test:12d-301`/`typecheck:12d-301`; `.gitlab-ci.yml` gains
   `typecheck:12d-301` + `test:12d-301`.

## Measured live (real loopback Ollama, temperature 0)

Question "What is the measured row ceiling of the XIV AI OS queue?" → **DRAFTED**,
rendered through the view model: "The measured row ceiling of the XIV AI OS queue is
2,000,000 rows per database." — 79 chars, draftSha256 `d60353fe356c…`, modelCalls 1,
remoteCalls 0, digest re-derived before render, stopped before the operator decision.
A secret-shaped message (`ghp_…`) → **REFUSED view**, no draft, no model call
(modelCalls 0). Scratch: `.xiv-runtime/run-live-assistant-view-12d-301.ts` (untracked).

## Verification

- `npm run test:12d-301` — **10/10 pass** (real packet renders; tampered digest
  refuses both directions; secret-shaped reply never renders even digest-matched;
  foreign model refuses render + forged packet; flag tampering refuses ×7; real
  refusal renders honestly; junk + oversized reason + reordered keys refuse; gate
  list in the operator note; frozen guardrails; source purity).
- `npm run typecheck:12d-301` — exit 0. Full chain regression — see commit message.
- Python backend — 37/37. Story shell build — exit 0 with `/api/ingest/assistant-turn`
  route present.
- NOTE: GitLab CI NOT claimed passed (org quota `ci_quota_exceeded`); local
  verification is the measured evidence.

## Honest mapping (standing record)

Interactive-with-the-bot is now REAL at draft level in the shell — one bounded,
secret-screened, loopback-only, stateless turn at a time. Multi-turn memory, fleet
runs, GPU changes, and weight mutation remain future gated rungs / CEO-gated, never
claimed DONE. Vision lines (atomic level, trillions, quantum chips) stay vision.

## Next candidates

- 12D-302: bounded multi-turn seam (disclosed, still draft-only) or provenance
  pathway evidence over DONE chunks with recorded review refs.
- Review decisions on the 3 settled drafts (rakazo chunks 1/2, AGO census) — the
  CEO's; never self-reviewed.
- Read grok-build / cline / OpenMausBot through the cycle.