# 12D-409 — bounded GTFS Schedule Reference read (the transit-brain prerequisite)

Date: 2026-09-18 (continuing 24/7). Branch: `claude/12d-99-supervised-local-worker`, worktree `C:\Users\Devin\xiv-build-12d-99`.

## What this rung is

The prerequisite flagged since 12D-375 finally read: the **GTFS Schedule Reference** at gtfs.org — the open transit-data standard the CEO's mobility direction builds on, maintained by MobilityData. Bounded read: the **first 6,000 chars** of the reference (general description + dataset-structure opening), through the operator CLI door with `--declaredFailover true`.

## The license gate (measured, in-driver, before any read)

The publisher's OWN about page (gtfs.org/about), fetched fresh by the driver, carries both license statements verbatim:

> "Except as otherwise noted, the content of this site is licensed under the Creative Commons Attribution 3.0 License, and code samples are licensed under the Apache 2.0 License."

Site content **CC BY 3.0**; code samples **Apache 2.0**. Attribution duty on reuse: attribute GTFS/MobilityData per CC BY. (The gtfs-spec GitHub repo URL probed earlier 404'd — the about page is the publisher's operative license surface, measured instead.) Gates never inherited, always re-measured.

## The read (fail-closed)

Scratch driver `.xiv-runtime/reading-driver-12d-409.ts` (never committed), stopped before review:

- Bounded: the reference page strips to **140,905 chars**; this rung reads only the **first 6,000** — a DISCLOSED cap stated verbatim in the snapshot ("further sections are future rungs"), never silent. HTML→text stripped with entity decoding; the driver refuses if the page strips to a JS shell (< 2,000 chars).
- Source class: `PUBLISHED_STANDARD` (the register's standard class — GTFS is a published open standard, distinct from PUBLIC_WEB).
- Snapshot `.xiv-runtime/reading-sources-12d-409/gtfs-schedule-opening-12d-409.md`: provenance, "XIV AI OS reading notes:", verbatim license quote + attribution duty, the bounded opening verbatim.
- **CLI DOOR, standing loop**: `runSupervisedCycleCommand` with `--declaredFailover true`, re-run until census READY 0.
- **RESULT**: 2 chunks → 2 drafts AWAITING_REVIEW, READY 0, zero refusals, remoteCalls 0, hash-pinned packets.

## Honest flags (pinned)

`humanDecision: 'REQUIRED'`, `learningPromoted: false`, `activated: 0`, `collectsNothing: true`, `automaticRecovery: false`, `billionUsersProven: false`. remoteCalls 0. 6,000 chars of a 140,905-char document — far below the 2,000,000-row/database measured ceiling, the ONLY measured ceiling.

## Drafts: CEO-gated

2 new drafts (AWAITING_REVIEW) — NO apply without the CEO's recorded standing approval (12D-395/405/408 pattern).

## Next candidates

- Apply rung for the 2 drafts under the recorded blanket approval.
- Further GTFS reference sections (file definitions: agency, routes, trips, stop_times, calendar) — future bounded rungs of the same document.
- More NTD surfaces; World Bank further indicators; SSA probe again (still 403).