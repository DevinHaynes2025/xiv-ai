# 12D-427/428/429 — GTFS slice 6 + World Bank air passengers + the apply run (5 decisions)

Date: 2026-09-18 (24/7 build). Branch: `claude/12d-99-supervised-local-worker`.

## 12D-427 — GTFS Schedule Reference, sixth bounded slice (chars 30,000–36,000)

Drift guard holds (strip 140,905 identical); license gate re-measured fresh (CC BY 3.0 + Apache 2.0 verbatim from gtfs.org/about); 4 chunks → **4 drafts AWAITING_REVIEW**, remoteCalls 0. 36,000 of 140,905 chars read across six rungs.

## 12D-428 — World Bank air transport passengers (IS.AIR.PSGR × the CEO's five countries)

License gate re-measured fresh (CC BY 4.0 verbatim, 10th terms measure). ONE live fail-closed proof: my first indicator code `IS.AIR.PSGR.P1` is INVALID — the API answered with an explicit `Invalid value` message and the driver's no-rows guard refused before anything was written; the valid code **`IS.AIR.PSGR`** ("Air transport, passengers carried") measured 5 rows (EGY 2023: 16,672,111 passengers; the sample keeps every value verbatim) → **1 draft AWAITING_REVIEW**, remoteCalls 0. Lesson reinforced: a 0-total or no-rows envelope means VERIFY the code; the publisher's own error message is the truth.

## 12D-429 — apply run

5 drafts (427:4, 428:1) applied through the REAL worksheet → decisions → apply chain under the CEO's recorded blanket-trust approval VERBATIM; census DONE ×4 / DONE ×1. **Campaign all-time: 362 applied review decisions** (357 + 5). Zero AWAITING_REVIEW anywhere.

## Honest flags (pinned everywhere)

`humanDecision: 'REQUIRED'`, `learningPromoted: false`, `activated: 0`, `collectsNothing: true`, `automaticRecovery: false`, `billionUsersProven: false`. remoteCalls 0. 2,000,000 rows/database is the only measured ceiling.

## Next candidates

- GTFS slice 7+; more World Bank mobility indicators (rail/CO2 emissions next); more NTD surfaces; ledger current through 429.