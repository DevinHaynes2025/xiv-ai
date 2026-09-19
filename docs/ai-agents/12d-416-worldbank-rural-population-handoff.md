# 12D-416 — bounded World Bank rural-population read (SP.RUR.TOTL.ZS × the CEO's five countries)

Date: 2026-09-18 (24/7 build). Branch: `claude/12d-99-supervised-local-worker`.

## What this rung is

Further data drilling per CEO direction 2026-09-18: indicator **SP.RUR.TOTL.ZS** (rural population, % of total) × {NGA, ZAF, ETH, KEN, EGY} × mrv=1 = 5 rows, through the operator CLI door with `--declaredFailover true`.

## TWO live fail-closed proofs this rung

1. **The terms URL**: my first gate URL (`www.worldbank.org/en/about/legal/terms-of-use-for-world-bank-open-data`) returned **HTTP 404** — refused before any read. The proven surface (data.worldbank.org/summary-terms-of-use, the URL the 12D-391/392/398/401 gates measured) was adopted; the gate then verified **"Unless indicated otherwise … Creative Commons Attribution 4.0 International License"** verbatim, fresh this rung.
2. **My own envelope bug**: I indexed the JSON envelope backwards (payload[0] is the metadata block; payload[1] holds the rows) — the driver honestly refused "the API returned no rows" on a healthy 200. The probe showed the true shape; the fix is in the driver, and the measured result now comes from the REAL rows.

## Measured

5 rows (envelope total 5, lastupdated 2026-07-13), 1 chunk → **1 draft AWAITING_REVIEW**, settled by the pinned primary, remoteCalls 0, longest block 560.

## Honest flags (pinned)

`humanDecision: 'REQUIRED'`, `learningPromoted: false`, `activated: 0`, `collectsNothing: true`, `automaticRecovery: false`, `billionUsersProven: false`. remoteCalls 0. 5 rows — far below the 2,000,000-row measured ceiling, the ONLY measured ceiling.

## Drafts: CEO-gated

1 draft (AWAITING_REVIEW) — NO apply without the CEO's recorded standing approval.

## Next candidates

- Apply rung for the 413/415/416 drafts (27 total) under the recorded blanket approval.
- More World Bank indicators through the pattern; more NTD surfaces (FRA Commuter Rail 63rf-6igh is license-verified per catalog).