# 12D-375 — First license-verified reads from the CEO batch (reading rung)

**Story rung:** 12D-375 (verify-then-read — first reads from the
12D-373/374 CEO batch) · **Parents:** 12D-374 ·
**Policy footprint:** none added

## What this rung is

The first two CEO-batch sources READ through the supervised cycle,
each with its license verified BEFORE the read:

- **uber/ribs** — Apache-2.0 verified twice (SPDX 12D-374 + README
  verbatim "Licensed under the Apache License, Version 2.0").
  Architecture reference read: Router/Interactor/Builder; business
  logic drives the app, not the view tree; RIB logic unit-testable in
  isolation; hierarchical DI via constructor parameters on child
  Builders. Read as build reference — NO code copied. Relevance: the
  discipline mirrors the runtime's fail-closed contract doors (pure
  cores, injected callers, view models).
- **MobilityData/mobility-database-catalogs** — code Apache-2.0;
  metadata CC0 verbatim ("All of the Mobility Database catalog's
  metadata is made available under Creative Commons CC0 (CC0)").
  Worldwide GTFS Schedule + GTFS Realtime feed catalog
  (mdb_source_id, bounding boxes, entity_type vp/tu/sa,
  static_reference); CSV export at files.mobilitydatabase.org; feeds
  validated via the Canonical GTFS Schedule Validator. Per-feed
  provider terms govern (per-source rule). This is the mobility-data
  layer for the CEO's mobility direction — GTFS shapes are the
  standard to learn before any transit-brain rung.

## Measured

- 2 sources registered + read through the REAL 12D-276 register +
  REAL 12D-283 supervised cycle: 2 chunks → 2 drafts AWAITING_REVIEW,
  modelCalls 2, remoteCalls 0 (loopback Ollama only).
- Snapshots (scratch): `.xiv-runtime/reading-sources-12d-375/uber-ribs.md`,
  `mobility-database-catalogs.md` · driver:
  `.xiv-runtime/reading-driver-12d-375.ts` (never committed).

## Next candidates

1. Approval rung for the 12D-366..375 drafts (12 AWAITING_REVIEW,
   CEO-gated — NOT covered by the apply run's recorded approvals).
2. More license-verified reads from the batch (Apache/MIT/CC-BY
   first; AGPL/GPL reference-only; ODbL bounded; the 6 no-license
   repos need upstream verification or stay unread).
3. Offline-only Waymax-paper reading rung; main.pdf identity check.
4. CEO-gated multi-MODEL rung; bounded CFPB structured-field
   extraction rung.