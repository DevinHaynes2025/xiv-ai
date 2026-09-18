# 12D-370 — CFPB data-use policy + field removals verified (reading rung)

**Story rung:** 12D-370 (verify-then-read — publisher privacy policy +
contract change verification, 12D-366/369 pattern) · **Parents:**
12D-369 · **Policy footprint:** none added

## What this rung is

Completes and CORRECTS the CFPB contract (12D-366) from the
publisher's own pages:

- **MATERIAL CHANGE (verbatim, release notes)**:
  - Release 24 — September 2026: "Consumers' complaint narratives and
    complaint data visualizations have been removed from the
    database."
  - Release 22 — June 2026: export (CSV and JSON) updated "removing
    'Consumer disputed' and 'Consumer consent provided'"; the consent
    filter was removed September 2025.
  - `fields.html` today lists no consent/narrative fields — the
    database carries **structured fields only**. The 12D-366-era
    consent/narrative note is outdated; any future bounded extraction
    rung is structured-field extraction only.
- **Privacy posture (verbatim, data-use page)**: PII (names, contact,
  account numbers, SSNs, documents) "is not published in the Consumer
  Complaint Database"; ZIP codes 5-digit / 3-digit / blank with the
  <20,000-people truncation rule; "We publish complaints after the
  company responds or after 15 days, whichever comes first."
- **Mirrors are not the publisher**: historical copies (e.g. Hugging
  Face) still carry removed fields — per-source license and terms
  govern (portal lesson).

## Measured

- 1 source registered + read through the REAL 12D-276 register + REAL
  12D-283 supervised cycle: 2 chunks → 2 drafts AWAITING_REVIEW,
  modelCalls 2, remoteCalls 0 (loopback Ollama only).
- Snapshot (scratch): `.xiv-runtime/reading-sources-12d-370/cfpb-data-use-and-removals.md`
  · driver: `.xiv-runtime/reading-driver-12d-370.ts` (never committed).

## Next candidates

1. Landing: 12D-355 → 356 → 357 → 358 → 359 → 360 → 361 → 362 → 363 →
   366 → 367 → 368 → 369 (13 prepared commits; HEAD b996dd82) + this
   rung.
2. 12D-340 apply execution — CEO-approved; classifier-gate blocked
   this segment (2 refusals).
3. CEO-gated multi-MODEL rung (12D-367 handoff candidate).
4. Bounded CFPB structured-field extraction rung (CEO-gated; contract
   + rights layer + privacy posture all verified now).