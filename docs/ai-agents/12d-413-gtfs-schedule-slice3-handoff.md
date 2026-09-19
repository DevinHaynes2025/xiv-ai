# 12D-413 — GTFS Schedule Reference, third bounded slice (chars 12,000–18,000)

Date: 2026-09-18 (24/7 build). Branch: `claude/12d-99-supervised-local-worker`.

## What this rung is

The third bounded window of the document 12D-409 opened: chars **12,000–18,000** of the GTFS Schedule Reference, through the operator CLI door with `--declaredFailover true`.

## Measured this rung

- **Drift guard holds**: the reference strips to **140,905 chars — identical to the 12D-409 measure** (the driver refuses on drift without an explicit re-plan).
- License gate **re-measured fresh** from gtfs.org/about (CC BY 3.0 content + Apache 2.0 code samples, verbatim, never inherited).
- 2 chunks → **2 drafts AWAITING_REVIEW**, settled by the pinned primary `qwen2.5-coder:7b` (candidateIndex 0 — declared fallback ordered, never preferred), modelCalls 2 across the standing loop, remoteCalls 0, longest block 450 chars (well under the packing bound).

## Honest flags (pinned)

`humanDecision: 'REQUIRED'`, `learningPromoted: false`, `activated: 0`, `collectsNothing: true`, `automaticRecovery: false`, `billionUsersProven: false`. remoteCalls 0. 18,000 of 140,905 chars read across three rungs — far below the 2,000,000-row measured ceiling, the ONLY measured ceiling.

## Drafts: CEO-gated

2 new drafts (AWAITING_REVIEW) — NO apply without the CEO's recorded standing approval (12D-395/405/408/410/412 pattern).

## Next candidates

- 12D-415 (NTD Major Safety Events) and 12D-416 (World Bank rural population) drill runs.
- Apply rung for the 413 drafts under the recorded blanket approval.