# 12D-329 — Assistant memory turn SHELL SURFACE (the 12D-307 rung's disclosed surface)

**Story rung:** 12D-329 (shell-only rung, the 12D-272/312 pattern; no
runtime contract changed) · **Parents:** 12D-307 (the memory turn
contract, whose rung disclosed "a shell surface could be its own
rung") / 12D-312 (the cited family's shell pattern) / 12D-306 (the
memory gate) · **Policy footprint:** view-model policy 12d-329-v1 only

## What this rung is

The 12D-307 assistant memory turn (the plain memory turn — reviewed
facts composed into a turn WITHOUT the citation gate; the citing
siblings 12D-310/311/312 already have surfaces) becomes
operator-visible: a fail-closed view model, a LOCAL `/api/ingest/
assistant-memory-turn` route, and a panel — the 12D-310 view-model
discipline minus the citation fields the plain turn does not carry.

## The view model (runtime/offline-team/xiv-assistant-memory-turn-view-model.ts, policy 12d-329-v1)

- Exact-key gate per status (DRAFTED 16 keys / REFUSED 9 keys, IN
  ORDER), `kind`/`policyVersion` pinned to the REAL 12D-307 contract,
  model pinned to `qwen2.5-coder:7b`.
- `draftSha256` RE-DERIVED from `replyDraft` (never trusted);
  SECRET_CONTENT_RE re-applied to the reply (secret-shaped never
  renders, content never echoed).
- `memoryCarried` re-gated 1..6 (the REAL 12D-305 bound);
  `memoryDoneCount` re-gated 1..500 and ≥ carried; honest flags pinned
  (modelCalls 1, remoteCalls 0, activated 0, learningPromoted false);
  humanDecision REQUIRED; stoppedBefore must pin the operator decision
  boundary.
- The 12D-306 memory gate is consumed by the 12D-307 contract itself,
  never re-run here (the 12D-286 lesson: the view model imports no
  queue-touching module — `ASSISTANT_MEMORY_MAX_ENTRIES` comes from
  the pure export, the queue door stays out of the render chain).
- Never throws; every refusal renders honestly with the contract's own
  reason; nothing shown from a refused packet.

## The shell surface

- `src/app/api/ingest/assistant-memory-turn/route.ts`: the browser
  sends `{ tenantId, turnId, userMessage, memoryPacket }`; the LOCAL
  server runs the REAL 12D-307 contract with the INJECTED 12D-289
  loopback caller; unparseable JSON → REFUSED (12d-329-v1), no model
  call; only the frozen view model renders.
- `assistant-memory-turn-panel.tsx`: paste/load the REAL 12D-305
  memory packet, enter a turn id + message; VERIFIED renders headline
  + reply draft + memory carried/done + digest + stoppedBefore +
  operatorNote; REFUSED renders the contract's reason, never the
  screened content. Nothing persisted — reload drops everything.
- Wired into `page.tsx` between the conversation and cited panels.

## Verification (measured)

- 8/8 tests (`test:12d-329`): guardrails pinned; a REAL drafted packet
  (real queue → real doors → fake caller) renders VERIFIED; forged
  digest refuses; secret-shaped reply refuses (never echoed); 17-way
  single-field tamper matrix refuses + reordered keys refuse; a REAL
  refusal packet renders honestly; garbage inputs refuse, never an
  empty success; the sibling 12D-310 cited view model still renders
  (additive-only discipline verified).
  SUITE-CAUGHT paydown: the first tamper matrix asserted
  `tenantId → 'other-tenant'` refuses — wrong fixture (a standalone
  packet has no cross-tenant invariant; the tenant bound is enforced
  by the 12D-307 contract against the MEMORY packet, and the render
  checks only bounds) — replaced with the REAL bounds tampers
  (empty/oversized tenantId), which refuse.
- typecheck:12d-329 exit 0; shell build with the route registered;
  chain regression over the 252-file list re-run.

## What this is NOT

- NOT a citation surface: the cited siblings already have theirs
  (12D-312); this panel is the plain memory turn.
- NOT any persistence, write path, activation, or weight mutation:
  draft-only, learningPromoted false, activated 0, humanDecision
  REQUIRED.
- NOT any review decision: the 53 pending drafts stay CEO-gated.

## Next candidates

1. CEO review decisions on the 53 AWAITING_REVIEW drafts (CEO-gated).
2. XIV AI Media design rung (CEO-gated FUTURE DESIGN).
3. Catalog/capacity re-drill design rung (CEO-gated feasibility).