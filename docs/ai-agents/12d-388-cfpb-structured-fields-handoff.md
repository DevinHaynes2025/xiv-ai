# 12D-388 — Bounded CFPB structured-field extraction (live sample, 12D-370 re-verified against live data)

**Status:** EXECUTED (reading rung; drafts AWAITING_REVIEW — CEO-gated review next; commit on `claude/12d-99-supervised-local-worker`)
**Date:** 2026-09-18 (build + live run)
**CEO basis:** standing directive (24/7 build); the CFPB rung was CEO-named in directive #3 ("extract trillions of data" — honestly mapped to bounded, measured reads; the only measured ceiling remains 2,000,000 rows).

## What this rung measured

The three CFPB layers were verified committed rungs — 12D-366 (API contract, CC0, from the publisher's own OpenAPI spec), 12D-369 (data.gov per-dataset rights), 12D-370 (data-use policy: Release 22 removed "Consumer disputed" + "Consumer consent provided"; Release 24 removed complaint narratives — STRUCTURED FIELDS ONLY). 12D-388 fetches a **bounded live sample (25 records)** from the publisher's public API and re-verifies the 12D-370 claims against the LIVE data:

- **15 structured fields observed:** company, company_public_response, company_response, complaint_id, date_received, date_sent_to_company, issue, product, state, sub_issue, sub_product, submitted_via, tags, timely, zip_code.
- **Forbidden fields present: NONE.** `complaint_what_happened` (narrative), `consumer_disputed`, `consumer_consent_provided` — absent from all 25 live records. The 12D-370 verification holds against the live surface, not just the policy page.
- **Total hits: 17,842,775** — unchanged from 12D-366's measurement.
- The sample is 25 rows — a bounded read, never bulk extraction; nothing aggregated, joined, or enriched; no PII re-identification attempted (the publisher's own ZIP truncation posture, verified in 12D-370, is why none is possible from this surface).

## MEASURED CONTRACT DRIFT (disclosed)

The 12D-366-verified OpenAPI spec allowed a `format=json` parameter; **the LIVE API now returns HTTP 404 for `format=json`** while the same URL WITHOUT it serves JSON by default (measured 2026-09-18). The driver adapted to the MEASURED live behavior and records the drift verbatim in the source snapshot. A verified contract that drifts is recorded, never assumed away.

## Fail-closed proofs

1. **Publisher refusal honored:** the first driver run REFUSED ("the publisher API returned HTTP 404; refusing (fail closed)") when `format=json` was rejected — the driver wrote nothing and adapted only after measuring the live behavior.
2. **Forbidden-field gate:** the driver refuses and writes NOTHING if any sample record carries a narrative/consent/disputed-shaped field — the 12D-370 verification must hold live or nothing proceeds.
3. **Chunker block gate (12D-378 proof again):** the REAL chunker REFUSED the first source ("a paragraph exceeds 2200 chars; re-chunk the source deliberately — silent truncation is refused; fail closed") — a pretty-printed JSON record exceeds the block bound. Deliberate re-chunk: record text preserved VERBATIM, only blank-line layout changed (blocks packed ≤1900 chars, largest measured <2200); re-ran clean.
4. **Register bounds honored:** title ≤200 chars checked before registering.

## The reading

1 source (`cfpb-ccdb-structured-fields`, PUBLIC_WEB at the publisher API URL, license note disclosing CC0-verified-BEFORE-read + bounded sample + forbidden-fields-absent) → **10 chunks → 10 drafts settled AWAITING_REVIEW** through the REAL 12D-283 supervised cycle (loopback qwen2.5-coder:7b; `modelCalls: 10`, `remoteCalls: 0`, remainingReady 0). Scratch artifacts (never committed): `.xiv-runtime/reading-driver-12d-388.ts`, `.xiv-runtime/reading-sources-12d-388/cfpb-structured-fields-12d-388.md`, `.xiv-runtime/reading-12d-388/`.

## Honest flags (pinned)

`humanDecision 'REQUIRED'` · `learningPromoted false` · `activated 0` · `collectsNothing true` · `automaticRecovery false` · `billionUsersProven false` · `remoteCalls 0` · measured ceiling unchanged: 2,000,000 rows. The drafts are CEO-gated: NO review decision is applied without the CEO's recorded approval.

## Next candidates

1. CEO review decisions on the 10 new drafts (12D-382 pattern — recorded CEO approval required first).
2. Extend the bounded sample to additional CFPB structured slices (product/issue facets) — same fail-closed gates.
3. Optional: record the `format=json` drift as a correction note in `docs/verified-reading-ledger-2026-09-19.md` at the next ledger-touching rung.