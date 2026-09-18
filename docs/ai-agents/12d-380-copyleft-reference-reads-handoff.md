# 12D-380 — Copyleft reference reads: trufi-core (GPL-3.0) + TREK (AGPL-3.0) (reading rung)

**Story rung:** 12D-380 (verify-then-read — copyleft roster)
· **Parents:** 12D-377 · **Policy footprint:** none added

## What this rung is

Two more CEO-batch sources read, licenses verified BEFORE read from
each publisher's own page (agreeing with the 12D-374 SPDX census).
Copyleft ⇒ REFERENCE-ONLY:

- **trufi-association/trufi-core (GPL-3.0, page verbatim GNU GPLv3
  statement)** — Flutter multi-modal transit app (live deployments
  Cochabamba/Accra/Addis Ababa; GTFS + OSM + OpenTripPlanner; OTP
  1.5/2.4/2.8; GTFS-RT live positions). Reference-read takeaways:
  core/screen/app package layering, pluggable map engine
  (ITrufiMapEngine, ships MapLibre GL), drop-in screen packages.
- **liketrek/TREK (AGPL-3.0, page verbatim "TREK is [AGPL v3]" +
  network-copyleft clause)** — self-hosted collaborative travel
  planner (NestJS 11 + React 19, SQLite, WebSocket sync, offline-first
  PWA, OSM/Wikipedia place enrichment, OSRM routing, KItinerary
  booking import, OIDC/passkeys, sandboxed plugin system, MCP server
  with 199 tools). Reference-read takeaways: offline-first PWA shape,
  plugin-sdk sandboxing, MCP-as-agent-integration.

## Copyleft roster now fully read (reference-only, no code enters the OS)

trufi-core GPL-3.0 · TREK AGPL-3.0 · OpenTripPlanner LGPL-3.0 (12D-376)
· Waymax non-commercial custom (12D-379, stricter than copyleft).

## Measured

- 2 sources registered + read through the REAL 12D-276 register +
  REAL 12D-283 supervised cycle: 4 chunks → 4 drafts AWAITING_REVIEW,
  modelCalls 4, remoteCalls 0.
- Snapshot (scratch): `.xiv-runtime/reading-sources-12d-380/
  copyleft-reference-reads.md` · driver:
  `.xiv-runtime/reading-driver-12d-380.ts` (never committed).

## Next candidates

1. Approval rung for the 12D-366..380 drafts (67 AWAITING_REVIEW,
   CEO-gated).
2. CEO-gated multi-MODEL rung; bounded CFPB structured-field
   extraction rung (all three CFPB layers verified 366/369/370).
3. Remaining no-license repos (6) stay unread pending upstream
   verification; UC3M-LP (ODbL + PII) stays never-to-model.