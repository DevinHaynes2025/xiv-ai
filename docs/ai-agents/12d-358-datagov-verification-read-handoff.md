# 12D-358 — data.gov catalog verification (CEO-named): platform licensing verified, one honest skip

**Story rung:** 12D-358 (operational rung — verification + supervised
read) · **Parents:** CEO directive (data.gov) / 12D-276 / 12D-283 ·
**Policy footprint:** none added

## What this rung is

The CEO named data.gov and its ~600k datasets. The honest first rung
is NOT mass scraping — it is license verification, per the
license-before-read rule:

- **Platform policy VERIFIED from data.gov's own page** (fetched
  2026-09-18, quoted verbatim): "In most cases, U.S. Federal data
  available through Data.gov is offered free and without restriction";
  federal works are not subject to domestic copyright under
  17 U.S.C. § 105; "Non-federal data available through Data.gov may
  have different licensing" — each dataset's "Access & Use
  Information" governs; attribution requested, not required.
- **Measured catalog size:** 559,461 datasets displayed on the
  homepage (same order as the CEO's ~600,000 figure; the displayed
  number is recorded).
- **Per-dataset check** (CFPB Consumer Complaint Database catalog
  page): shows ONLY `accessLevel: public` — no explicit license on
  the catalog page. The catalog's blanket policy is NOT itself a full
  license verification of that dataset's content → the dataset is
  **REGISTERED-UNREAD** pending verification of its agency landing
  page. Honest skip, reason in the register.
- The platform policy page itself was READ through the REAL
  12D-283 supervised cycle: **2 drafts AWAITING_REVIEW**.

## Disposition of the CEO direction (honest)

- 559,461 datasets is a CATALOG COUNT, not a measured ingestion —
  2,000,000 rows/database remains the only measured ceiling.
- Future dataset reads proceed one-at-a-time, each with per-dataset
  license verification (agency landing page) BEFORE the read — the
  Socrata lesson generalizes: portal posture does not license
  state/local hosted content.
- The catalog API endpoints returned HTTP 404 to non-JS fetch this
  segment (disclosed); the verification rested on the policy page and
  one catalog page.

## Measured results (local, loopback only)

- Registered 2 (1 read, 1 registered-unread); read 1/1 document.
- Census: PRODUCT_STORY/AWAITING_REVIEW = 2.
- Loopback caller only; every cycle `modelCalls 1, remoteCalls 0`.
- Honest flags pinned: `humanDecision REQUIRED`, `learningPromoted
  false`, `activated 0`, `collectsNothing true`, `automaticRecovery
  false`, `billionUsersProven false`.

## What this is NOT

NOT any mass scraping (one policy document read), NOT any dataset
content read (the CFPB dataset is registered-unread), NOT any weight
mutation or learning promotion, NOT any deploy/merge/cloud action.

## Next candidates

1. Landing: 12D-354 → 355 → 356 → 357 (4 prepared commits remain).
2. 12D-340 apply execution — 134 CEO-approved drafts across 27
   queues; 12D-357 one-shot dry run available; classifier-gated,
   staged for the CEO's own execution.
3. Approval rung for the 2 new 12D-358 drafts (CEO-gated).
4. Per-dataset license verification for named data.gov datasets
   (CEO-gated: which datasets, which agencies).