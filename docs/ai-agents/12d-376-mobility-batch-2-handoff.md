# 12D-376 — Mobility batch 2: ovikl + ActivityViz + OTP license resolved (reading rung)

**Story rung:** 12D-376 (verify-then-read — CEO-batch reads 2)
· **Parents:** 12D-375 · **Policy footprint:** none added

## What this rung is

Three more CEO-batch sources read through the supervised cycle, each
license verified BEFORE read:

- **ovikl (MIT confirmed)** — open-source ride-hailing platform
  ("opensource alternative to Uber, Lyft, Careem and Bolt");
  ovikl-android (Java/Firebase), ovikl-ios (Swift), ovikl-html
  (NGINX/Node), ovikl-nodejs (Node.js; MongoDB; Redis). Reference
  read, no code copy.
- **RSGInc/ActivityViz (Apache-2.0 confirmed)** — interactive
  travel/activity data visualization dashboard: household travel
  surveys, trip/activity-based model outputs, passive data; 3D trip
  maps, radar charts, sunburst mode share, chord OD diagrams; data
  via per-scenario CSVs + GeoJSON; funded by the Atlanta Regional
  Commission + Oregon Metro. The scenario/CSV/GeoJSON pattern is
  noted as a premium data-viz idiom for the XIV AI OS mobility layer.
- **OpenTripPlanner — NOASSERTION RESOLVED: LGPL-3.0**, verified from
  the LICENSE file itself (verbatim: "This program is free software:
  you can redistribute it and/or modify it under the terms of the GNU
  Lesser General Public License as published by the Free Software
  Foundation, either version 3 of the License, or (at your option)
  any later version."; Apache-2.0/LGPL-2.1 portions). Copyleft ⇒
  REFERENCE-ONLY (same discipline as trufi-core GPL-3.0, TREK
  AGPL-3.0).

## Measured

- 3 sources registered + read through the REAL 12D-276 register +
  REAL 12D-283 supervised cycle: 6 chunks → 6 drafts AWAITING_REVIEW,
  modelCalls 6, remoteCalls 0 (loopback Ollama only).
- Snapshot (scratch): `.xiv-runtime/reading-sources-12d-376/mobility-batch-2.md`
  · driver: `.xiv-runtime/reading-driver-12d-376.ts` (never
  committed).

## Next candidates

1. Approval rung for the 12D-366..376 drafts (18 AWAITING_REVIEW,
   CEO-gated).
2. More verified reads (travel-db MIT, awesome-open-transport MIT,
   screen_qa CC-BY-4.0, howtodiv/cultural_familiarity Apache-2.0,
   WaxalNLP/WikiProfile CC-BY-SA); the 6 no-license repos stay
   unread pending upstream verification.
3. Offline-only Waymax-paper reading rung; main.pdf identity check.
4. CEO-gated multi-MODEL rung; bounded CFPB structured-field
   extraction rung.