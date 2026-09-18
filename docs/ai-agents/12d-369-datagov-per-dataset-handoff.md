# 12D-369 — data.gov per-dataset Access & Use verified (reading rung)

**Story rung:** 12D-369 (verify-then-read — per-dataset rights
verification, 12D-360/366 pattern) · **Parents:** 12D-368 ·
**Policy footprint:** none added

## What this rung is

The data.gov extraction direction's rights layer, verified from the
government's own pages before any future bounded extraction:

- **Platform posture (verbatim,
  resources.data.gov/open-licenses/)**: "Government works are by
  default in the U.S. Public Domain"; "Agencies are encouraged to use
  Creative Commons Zero (CC0) for new datasets"; the legacy
  usa.gov publicdomain label "serves only as a machine-readable
  identifier for that statutory status"; approved open licenses =
  CC0, CC BY 4.0, CC BY-SA 4.0, PDDL, ODC-By, ODbL; FAR subpart 27.4
  clauses apply to contracted data.
- **Per-dataset Access & Use, measured in THREE directions**:
  1. SSA "Annual Statistical Supplement (series)" — License CC0 1.0
     URL + Access Level public (a record CAN carry a per-dataset
     license).
  2. CFPB "Consumer Complaint Database" catalog record — Access Level
     public ONLY, no license field, rights null: the platform § 105
     posture does NOT substitute; the publisher's own grant governs.
  3. NOAA NMFS records — CC0 with accessLevel non-public: a license
     does not equal access.

## Measured

- 1 source registered + read through the REAL 12D-276 register + REAL
  12D-283 supervised cycle: 2 chunks → 2 drafts AWAITING_REVIEW,
  modelCalls 2, remoteCalls 0 (loopback Ollama only).
- Snapshot (scratch): `.xiv-runtime/reading-sources-12d-369/datagov-per-dataset-access-use.md`
  · driver: `.xiv-runtime/reading-driver-12d-369.ts` (never committed).

## Discipline re-pinned

Per-dataset Access & Use + the publisher's own page are read FIRST,
per dataset, before any bounded extraction rung; catalog posture alone
never suffices (Socrata lesson, reiterated with three measured
directions). Secrets never render and never reach any model;
2,000,000 rows/database is the ONLY measured ceiling.

## Next candidates

1. Landing: 12D-355 → 356 → 357 → 358 → 359 → 360 → 361 → 362 → 363 →
   366 → 367 → 368 (12 prepared commits; HEAD b996dd82) + this rung.
2. 12D-340 apply execution — CEO-approved; classifier-gate blocked
   this segment (3 refusals).
3. CEO-gated multi-MODEL rung (12D-367 handoff candidate).
4. Bounded CFPB extraction rung (CEO-gated; 12D-366 contract +
   12D-369 rights layer both ready).