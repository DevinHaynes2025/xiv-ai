# 12D-372 — World Bank ODbL example measured (reading rung)

**Story rung:** 12D-372 (verify-then-read — ODbL constraint made
concrete, 12D-371 pattern) · **Parents:** 12D-371 ·
**Policy footprint:** none added

## What this rung is

The 12D-371 ODbL share-alike constraint now has a measured example:
the World Bank catalog record **"Green Building Certification Data"**
(ID 0064630) states verbatim **"This dataset is licensed under Open
Database License"** (public access; Excel distribution; updated Jul
2023).

Catalog policy (public-licenses, 12D-360 + this rung) confirms the
per-dataset license class: ODbL is used "when required to do so by
the original data provider or by the conditions of a data
partnership" — never by default (CC BY 4.0 is the default for
WB-produced open data); most Microdata Library unit-level data carry
the RESTRICTED Microdata Research License, not ODbL.

## Measured

- 1 source registered + read through the REAL 12D-276 register + REAL
  12D-283 supervised cycle: 1 chunk → 1 draft AWAITING_REVIEW,
  modelCalls 1, remoteCalls 0 (loopback Ollama only).
- Fail-closed proof in the register itself: the first driver run's
  200+-char source title was REFUSED by the REAL
  `registerReadingSource` bound ("a bounded source title (1..200
  chars) is required; fail closed") — the title was shortened and the
  driver re-ran. The register's bound is live, not decorative.
- Snapshot (scratch): `.xiv-runtime/reading-sources-12d-372/worldbank-odbl-example.md`
  · driver: `.xiv-runtime/reading-driver-12d-372.ts` (never
  committed).

## Operative constraint (re-pinned)

Substantial-part extraction of an ODbL dataset into a new database =
Derivative Database (ODbL Sec 4.4 share-alike) if publicly used.
Bounded samples stay the fail-safe default; CEO approval + disclosure
for anything more. 2,000,000 rows/database is the ONLY measured
ceiling.

## Next candidates

1. Landing: 12D-355..363 + 366..371 (15 prepared commits; HEAD
   b996dd82) + this rung.
2. 12D-340 apply execution — CEO-approved; classifier-gate blocked
   this segment (2 refusals).
3. CEO-gated multi-MODEL rung (12D-367 handoff candidate).
4. Bounded CFPB structured-field extraction rung (CEO-gated).