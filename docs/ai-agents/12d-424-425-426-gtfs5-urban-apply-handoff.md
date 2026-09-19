# 12D-424/425/426 — GTFS slice 5 + World Bank urban population + the apply run (5 decisions)

Date: 2026-09-18 (24/7 build). Branch: `claude/12d-99-supervised-local-worker`.

## 12D-424 — GTFS Schedule Reference, fifth bounded slice (chars 24,000–30,000)

Drift guard holds (strip 140,905 identical); license gate re-measured fresh (CC BY 3.0 + Apache 2.0 verbatim from gtfs.org/about); 4 chunks → **4 drafts AWAITING_REVIEW**, remoteCalls 0. 30,000 of 140,905 chars read across five rungs.

## 12D-425 — World Bank urban population (SP.URB.TOTL.IN.ZS × the CEO's five countries)

License gate re-measured fresh (CC BY 4.0 verbatim from data.worldbank.org/summary-terms-of-use, 9th measure). ONE live fail-closed proof: my first indicator code `SP.URB.TOTL.ZS` is NOT a code — the API honestly returned total 0 and the driver's no-rows guard refused before anything was written; the correct code `SP.URB.TOTL.IN.ZS` measured 5 rows (urban population % of total × {NGA, ZAF, ETH, KEN, EGY} × mrv=1) → **1 draft AWAITING_REVIEW**, remoteCalls 0.

## 12D-426 — apply run

5 drafts (424:4, 425:1) applied through the REAL worksheet → decisions → apply chain under the CEO's recorded blanket-trust approval VERBATIM; census DONE ×4 / DONE ×1. **Campaign all-time: 357 applied review decisions** (352 + 5). Zero AWAITING_REVIEW anywhere.

## Honest flags (pinned everywhere)

`humanDecision: 'REQUIRED'`, `learningPromoted: false`, `activated: 0`, `collectsNothing: true`, `automaticRecovery: false`, `billionUsersProven: false`. remoteCalls 0. 2,000,000 rows/database is the only measured ceiling.

## Next candidates

- GTFS slice 6+; more World Bank indicators (the indicator-code lesson: a 0-total envelope now means VERIFY the code, the driver refuses); more NTD surfaces; ledger current through 426.