# 12D-389 — Bounded CFPB facet census (counts only, zero records fetched)

**Status:** EXECUTED (reading rung; drafts AWAITING_REVIEW — CEO-gated review next; commit on `claude/12d-99-supervised-local-worker`)
**Date:** 2026-09-18 (build + live run)

## What this rung measured

Follow-on to 12D-388: the publisher's **facet aggregation surface** (`size=0&facetype=...`) was read for four facets — `product`, `issue`, `company_response`, `submitted_via`. **size=0: ZERO records fetched** — only the publisher's own aggregation bucket counts. Counts only; no records, no narratives, no PII (the 12D-388 forbidden-field gate is trivially satisfied — no fields fetched at all).

- All four facets returned HTTP 200 with non-empty buckets; any non-200 refuses that facet and is disclosed, never silently skipped.
- Total hits in every response: 17,842,775 (unchanged from 12D-366/12D-388).
- Measured shape: credit-reporting complaints dominate the product facet by count (the publisher's own buckets, quoted verbatim in the snapshot).

## Fail-closed proofs (two live this rung)

1. **Chunker block gate (12D-378/12D-388 proof, third occurrence):** the REAL chunker REFUSED the first run — consecutive bucket list lines form one blank-line-separated block over the 2200-char bound ("re-chunk the source deliberately — silent truncation is refused"). Fixed by laying one bucket line per block. My own first "guard" (per-line length check) missed the block semantics — the REAL contract caught it, which is the point of fail-closed.
2. **Draft-budget gate, durable:** with facets fully enumerated, chunk 2's model draft measured **2,222 chars** — over the reading cycle's draft budget — and the REAL cycle **settled it FAILED durably** (post-call refusal, never a silent retry). Handled deliberately: the enumeration cap is now **disclosed in the source itself** — every facet's buckets are ALL measured (measured counts recorded), the TOP 50 enumerated, and the cap is stated verbatim in the snapshot ("the cap is stated here, never silent"). Re-ran clean.
3. Register bounds honored (title ≤200); license note discloses CC0-verified-BEFORE-read + size=0 counts-only.

## The reading

1 source (`cfpb-ccdb-facet-census`, PUBLIC_WEB at the publisher API URL) → **4 chunks → 4 drafts settled AWAITING_REVIEW** through the REAL supervised cycle (loopback qwen2.5-coder:7b; `modelCalls: 4`, `remoteCalls: 0`, remainingReady 0). Scratch artifacts (never committed): `.xiv-runtime/reading-driver-12d-389.ts`, `.xiv-runtime/reading-sources-12d-389/cfpb-facet-census-12d-389.md`, `.xiv-runtime/reading-12d-389/`.

## Honest flags (pinned)

`humanDecision 'REQUIRED'` · `learningPromoted false` · `activated 0` · `collectsNothing true` · `automaticRecovery false` · `billionUsersProven false` · `remoteCalls 0` · measured ceiling unchanged: 2,000,000 rows. The drafts are CEO-gated: NO review decision without the CEO's recorded approval.

## Next candidates

1. CEO review decisions on the 10 (12D-388) + 4 (12D-389) new drafts.
2. Ledger touch: record the `format=json` drift correction + the 12D-388/389 bounded-extraction rungs in `docs/verified-reading-ledger-2026-09-19.md`.
3. Extend bounded reads to other CEO-named verified layers (data.gov per-dataset, World Bank) under the same gates.