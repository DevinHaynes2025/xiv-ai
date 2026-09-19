# 12D-415 — bounded NTD Major Safety and Security Events read (10 most-recent rows)

Date: 2026-09-18 (24/7 build). Branch: `claude/12d-99-supervised-local-worker`.

## What this rung is

Third data rung on the FTA Socrata surface (after 12D-403 Facility Inventory and 12D-404 Monthly Ridership): dataset **"Major Safety and Security Events" (9ivb-8ae9)**, 10 most-recent rows ordered by the measured date column **`incident_date` DESC**, through the operator CLI door with `--declaredFailover true`.

## TWO live fail-closed proofs this rung (my driver bugs, the REAL bounds caught them)

1. **The column probe**: my first regex `/date/i` matched `consolidated_mode_name` — the substring "date" hides inside "consolidated". The driver's bounded read would have ordered the sample by a mode-name column. The gate refused (sample ordered wrong → driver re-plan); the fix requires "date" as a WHOLE underscore segment — measured `incident_date`.
2. **The packing bound**: a pretty-printed safety-event row is **3,553 chars** — above the deliberate 1,900 block bound; the driver refused before writing. The fix: wide rows split into labeled field-line parts (row N part k/m), every field verbatim, longest block measured 1,813.

## License gate (re-measured fresh, never inherited)

"**Public Domain U.S. Government**" verified verbatim from the dataset's OWN Socrata metadata BEFORE any read; attribution "Federal Transit Administration"; the linked usa.gov page is still a JS shell (re-measured + DISCLOSED again; posture verified at 12D-369). PII caution disclosed in the snapshot: casualty/location detail stays a read-only bounded sample, nothing aggregated or enriched.

## Measured

10 rows → 22 chunks → **22 drafts AWAITING_REVIEW**, settled by the pinned primary `qwen2.5-coder:7b`, remoteCalls 0.

## Honest flags (pinned)

`humanDecision: 'REQUIRED'`, `learningPromoted: false`, `activated: 0`, `collectsNothing: true`, `automaticRecovery: false`, `billionUsersProven: false`. remoteCalls 0. 10 rows — far below the 2,000,000-row measured ceiling, the ONLY measured ceiling.

## Drafts: CEO-gated

22 drafts (AWAITING_REVIEW) — NO apply without the CEO's recorded standing approval.

## Next candidates

- Apply rung for the 413/415/416 drafts (27 total) under the recorded blanket approval.
- 12D-416 World Bank rural population (driver ready).