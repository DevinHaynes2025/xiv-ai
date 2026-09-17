# 12D-300 — XIV AI OS Local Assistant Turn (the in-house "mini grok bot" seed)

**Status:** DONE — verified, measured live, committed.
**Directive lineage:** CEO directive 2026-09-17 #3 (mini grok bot alternative / mini claude
alternative / mini cursor inside XIV AI OS) mapped honestly onto a fail-closed LOCAL
assistant rung; rakazo (Apache-2.0) read this turn as the direct reference.
**Policy:** `12d-300-v1`, domain `XIV_OS_LOCAL_ASSISTANT_TURN`.

## What was built

`services/ai/runtime/offline-team/xiv-assistant-turn.ts` — a pure, fail-closed assistant
turn contract, built from scratch (nothing copied from any reference):

- **`prepareAssistantTurn(raw)`** — input must be exactly `{tenantId, turnId, userMessage}`
  in key order; tenantId 1..64 chars, turnId 1..128 chars, userMessage 1..4,000 chars.
  Any anomaly REFUSES before any model call (modelCalls 0). Never throws.
- **`runAssistantTurn(prepared, caller)`** — the caller is INJECTED (the 12D-280 seam);
  the module never touches the network. Composed-prompt bound re-checked. Caller failure
  refuses pre-call without silent retry. Reported model MUST be the pinned local model
  `qwen2.5-coder:7b` — any foreign model refuses. Reply bounded 1..8,000 chars.
- **SECRET SCREENING BOTH WAYS** — the user message is screened against the shared
  `SECRET_CONTENT_RE` BEFORE any model call, and the model reply is screened AGAIN
  post-call. A secret-shaped string in either direction refuses the turn. Secrets never
  go to ANY model.
- **HONEST PERSONA PINNED** — `ASSISTANT_PERSONA_PREAMBLE` (frozen, carried verbatim on
  every turn): the assistant drafts for a human operator who decides; no cloud access,
  no deployment, no GPU environment changes, no weight mutation; billion-user scale and
  quantum hardware are vision, not capability; measured ceiling 2,000,000 rows/database.
- **DRAFT-ONLY** — returns a draft reply + `draftSha256` (sha256 over the reply, utf8)
  with `stoppedBefore: 'the operator decision — a draft is text, never an action'` and
  `humanDecision: 'REQUIRED'`. No write path, nothing persisted in this rung.
- **COUNTED** — `modelCalls: 1` per drafted turn (CEO-approved local model use), 0 on
  refusal; `remoteCalls: 0` (loopback is not remote); `activated: 0`;
  `learningPromoted: false`; `collectsNothing: true`; `automaticRecovery: false`;
  `billionUsersProven: false`.

## Disclosed residuals (honest, suite-pinned)

- **Stateless:** no conversation memory this rung — a multi-turn memory rung would be
  its own gated story. The caller composes any prior context.
- **Model text can be wrong:** `humanDecision REQUIRED` is the guard.
- **Identity attribution:** in the measured live turn the base model self-identified as
  "I am Qwen" while still carrying the honest-scope substance of the persona verbatim
  (no cloud, no GPU changes, 2,000,000-row ceiling). The persona preamble bounds what
  the assistant may claim; correcting base-model identity attribution would require
  weight mutation — CEO-gated, NOT done.

## Measured live (real loopback Ollama, temperature 0)

Turn 1 ("introduce yourself and state your honest scope"): **DRAFTED** — modelCalls 1,
remoteCalls 0, draftSha256
`3dd97332a87c6b97b191c691c93e6bda9e47395a4bd70c2326d52f33fa956f6d`, stopped before the
operator decision. Turn 2 (secret-shaped message): **REFUSED pre-call**, modelCalls 0 —
the secret never reached any model. Scratch: `.xiv-runtime/run-live-assistant-turn-12d-300.ts`
(untracked, never committed).

## Verification

- `npm run test:12d-300` — **10/10 pass** (draft + digest, persona verbatim, secret
  screening both ways, foreign-model refusal, caller-failure refusal, bounds, junk
  inputs, frozen guardrails/policy, source purity).
- `npm run typecheck:12d-300` — exit 0.
- Full chain regression — 174 test files, see commit message for the measured count.
- Python backend suites — 37/37. Story shell build — OK (no shell change this rung).
- CI: `typecheck:12d-300` + `test:12d-300` wired in `.gitlab-ci.yml`.
  NOTE: CI has NOT been claimed passed on GitLab (org quota `ci_quota_exceeded`);
  local verification is the measured evidence.

## Honest mapping of the directive (standing record)

Built: the LOCAL assistant turn (this rung) — the seed of the mini bot. VISION, not
capability, and never claimed DONE: atomic-level reasoning, quantum apps, GPU/CPU fleet
runs, self-recreation, agent copies, trillion-scale. GPU env changes remain per-use
gated. The four CEO-named repos (cline, rakazo, grok-build, OpenMausBot) are registered
reading references — built from, never copied.

## Next candidates

- 12D-301: a multi-turn conversation seam (bounded, disclosed state, still draft-only)
  or an assistant turn API route + story-shell panel (same pattern as 12D-297/298).
- Provenance pathway (12D-279) over DONE chunks with recorded review refs.
- Read remaining registered sources (grok-build, cline, OpenMausBot) through the cycle.
- 3 drafts AWAITING_REVIEW (rakazo chunks 1/2, AGO agriculture census) — review
  decisions are the CEO's; never self-reviewed.