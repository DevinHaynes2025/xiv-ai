# 12D-407 — bounded NTD GTFS Weblinks read (third rung on the FTA Socrata surface)

Date: 2026-09-18 (continuing 24/7). Branch: `claude/12d-99-supervised-local-worker`, worktree `C:\Users\Devin\xiv-build-12d-99`.

## What this rung is

Third rung on the FTA Socrata surface (403: Facility Inventory, 404: Complete Monthly Ridership): the **General Transit Feed Specification Weblinks** dataset (`2u7n-ub22`) — the FTA's monthly-updated index of agency GTFS feed URLs (metadata updated 2026-09-04). GTFS is the open transit-data standard the CEO-named mobility direction builds on; 12D-375 recorded it as the standard to learn before transit-brain rungs. Bounded read: **10 rows**, through the operator CLI door with `--declaredFailover true`.

## The license gate (re-measured per-rung, as always)

- HARD GATE first, from the dataset's OWN Socrata metadata, BEFORE any read: license name "Public Domain U.S. Government" verbatim (measured pass), terms link usa.gov/government-works, attribution "Federal Transit Administration".
- Stage-2 re-measure DISCLOSED a third time: the linked usa.gov page is still a JS shell — the hard gate stays on the per-dataset declaration; the posture was verified verbatim at 12D-369. Gates are never inherited.
- **NEW scope boundary, recorded in the snapshot and the register note**: the public-domain declaration covers this INDEX, not the agency feeds it links — any GTFS feed read is a separate per-source license check (the MobilityData 12D-375 lesson re-applied: a catalog licenses nothing it catalogs).

## The read (fail-closed)

Scratch driver `.xiv-runtime/reading-driver-12d-407.ts` (never committed), stopped before review:

- Bounded: 10 rows; short-sample refusal; ceiling guard; longest row 596 chars (one row per block, every field verbatim — agency, mode, VOMS, urbanized-area population, the GTFS feed URL, FTA validation dates).
- Snapshot `.xiv-runtime/reading-sources-12d-407/ntd-gtfs-weblinks-12d-407.md` with provenance, "XIV AI OS reading notes:", verbatim license declaration + stage-2 disclosure + the index-vs-feeds scope boundary.
- **CLI DOOR, standing loop**: `runSupervisedCycleCommand` with `--declaredFailover true`, re-run until census READY 0.
- **RESULT**: 4 chunks → 4 drafts AWAITING_REVIEW, READY 0, zero refusals, remoteCalls 0, drafts settled under the pinned primary with hash-pinned packets.

## Honest flags (pinned)

`humanDecision: 'REQUIRED'`, `learningPromoted: false`, `activated: 0`, `collectsNothing: true`, `automaticRecovery: false`, `billionUsersProven: false`. remoteCalls 0. 10 rows of a national index — far below the 2,000,000-row/database measured ceiling, the ONLY measured ceiling.

## Drafts: CEO-gated

4 new drafts (AWAITING_REVIEW) — NO apply without the CEO's recorded standing approval (the 12D-395/405 pattern).

## Next candidates

- Apply rung for the 4 drafts under the recorded blanket approval (12D-395/405 pattern).
- The GTFS standard itself (spec read from the MobilityData/GTFS publisher, per-source license check) — the transit-brain prerequisite.
- World Bank further indicators; SSA probe again (still 403 this segment).