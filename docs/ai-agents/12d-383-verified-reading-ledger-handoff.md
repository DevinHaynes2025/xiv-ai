# 12D-383 — Verified Reading Ledger committed (knowledge-base rung)

**Story rung:** 12D-383 · **Parents:** 12D-382 · **Policy footprint:** none added

## What this rung is

The approved reading campaign (12D-366..382 — 76 approved drafts this
batch, 277 applied review decisions all-time) is aggregated into a
committed reference ledger: **docs/verified-reading-ledger-2026-09-19.md**.

Contents (all sourced from committed handoffs and measured driver
outputs — nothing new asserted):

- **A. Verified contracts**: CFPB CCDB API contract, data.gov
  per-dataset rights, CFPB release-22/24 removals + privacy posture,
  CC0/ODbL operative legal constraints, World Bank ODbL example, the
  license census.
- **B. Reference architectures read** (permissive + copyleft
  reference-only rows, each with license + takeaways): ribs, mobility
  catalogs, ovikl, ActivityViz, travel-db, ScreenQA, HowToDIV,
  cultural_familiarity, WaxalNLP (card-only), WikiProfile, Waymax
  paper, AnLoCOV paper, trufi-core, TREK, travel_db, opencode-md,
  awesome-open-transport, OpenTripPlanner.
- **C. Held closed by design**: 7 no-license repos, UC3M-LP (PII),
  Waymax code (custom non-commercial), copyleft code, person-mobility
  datasets.
- **D. Measured campaign totals**: 277 applied decisions, loopback
  model calls only, remoteCalls 0, the three live fail-closed proofs,
  honest flags pinned.

## Why this rung matters

The drafts' TEXT lived only in cycle packets (queues store hashes;
drivers logged counts) — the durable knowledge lives in the source
snapshots (scratch) and the committed handoffs. This ledger makes the
campaign's verified knowledge a first-class repo document the OS
(and every future rung) can cite, instead of leaving it scattered
across 17 handoffs.

## Measured

- 1 file committed: docs/verified-reading-ledger-2026-09-19.md
  (plus this handoff). No code changed; typecheck/test battery was
  green at the previous rung (1,511/1,511; both tsc 0) and no source
  has changed since.

## Next candidates

1. CEO-gated: multi-MODEL failover rung (ollama census first); bounded
   CFPB structured-field extraction rung (all three CFPB layers
   verified).
2. Wire the ledger into the mobile Verified Sources screen as a
   section header pointing to the campaign (frontend rung).
3. Continue reading-adjacent verification rungs as the CEO names new
   sources.