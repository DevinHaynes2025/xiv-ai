# 12D-411 — GTFS Schedule Reference, second bounded slice (file definitions)

Date: 2026-09-18 (continuing 24/7). Branch: `claude/12d-99-supervised-local-worker`, worktree `C:\Users\Devin\xiv-build-12d-99`.

## What this rung is

The second bounded window of the document 12D-409 opened: chars **6,000–12,000** of the GTFS Schedule Reference (the file-definitions opening), through the operator CLI door with `--declaredFailover true`. The reference strips to **140,905 chars — byte-identical to 12D-409's measure** (the driver now explicitly refuses if that measure drifts without an explicit re-plan).

## The license gate (re-measured fresh, never inherited)

The publisher's OWN about page (gtfs.org/about), fetched fresh THIS RUNG by the driver, carries both statements verbatim: site content **Creative Commons Attribution 3.0 License**; code samples **Apache 2.0 License**. Attribution duty: GTFS/MobilityData per CC BY.

## The read (fail-closed)

Scratch driver `.xiv-runtime/reading-driver-12d-411.ts` (never committed), stopped before review:

- Bounded: chars 6,000–12,000 of 140,905 (disclosed slice); JS-shell guard; NEW drift guard — refuses if the strip length stops matching the 12D-409 measure without an explicit re-plan.
- Snapshot `.xiv-runtime/reading-sources-12d-411/gtfs-schedule-slice2-12d-411.md`: provenance (second slice of the 409 document), verbatim license re-measure note, the slice verbatim.
- **CLI DOOR, standing loop**: `runSupervisedCycleCommand` with `--declaredFailover true`, re-run until census READY 0.
- **RESULT**: 2 chunks → 2 drafts AWAITING_REVIEW, READY 0, zero refusals, remoteCalls 0, hash-pinned packets.

## Honest flags (pinned)

`humanDecision: 'REQUIRED'`, `learningPromoted: false`, `activated: 0`, `collectsNothing: true`, `automaticRecovery: false`, `billionUsersProven: false`. remoteCalls 0. 6,000 of 140,905 chars this rung (8,000 of the document across both rungs) — far below the 2,000,000-row/database measured ceiling, the ONLY measured ceiling.

## Drafts: CEO-gated

2 new drafts (AWAITING_REVIEW) — NO apply without the CEO's recorded standing approval (12D-395/405/408/410 pattern).

## Next candidates

- Apply rung for the 2 drafts under the recorded blanket approval.
- Further GTFS reference slices (the rung pattern now supports any window of the verified document).
- More NTD surfaces (safety); World Bank further indicators; SSA probe again.