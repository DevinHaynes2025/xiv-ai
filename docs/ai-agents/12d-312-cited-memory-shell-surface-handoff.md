# 12D-312 — Cited Memory Turn Family SHELL SURFACE — Handoff

**Status:** DONE (shell rung; commit `12d-312`)
**Policies rendered:** `12d-310-v1` (cited turn), `12d-311-v1` (cited conversation)
**Shell module:** `services/xiv-story-shell` (2 routes + 2 panels + page wiring)

## What this rung is

The shell surface for the 12D-310/12D-311 cited memory doors — the memory turn
family is now fully operator-visible: the operator can draft a cited memory turn
or a multi-turn cited memory conversation from the browser, with every REAL gate
running in the LOCAL server process.

## Surface (12D-306/12D-308 pattern, copied from the committed rungs)

| Route | Contract run | Panel |
|---|---|---|
| `/api/ingest/assistant-memory-cited-turn` | REAL 12D-310 prepare+run, injected 12D-289 loopback caller | `assistant-memory-cited-turn-panel.tsx` |
| `/api/ingest/assistant-memory-cited-conversation` | REAL 12D-311 prepare+run (browser holds ≤6 prior pairs, 12D-302 bound) | `assistant-memory-cited-conversation-panel.tsx` |

Both panels render the frozen view models ONLY; the UNGROUNDED case
(citedCount 0) is rendered explicitly as "NONE — UNGROUNDED draft, disclosed",
never hidden. Nothing is persisted — reloading drops packet, history, drafts.

## Gates in the LOCAL server process (real, none reimplemented)

12D-306 memory verification → 12D-307 block composition → 12D-302/308 history
discipline → 12D-310 citation gate (fabricated citation refuses POST-CALL) →
derived ceiling → secret screening both ways → digest re-derived before render.

## Measured evidence

- Story shell build → exit 0; both new routes registered
  (`/api/ingest/assistant-memory-cited-turn`,
  `/api/ingest/assistant-memory-cited-conversation`).
- No services/ai module changed (shell-only rung — the 12D-310/311 suites and
  the 1376/1376 chain regression carry over unchanged).
- Python backend 37/37 (unchanged tree, spot-verified this rung).

## LIVE measure (real HTTP through the built shell, real Ollama loopback)

- **Cited turn, real 12D-305 packet** (6 carried of 15 DONE):
  `VERIFIED_ASSISTANT_MEMORY_CITED_TURN`, citedCount 0 → headline honestly
  "an UNGROUNDED draft", modelCalls 1, remoteCalls 0.
- **Tampered digest packet** → `REFUSED` ("memoryDigest does not match the
  re-derived digest"), no packet content echoed.
- **Cited conversation, two real turns** (turn 2 carrying the real turn-1 draft
  as the prior pair): both `VERIFIED_…CITED_CONVERSATION_TURN`, priorTurnCount
  1 on turn 2, citedCount 0 both turns (UNGROUNDED, disclosed).
- **Secret smuggled into history** (`ghp_…` in a prior turn) → `REFUSED`
  pre-call: "a prior turn is secret-shaped (credential/key pattern); secrets
  never go to ANY model; fail closed".

Consistent with the 12D-310/311 live finding: the real qwen2.5-coder:7b drafts
grounded prose but does not copy exact storyIds — the gate verifies, never
trusts, and the shell discloses the UNGROUNDED outcome instead of hiding it.

## Honest scope

- Review decisions on the 21 settled drafts from 12D-309 still AWAIT the CEO —
  never self-reviewed, no receipts fabricated.
- The citation UX is honest but sparse (a 7B model rarely cites): the panels
  disclose UNGROUNDED rather than fake grounding.

## Next candidates

1. CEO review decisions on the 21 settled drafts (mem0 ×6, cognee ×8,
   neural-memory ×7) — then the memory block carries NEW facts.
2. Remaining directive-#4 sources: OpenViking (AGPLv3 — reference-only),
   Memary, openhuman, open-brain, openwiki.
3. A citation-assist rung: surface the exact carried storyIds next to the
   composer so the operator can verify a draft's citations by eye.