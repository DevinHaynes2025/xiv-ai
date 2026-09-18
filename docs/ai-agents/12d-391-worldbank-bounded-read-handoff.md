# 12D-391 — Bounded World Bank API read (CC BY 4.0 re-verified verbatim BEFORE read)

**Status:** EXECUTED (reading rung; draft AWAITING_REVIEW — CEO-gated; commit on `claude/12d-99-supervised-local-worker`)
**Date:** 2026-09-18 (build + live run)

## What this rung measured

First read from the **World Bank** layer (12D-372 verified the catalog posture: ODbL only when the provider requires it — the DEFAULT is CC BY 4.0). 12D-391 reads a **bounded live sample**: indicator `SP.POP.TOTL` (Population, total), country USA, the 5 most-recent observations (`per_page=5`) from the publisher's public API.

- **License gate enforced in the driver itself:** BEFORE any read, the driver fetches the publisher's Summary Terms of Use page and REFUSES unless the operative sentence is present verbatim — measured quote: "Unless indicated otherwise in the data or indicator metadata, you are free to copy, distribute, adapt, display or include the data in other products for commercial or noncommercial purposes at no cost under a Creative Commons Attribution 4.0 International License…". The page's **binding mediation/arbitration addition** is noted and rides with any use.
- **Attribution duty recorded:** the reading chain reads and notes; any future REUSE of World Bank data in OS output must attribute "World Bank Open Data, CC BY 4.0".
- **API envelope measured:** total 66 observations for this series, lastupdated 2026-07-13.
- **Ceiling guard:** the driver refuses if a dataset totals above 2,000,000 rows — the only measured ceiling.

## Fail-closed proofs (by design, enforced pre-read)

- License gate (verbatim-quote refusal if the terms language is absent) — three refusal branches built and armed before the data fetch ran.
- Sample-bound (5 rows), title bound (≤200), one-datum-per-block layout (the 12D-378/388/389 chunker lesson applied preemptively — no refusal this time).

## The reading

1 source (`worldbank-open-data-bounded`, PUBLIC_WEB at the publisher API URL; license note discloses the double license verification + attribution duty) → **1 chunk → 1 draft settled AWAITING_REVIEW** through the REAL supervised cycle (loopback qwen2.5-coder:7b; `modelCalls: 1`, `remoteCalls: 0`, remainingReady 0). Scratch artifacts (never committed): `.xiv-runtime/reading-driver-12d-391.ts`, `.xiv-runtime/reading-sources-12d-391/worldbank-bounded-12d-391.md`, `.xiv-runtime/reading-12d-391/`.

## Honest flags (pinned)

`humanDecision 'REQUIRED'` · `learningPromoted false` · `activated 0` · `collectsNothing true` · `automaticRecovery false` · `billionUsersProven false` · `remoteCalls 0` · measured ceiling unchanged: 2,000,000 rows. The draft is CEO-gated: NO review decision without the CEO's recorded approval.

## Next candidates

1. CEO review decisions on the 14 (12D-388/389) + 1 (12D-391) new drafts.
2. Extend the World Bank layer: a second indicator or a multi-country bounded slice (same license gate, same bounds).
3. data.gov per-dataset bounded reads (12D-369 layer) under the same gates.