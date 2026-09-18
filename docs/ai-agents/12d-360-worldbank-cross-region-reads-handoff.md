# 12D-360 — World Bank Open Data: the CEO-named cross-region rung (Africa/China)

**Story rung:** 12D-360 (operational rung — license verification +
supervised reads) · **Parents:** CEO directive 2026-09-18 ("africa
datasets and china") / 12D-359 · **Policy footprint:** none added

## What this rung is

The CEO directed cross-region extraction (Africa/China). The honest
path is the one the OS already runs — verify-then-read through the
REAL doors. First target: the World Bank Open Data ecosystem, which
covers both regions under one verified license:

- **License VERIFIED BEFORE any read** from the publisher's own
  licensing page (datacatalog.worldbank.org/public-licenses, quoted
  verbatim): "CC-BY 4.0, with the additional terms below, is the
  default license for all Datasets produced by the World Bank itself."
  Copy, modify, distribute for any purpose including commercial use;
  only attribution + indicate-changes required. DISCLOSED: additional
  mediation/arbitration terms on CC-BY 4.0 datasets; ODbL and the
  Microdata Research License (restricted, no redistribution) govern
  non-default datasets; per-dataset terms govern third-party-
  contributed data — portal posture does not license hosted content
  (Socrata lesson).
- **Three documents read** through the REAL 12D-283 supervised cycle
  (loopback only, `remoteCalls 0`): the Data Catalog Data Access And
  Licensing page, the World Bank Group Terms & Conditions (dataset
  terms incorporated by reference; APIs for "certain non-commercial
  uses"), and the data.worldbank.org portal homepage (WDI —
  internationally comparable development statistics including African
  and Chinese economies).
- **Honest limits, disclosed:** the portal homepage carries NO license
  text (verification came from the catalog licensing page); the
  /summary-terms-of-use and terms-of-use URLs 404'd for non-JS fetch;
  the exact API interface contract remains UNVERIFIED; NO bulk
  download performed — 2,000,000 rows/database remains the only
  measured ceiling. "Trillions of documents" stays recorded as VISION.
- Census: drafts AWAITING_REVIEW (see the driver census output).

## Next candidates

1. Landing: 12D-354 → 355 → 356 → 357 → 358 → 359 (6 prepared
   commits), then 12D-360 (this rung).
2. WDI interface-contract verification (datahelpdesk.worldbank.org API
   docs), then measured extraction rungs for African/Chinese economy
   indicators.
3. 12D-340 apply execution — classifier-gated, staged for the CEO;
   NOT retried without the CEO's explicit go-ahead.
4. Approval rung for the 12D-360 drafts (CEO-gated; approval
   2026-09-18b "i approve lets continue working" recorded).

## Approval record (blanket, DISCLOSED)

2026-09-18b — CEO Devin Xavier Haynes: "i approve lets continue
working" — blanket authorization for the 12D-360 drafts, disclosed as
blanket (never as per-draft reviews).