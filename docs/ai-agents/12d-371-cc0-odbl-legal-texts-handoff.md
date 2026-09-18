# 12D-371 — CC0 1.0 + ODbL 1.0 legal texts verified (reading rung)

**Story rung:** 12D-371 (verify-then-read — license-text
verification, 12D-369/370 pattern) · **Parents:** 12D-370 ·
**Policy footprint:** none added

## What this rung is

The register cites CC0 (CFPB/SSA/data.gov federal) and ODbL
(non-default World Bank datasets). This rung verifies the LICENSE
TEXTS themselves from their canonical pages, not just the pointers:

- **CC0 1.0 (verbatim, legalcode)**: irrevocable waiver of Copyright
  and Related Rights worldwide "for any purpose whatsoever,
  including without limitation commercial, advertising or
  promotional purposes"; "No trademark or patent rights held by
  Affirmer are waived"; the Work is offered "as-is" with no
  warranties. **No share-alike** — extraction free for any purpose.
- **ODbL 1.0 (verbatim, 1-0)**: grant includes "Extraction and
  Re-utilisation of the whole or a Substantial part of the
  Contents"; **SHARE-ALIKE (Sec 4.4)**: "Any Derivative Database that
  You Publicly Use must be only under the terms of" this License,
  and "Extraction or Re-utilisation of the whole or a Substantial
  part of the Contents into a new database is a Derivative
  Database"; notices (Sec 4.2) keep the license URI + intact
  copyright/Database Right notices; Produced-Work notice (Sec 4.3):
  "Contains information from DATABASE NAME, which is made available
  here under the Open Database License (ODbL)."; Sec 4.6 offers the
  full derivative DB or alteration file to public users; collective
  and internal-use carve-outs (Sec 4.5).

## Operative constraint for the XIV AI OS

Extracting a SUBSTANTIAL part of an ODbL-licensed dataset into a new
database makes the OS queue content a Derivative Database carrying
ODbL share-alike obligations if publicly used. Future ODbL extraction
rungs stay **bounded (small samples, not substantial parts)** or are
CEO-approved with the share-alike consequence DISCLOSED. CC0 sources
carry no share-alike. Attribution strings carried per dataset; the
Sec 4.3 notice pattern is adopted for any ODbL-derived content.

## Measured

- 1 source registered + read through the REAL 12D-276 register + REAL
  12D-283 supervised cycle: 2 chunks → 2 drafts AWAITING_REVIEW,
  modelCalls 2, remoteCalls 0 (loopback Ollama only).
- Snapshot (scratch): `.xiv-runtime/reading-sources-12d-371/cc0-odbl-legal-texts.md`
  · driver: `.xiv-runtime/reading-driver-12d-371.ts` (never committed).

## Next candidates

1. Landing: 12D-355..363 + 366..370 (14 prepared commits; HEAD
   b996dd82) + this rung.
2. 12D-340 apply execution — CEO-approved; classifier-gate blocked
   (2 refusals this segment).
3. CEO-gated multi-MODEL rung (12D-367 handoff candidate).
4. Bounded CFPB structured-field extraction rung (CEO-gated; contract
   + rights layer + privacy posture verified).