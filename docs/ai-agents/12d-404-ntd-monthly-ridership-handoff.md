# 12D-404 — bounded NTD Complete Monthly Ridership read (FTA Socrata, second rung on the surface)

Date: 2026-09-18 (continuing 24/7). Branch: `claude/12d-99-supervised-local-worker`, worktree `C:\Users\Devin\xiv-build-12d-99`.

## What this rung is

Second rung on the FTA Socrata surface (12D-403 read the Facility Inventory): the **Complete Monthly Ridership (with Adjustments and Estimates)** dataset (`8bui-9xvu`) — the headline American transit metric, agency × mode × month. Bounded read: the **10 most-recent agency/month rows** (`$limit=10`, `$order=date desc`; latest measured month **2026-07-01**), through the operator CLI door with `--declaredFailover true`.

## The license gate (re-measured, disclosure re-verified)

- HARD GATE first, from the dataset's OWN Socrata metadata, BEFORE any read: license name "Public Domain U.S. Government" verbatim (measured pass), terms link usa.gov/government-works, attribution "Federal Transit Administration".
- Stage-2 re-measure DISCLOSED again (never silently dropped): the linked usa.gov page is still a JS shell (redirect to /government-copyright, no operative sentence server-rendered) — the hard gate stays on the per-dataset declaration; the posture was verified verbatim at 12D-369. The same discipline as 12D-403, re-measured per-rung — gates are never inherited.

## The read (fail-closed)

Scratch driver `.xiv-runtime/reading-driver-12d-404.ts` (never committed), stopped before review:

- Bounded: 10 most-recent rows; short-sample refusal; ceiling guard; longest row 465 chars (one row per block, every field the publisher serves verbatim).
- Snapshot `.xiv-runtime/reading-sources-12d-404/ntd-monthly-ridership-12d-404.md` with provenance, "XIV AI OS reading notes:", verbatim license declaration + stage-2 disclosure, field glossary (UPT = unlinked passenger trips; VOMS = vehicles of maximum service; VRH/VRM = vehicle revenue hours/miles).
- **CLI DOOR, standing loop**: `runSupervisedCycleCommand` with the exact 8 flags PLUS `--declaredFailover true`, re-run until census READY 0.
- **RESULT**: 4 chunks → 4 drafts AWAITING_REVIEW, READY 0, zero refusals, remoteCalls 0, drafts settled under the pinned primary with hash-pinned packets.

## Honest flags (pinned)

`humanDecision: 'REQUIRED'`, `learningPromoted: false`, `activated: 0`, `collectsNothing: true`, `automaticRecovery: false`, `billionUsersProven: false`. remoteCalls 0. 10 rows of a dataset spanning thousands of agency-mode-months — far below the 2,000,000-row/database measured ceiling, the ONLY measured ceiling.

## Drafts: CEO-gated

4 new drafts (AWAITING_REVIEW) — NO apply without recorded CEO approval. Open drafts after this rung: 398: 1, 401: 2, 403: 5, 404: 4 = **12 CEO-gated drafts**. Campaign all-time: **296 applied decisions**.

## Next candidates

- CEO review/apply on the 12 drafts.
- More NTD surfaces (safety HEADWAY data, GTFS weblinks) under the same gates.
- World Bank further indicators; SSA probe again next segment (still 403).